import type { Habit, Journey, SessionExercise, WorkoutSession } from '../types';

export const NOW = '2026-09-01T08:00:00.000Z';

export function journey(partial: Partial<Journey> = {}): Journey {
  return {
    id: 'j1',
    startDate: '2026-09-01',
    durationDays: 90,
    goals: ['recomposition'],
    customGoal: null,
    proteinTargetG: 130,
    waterTargetMl: 2500,
    sleepTargetMin: 450,
    gymDaysPerWeek: 4,
    activities: [],
    status: 'active',
    createdAt: NOW,
    updatedAt: NOW,
    ...partial,
  };
}

export function habit(partial: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    templateKey: null,
    name: 'Habit',
    kind: 'boolean',
    target: null,
    unit: null,
    category: 'custom',
    timeOfDay: 'anytime',
    routineSteps: [],
    routineTags: [],
    countsTowardScore: true,
    sortOrder: 0,
    archivedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...partial,
  };
}

let seq = 0;
export const id = () => `id-${++seq}`;

export function exercise(exerciseId: string, sets: [number | null, number | null, boolean?][], targetReps = 10): SessionExercise {
  return {
    id: id(),
    exerciseId,
    targetSets: sets.length,
    targetReps,
    completedAt: null,
    sets: sets.map(([w, r, done = true]) => ({ id: id(), weightKg: w, reps: r, completedAt: done ? NOW : null })),
  };
}

export function session(date: string, exercises: SessionExercise[], partial: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: id(),
    templateId: 't1',
    name: 'Back + Shoulders',
    date,
    startedAt: `${date}T18:00:00.000Z`,
    endedAt: `${date}T19:00:00.000Z`,
    status: 'completed',
    exercises,
    updatedAt: `${date}T19:00:00.000Z`,
    ...partial,
  };
}
