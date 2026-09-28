import { weekday } from './dates';
import type { ID, ISODate, ISODateTime, SessionExercise, WorkoutSession, WorkoutSet, WorkoutTemplate } from './types';

export const isSetCompleted = (s: WorkoutSet) => s.completedAt !== null;

export function setVolume(s: WorkoutSet): number {
  if (!isSetCompleted(s) || s.reps === null) return 0;
  return (s.weightKg ?? 0) * s.reps;
}

/** volume = Σ weight × reps over completed sets. */
export function exerciseVolume(ex: SessionExercise): number {
  return ex.sets.reduce((sum, s) => sum + setVolume(s), 0);
}

export function sessionVolume(session: WorkoutSession): number {
  return session.exercises.reduce((sum, ex) => sum + exerciseVolume(ex), 0);
}

export function completedSets(ex: SessionExercise): WorkoutSet[] {
  return ex.sets.filter(isSetCompleted);
}

export function completedSetCount(session: WorkoutSession): number {
  return session.exercises.reduce((n, ex) => n + completedSets(ex).length, 0);
}

export function isExerciseComplete(ex: SessionExercise): boolean {
  if (ex.completedAt) return true;
  return ex.sets.length > 0 && ex.sets.every(isSetCompleted);
}

export function exerciseProgress(session: WorkoutSession): { done: number; total: number; fraction: number } {
  const total = session.exercises.length;
  const done = session.exercises.filter(isExerciseComplete).length;
  return { done, total, fraction: total === 0 ? 0 : done / total };
}

export function sessionDurationSec(session: WorkoutSession, now: Date = new Date()): number {
  const end = session.endedAt ? new Date(session.endedAt).getTime() : now.getTime();
  return Math.max(0, Math.round((end - new Date(session.startedAt).getTime()) / 1000));
}

export function completedSessions(sessions: WorkoutSession[]): WorkoutSession[] {
  return sessions.filter((s) => s.status === 'completed').sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
}

export interface ExercisePerformance {
  session: WorkoutSession;
  exercise: SessionExercise;
}

/** Most recent completed session (excluding `excludeSessionId`) where the exercise had completed sets. */
export function lastPerformance(sessions: WorkoutSession[], exerciseId: ID, excludeSessionId?: ID): ExercisePerformance | null {
  for (const session of completedSessions(sessions)) {
    if (session.id === excludeSessionId) continue;
    const exercise = session.exercises.find((e) => e.exerciseId === exerciseId && completedSets(e).length > 0);
    if (exercise) return { session, exercise };
  }
  return null;
}

/** All completed performances of an exercise, oldest first. */
export function exerciseHistory(sessions: WorkoutSession[], exerciseId: ID, excludeSessionId?: ID): ExercisePerformance[] {
  const out: ExercisePerformance[] = [];
  for (const session of completedSessions(sessions)) {
    if (session.id === excludeSessionId) continue;
    for (const exercise of session.exercises) {
      if (exercise.exerciseId === exerciseId && completedSets(exercise).length > 0) out.push({ session, exercise });
    }
  }
  return out.reverse();
}

export interface IdFactory {
  (): ID;
}

/**
 * Creates a session from a template. Weight/reps are prefilled from the last
 * performance of each exercise so the user rarely has to type.
 */
export function buildSessionFromTemplate(
  template: WorkoutTemplate,
  history: WorkoutSession[],
  newId: IdFactory,
  now: Date,
  date: ISODate,
): WorkoutSession {
  const startedAt: ISODateTime = now.toISOString();
  return {
    id: newId(),
    templateId: template.id,
    name: template.name,
    date,
    startedAt,
    endedAt: null,
    status: 'active',
    updatedAt: startedAt,
    exercises: template.exercises.map((te) => buildSessionExercise(te.exerciseId, te.targetSets, te.targetReps, history, newId)),
  };
}

export function buildSessionExercise(
  exerciseId: ID,
  targetSets: number,
  targetReps: number | null,
  history: WorkoutSession[],
  newId: IdFactory,
): SessionExercise {
  const last = lastPerformance(history, exerciseId);
  const lastSets = last ? completedSets(last.exercise) : [];
  const count = Math.max(1, targetSets);
  const sets: WorkoutSet[] = Array.from({ length: count }, (_, i) => {
    const ref = lastSets[i] ?? lastSets[lastSets.length - 1];
    return {
      id: newId(),
      weightKg: ref?.weightKg ?? null,
      reps: ref?.reps ?? targetReps,
      completedAt: null,
    };
  });
  return { id: newId(), exerciseId, targetSets: count, targetReps, completedAt: null, sets };
}

/** Prefill for a newly added set: copy the previous set in the same exercise. */
export function nextSetPrefill(ex: SessionExercise): Pick<WorkoutSet, 'weightKg' | 'reps'> {
  const prev = ex.sets[ex.sets.length - 1];
  return { weightKg: prev?.weightKg ?? null, reps: prev?.reps ?? ex.targetReps };
}

export interface PlannedWorkout {
  template: WorkoutTemplate;
  /** True when the template is explicitly scheduled for this weekday. */
  scheduled: boolean;
}

/**
 * Today's workout: a template scheduled on this weekday, otherwise the
 * template done least recently (simple rotation) as a suggestion.
 */
export function plannedWorkoutFor(templates: WorkoutTemplate[], sessions: WorkoutSession[], date: ISODate): PlannedWorkout | null {
  const active = templates.filter((t) => !t.archivedAt && t.exercises.length > 0);
  if (active.length === 0) return null;
  const wd = weekday(date);
  const scheduled = active.find((t) => t.weekdays.includes(wd));
  if (scheduled) return { template: scheduled, scheduled: true };
  const lastDone = new Map<ID, string>();
  for (const s of completedSessions(sessions)) {
    if (s.templateId && !lastDone.has(s.templateId)) lastDone.set(s.templateId, s.startedAt);
  }
  const next = [...active].sort((a, b) => (lastDone.get(a.id) ?? '').localeCompare(lastDone.get(b.id) ?? ''))[0];
  return next ? { template: next, scheduled: false } : null;
}

/** Rough duration estimate: ~2.5 min per working set incl. rest. */
export function estimateTemplateMinutes(template: WorkoutTemplate): number {
  const sets = template.exercises.reduce((n, e) => n + e.targetSets, 0);
  return Math.max(10, Math.round((sets * 2.5) / 5) * 5);
}

export function sessionsOn(sessions: WorkoutSession[], date: ISODate): WorkoutSession[] {
  return sessions.filter((s) => s.date === date);
}
