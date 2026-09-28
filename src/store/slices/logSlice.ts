import type { ActivityKey, Habit, HabitLog, ISODate } from '@/domain';
import { newId } from '@/lib/id';
import { nowISO } from '@/lib/now';

import { upsertById, type GetState, type SetState } from './common';

export interface LogActions {
  addProtein: (date: ISODate, grams: number) => string;
  addWater: (date: ISODate, ml: number) => string;
  removeProteinLog: (id: string) => void;
  removeWaterLog: (id: string) => void;
  setSleep: (date: ISODate, minutes: number | null) => void;
  addActivity: (date: ISODate, activity: ActivityKey, minutes: number) => string;
  removeActivity: (id: string) => void;
  setHabitValue: (habitId: string, date: ISODate, value: number) => void;
  /** Boolean habits: toggles done. Returns the new done state. */
  toggleHabit: (habitId: string, date: ISODate) => boolean;
  /**
   * Toggles a routine step. When every applicable step is done the habit
   * is marked complete automatically. Returns the habit's done state.
   */
  toggleHabitStep: (habitId: string, date: ISODate, stepId: string, applicableStepIds: string[]) => boolean;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, patch: Partial<Omit<Habit, 'id' | 'createdAt'>>) => void;
  archiveHabit: (id: string) => void;
  moveHabit: (id: string, direction: -1 | 1) => void;
}

export function createLogActions(set: SetState, get: GetState): LogActions {
  const writeHabitLog = (habitId: string, date: ISODate, patch: (prev: HabitLog | undefined) => Partial<HabitLog>) => {
    const prev = get().habitLogs.find((l) => l.habitId === habitId && l.date === date);
    const next: HabitLog = {
      id: prev?.id ?? newId(),
      habitId,
      date,
      value: prev?.value ?? 0,
      stepsDone: prev?.stepsDone ?? [],
      ...patch(prev),
      updatedAt: nowISO(),
    };
    set((s) => ({ habitLogs: upsertById(s.habitLogs, next) }));
    get().enqueue('habit_logs', next.id);
    return next;
  };

  return {
    addProtein: (date, grams) => {
      const log = { id: newId(), date, grams, loggedAt: nowISO() };
      set((s) => ({ proteinLogs: [...s.proteinLogs, log] }));
      get().enqueue('protein_logs', log.id);
      return log.id;
    },
    addWater: (date, ml) => {
      const log = { id: newId(), date, ml, loggedAt: nowISO() };
      set((s) => ({ waterLogs: [...s.waterLogs, log] }));
      get().enqueue('water_logs', log.id);
      return log.id;
    },
    removeProteinLog: (id) => {
      set((s) => ({ proteinLogs: s.proteinLogs.filter((l) => l.id !== id) }));
      get().enqueue('protein_logs', id, 'delete');
    },
    removeWaterLog: (id) => {
      set((s) => ({ waterLogs: s.waterLogs.filter((l) => l.id !== id) }));
      get().enqueue('water_logs', id, 'delete');
    },
    setSleep: (date, minutes) => {
      const prev = get().dailyLogs.find((d) => d.date === date);
      const next = { id: prev?.id ?? newId(), date, sleepMinutes: minutes, note: prev?.note ?? null, updatedAt: nowISO() };
      set((s) => ({ dailyLogs: upsertById(s.dailyLogs, next) }));
      get().enqueue('daily_logs', next.id);
    },
    addActivity: (date, activity, minutes) => {
      const log = { id: newId(), date, activity, minutes, loggedAt: nowISO() };
      set((s) => ({ activityLogs: [...s.activityLogs, log] }));
      get().enqueue('activity_logs', log.id);
      return log.id;
    },
    removeActivity: (id) => {
      set((s) => ({ activityLogs: s.activityLogs.filter((l) => l.id !== id) }));
      get().enqueue('activity_logs', id, 'delete');
    },
    setHabitValue: (habitId, date, value) => {
      writeHabitLog(habitId, date, () => ({ value: Math.max(0, value) }));
    },
    toggleHabit: (habitId, date) => {
      const habit = get().habits.find((h) => h.id === habitId);
      const log = writeHabitLog(habitId, date, (prev) => {
        const done = (prev?.value ?? 0) >= 1;
        // Completing a checklist habit in one tap marks every step done, and vice versa.
        return { value: done ? 0 : 1, stepsDone: done ? [] : (habit?.routineSteps.map((s) => s.id) ?? []) };
      });
      return log.value >= 1;
    },
    toggleHabitStep: (habitId, date, stepId, applicableStepIds) => {
      const log = writeHabitLog(habitId, date, (prev) => {
        const steps = new Set(prev?.stepsDone ?? []);
        if (steps.has(stepId)) steps.delete(stepId);
        else steps.add(stepId);
        const allDone = applicableStepIds.length > 0 && applicableStepIds.every((id) => steps.has(id));
        return { stepsDone: [...steps], value: allDone ? 1 : 0 };
      });
      return log.value >= 1;
    },
    addHabit: (habit) => {
      set((s) => ({ habits: [...s.habits, habit] }));
      get().enqueue('user_habits', habit.id);
    },
    updateHabit: (id, patch) => {
      set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch, updatedAt: nowISO() } : h)) }));
      get().enqueue('user_habits', id);
    },
    archiveHabit: (id) => {
      const now = nowISO();
      set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, archivedAt: now, updatedAt: now } : h)) }));
      get().enqueue('user_habits', id);
    },
    moveHabit: (id, direction) => {
      const active = get()
        .habits.filter((h) => !h.archivedAt)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const idx = active.findIndex((h) => h.id === id);
      const swap = active[idx + direction];
      const current = active[idx];
      if (!current || !swap) return;
      const now = nowISO();
      set((s) => ({
        habits: s.habits.map((h) =>
          h.id === current.id
            ? { ...h, sortOrder: swap.sortOrder, updatedAt: now }
            : h.id === swap.id
              ? { ...h, sortOrder: current.sortOrder, updatedAt: now }
              : h,
        ),
      }));
      get().enqueue('user_habits', current.id);
      get().enqueue('user_habits', swap.id);
    },
  };
}
