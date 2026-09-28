import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { buildSessionExercise, nextSetPrefill, type SessionExercise, type WorkoutSession, type WorkoutSet } from '@/domain';
import { newId } from '@/lib/id';
import { nowISO } from '@/lib/now';
import { persistStorage, STORAGE_KEYS } from '@/lib/storage';

export interface RestTimer {
  startedAt: number;
  endsAt: number;
  durationSec: number;
  exerciseId: string | null;
  notificationId: string | null;
}

interface ActiveWorkoutState {
  session: WorkoutSession | null;
  rest: RestTimer | null;
  /** Index of the exercise card in focus. */
  focusIndex: number;
  start: (session: WorkoutSession) => void;
  updateSet: (exerciseItemId: string, setId: string, patch: Partial<Pick<WorkoutSet, 'weightKg' | 'reps'>>) => void;
  /** Toggles completion. Returns true when the set is now completed. */
  toggleSet: (exerciseItemId: string, setId: string) => boolean;
  addSet: (exerciseItemId: string) => void;
  removeSet: (exerciseItemId: string, setId: string) => void;
  addExercise: (exerciseId: string, history: WorkoutSession[]) => void;
  removeExercise: (exerciseItemId: string) => void;
  moveExercise: (exerciseItemId: string, direction: -1 | 1) => void;
  /** Flags the exercise done/undone without touching individual sets. */
  setExerciseComplete: (exerciseItemId: string, complete: boolean) => void;
  setFocusIndex: (index: number) => void;
  startRest: (durationSec: number, exerciseId: string | null, notificationId: string | null) => void;
  extendRest: (seconds: number, notificationId: string | null) => void;
  clearRest: () => void;
  /** Finalizes the session and clears local active state. */
  finish: () => WorkoutSession | null;
  discard: () => void;
}

/**
 * The in-progress workout lives in its own persisted store so every set is
 * written to disk immediately — independent of network or the main data store.
 */
export const useActiveWorkoutStore = create<ActiveWorkoutState>()(
  persist(
    (set, get) => {
      const mutate = (fn: (s: WorkoutSession) => WorkoutSession) =>
        set((st) => (st.session ? { session: { ...fn(st.session), updatedAt: nowISO() } } : {}));
      const mutateExercise = (id: string, fn: (e: SessionExercise) => SessionExercise) =>
        mutate((s) => ({ ...s, exercises: s.exercises.map((e) => (e.id === id ? fn(e) : e)) }));

      return {
        session: null,
        rest: null,
        focusIndex: 0,
        start: (session) => set({ session, rest: null, focusIndex: 0 }),
        updateSet: (exId, setId, patch) =>
          mutateExercise(exId, (e) => ({ ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) })),
        toggleSet: (exId, setId) => {
          let completed = false;
          mutateExercise(exId, (e) => {
            const sets = e.sets.map((s) => {
              if (s.id !== setId) return s;
              completed = s.completedAt === null;
              return { ...s, completedAt: completed ? nowISO() : null };
            });
            const allDone = sets.length > 0 && sets.every((s) => s.completedAt !== null);
            return { ...e, sets, completedAt: allDone ? (e.completedAt ?? nowISO()) : null };
          });
          return completed;
        },
        addSet: (exId) =>
          mutateExercise(exId, (e) => ({
            ...e,
            completedAt: null,
            sets: [...e.sets, { id: newId(), ...nextSetPrefill(e), completedAt: null }],
          })),
        removeSet: (exId, setId) =>
          mutateExercise(exId, (e) => {
            const sets = e.sets.filter((s) => s.id !== setId);
            const allDone = sets.length > 0 && sets.every((s) => s.completedAt !== null);
            return { ...e, sets, completedAt: allDone ? (e.completedAt ?? nowISO()) : null };
          }),
        addExercise: (exerciseId, history) =>
          mutate((s) => ({ ...s, exercises: [...s.exercises, buildSessionExercise(exerciseId, 3, 10, history, newId)] })),
        removeExercise: (exId) => mutate((s) => ({ ...s, exercises: s.exercises.filter((e) => e.id !== exId) })),
        moveExercise: (exId, direction) =>
          mutate((s) => {
            const idx = s.exercises.findIndex((e) => e.id === exId);
            const target = idx + direction;
            if (idx < 0 || target < 0 || target >= s.exercises.length) return s;
            const next = s.exercises.slice();
            const [item] = next.splice(idx, 1);
            if (item) next.splice(target, 0, item);
            return { ...s, exercises: next };
          }),
        setExerciseComplete: (exId, complete) => mutateExercise(exId, (e) => ({ ...e, completedAt: complete ? nowISO() : null })),
        setFocusIndex: (focusIndex) => set({ focusIndex }),
        startRest: (durationSec, exerciseId, notificationId) => {
          const now = Date.now();
          set({ rest: { startedAt: now, endsAt: now + durationSec * 1000, durationSec, exerciseId, notificationId } });
        },
        extendRest: (seconds, notificationId) =>
          set((st) =>
            st.rest ? { rest: { ...st.rest, endsAt: st.rest.endsAt + seconds * 1000, durationSec: st.rest.durationSec + seconds, notificationId } } : {},
          ),
        clearRest: () => set({ rest: null }),
        finish: () => {
          const session = get().session;
          if (!session) return null;
          const endedAt = nowISO();
          // Only completed sets become history; unfinished rows were never lifted.
          const finished: WorkoutSession = {
            ...session,
            status: 'completed',
            endedAt,
            updatedAt: endedAt,
            exercises: session.exercises
              .map((e) => ({ ...e, sets: e.sets.filter((s) => s.completedAt !== null) }))
              .filter((e) => e.sets.length > 0)
              .map((e) => ({ ...e, completedAt: e.completedAt ?? endedAt })),
          };
          set({ session: null, rest: null, focusIndex: 0 });
          return finished;
        },
        discard: () => set({ session: null, rest: null, focusIndex: 0 }),
      };
    },
    {
      name: STORAGE_KEYS.activeWorkout,
      storage: persistStorage,
      version: 1,
      partialize: (s) => ({ session: s.session, rest: s.rest, focusIndex: s.focusIndex }),
    },
  ),
);
