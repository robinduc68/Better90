import type { TemplateExercise, WorkoutSession, WorkoutTemplate } from '@/domain';
import { newId } from '@/lib/id';
import { nowISO } from '@/lib/now';

import { upsertById, type GetState, type SetState } from './common';

export interface WorkoutActions {
  createTemplate: (input: { name: string; weekdays?: number[]; exercises?: Omit<TemplateExercise, 'id'>[] }) => string;
  updateTemplate: (id: string, patch: Partial<Pick<WorkoutTemplate, 'name' | 'weekdays'>>) => void;
  archiveTemplate: (id: string) => void;
  addTemplateExercise: (templateId: string, exerciseId: string) => void;
  updateTemplateExercise: (templateId: string, itemId: string, patch: Partial<Omit<TemplateExercise, 'id' | 'exerciseId'>>) => void;
  removeTemplateExercise: (templateId: string, itemId: string) => void;
  moveTemplateExercise: (templateId: string, itemId: string, direction: -1 | 1) => void;
  /** Stores a finished session. Completed sets are never dropped. */
  saveSession: (session: WorkoutSession) => void;
  deleteSession: (id: string) => void;
}

export function createWorkoutActions(set: SetState, get: GetState): WorkoutActions {
  const mutateTemplate = (id: string, fn: (t: WorkoutTemplate) => WorkoutTemplate) => {
    set((s) => ({ templates: s.templates.map((t) => (t.id === id ? { ...fn(t), updatedAt: nowISO() } : t)) }));
    get().enqueue('workout_templates', id);
  };

  return {
    createTemplate: ({ name, weekdays = [], exercises = [] }) => {
      const now = nowISO();
      const template: WorkoutTemplate = {
        id: newId(),
        name: name.trim() || 'Workout',
        weekdays,
        exercises: exercises.map((e) => ({ ...e, id: newId() })),
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      set((s) => ({ templates: [...s.templates, template] }));
      get().enqueue('workout_templates', template.id);
      return template.id;
    },
    updateTemplate: (id, patch) => mutateTemplate(id, (t) => ({ ...t, ...patch })),
    archiveTemplate: (id) => mutateTemplate(id, (t) => ({ ...t, archivedAt: nowISO() })),
    addTemplateExercise: (templateId, exerciseId) =>
      mutateTemplate(templateId, (t) => ({
        ...t,
        exercises: [...t.exercises, { id: newId(), exerciseId, targetSets: 3, targetReps: 10, restSeconds: null }],
      })),
    updateTemplateExercise: (templateId, itemId, patch) =>
      mutateTemplate(templateId, (t) => ({ ...t, exercises: t.exercises.map((e) => (e.id === itemId ? { ...e, ...patch } : e)) })),
    removeTemplateExercise: (templateId, itemId) =>
      mutateTemplate(templateId, (t) => ({ ...t, exercises: t.exercises.filter((e) => e.id !== itemId) })),
    moveTemplateExercise: (templateId, itemId, direction) =>
      mutateTemplate(templateId, (t) => {
        const idx = t.exercises.findIndex((e) => e.id === itemId);
        const target = idx + direction;
        if (idx < 0 || target < 0 || target >= t.exercises.length) return t;
        const next = t.exercises.slice();
        const [item] = next.splice(idx, 1);
        if (item) next.splice(target, 0, item);
        return { ...t, exercises: next };
      }),
    saveSession: (session) => {
      set((s) => ({ sessions: upsertById(s.sessions, session) }));
      get().enqueue('workout_sessions', session.id);
    },
    deleteSession: (id) => {
      set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) }));
      get().enqueue('workout_sessions', id, 'delete');
    },
  };
}
