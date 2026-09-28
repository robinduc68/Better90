import type { Equipment, SessionExercise, WorkoutSession, WorkoutSet } from './types';
import { completedSets, exerciseHistory, exerciseVolume, sessionVolume, type ExercisePerformance } from './workout';

/**
 * Rule-based progressive-overload engine.
 *
 * It only *describes* performance and offers optional suggestions.
 * It never modifies templates or prefilled values — the user decides.
 * Not coaching or medical advice.
 */

export interface TopSet {
  weightKg: number;
  reps: number;
}

export type Suggestion =
  | { kind: 'increase_weight'; message: string; nextWeightKg: number }
  | { kind: 'keep_building'; message: string };

export interface ExerciseInsight {
  hasHistory: boolean;
  previousDate: string | null;
  previousSets: Pick<WorkoutSet, 'weightKg' | 'reps'>[];
  previousTopSet: TopSet | null;
  /** Heaviest completed weight in any previous session. */
  previousBestWeight: number | null;
  bestSet: TopSet | null;
  previousVolume: number | null;
  currentTopSet: TopSet | null;
  currentVolume: number;
  /** Current top weight − previous session's top weight. */
  weightDeltaKg: number | null;
  volumeDeltaPct: number | null;
  isWeightPR: boolean;
  isRepPR: boolean;
  /** Suggestion derived from the *previous* session, shown before lifting. */
  suggestion: Suggestion | null;
}

/** Heaviest completed set; ties broken by reps. */
export function topSet(sets: WorkoutSet[]): TopSet | null {
  let best: TopSet | null = null;
  for (const s of sets) {
    if (!s.completedAt || s.reps === null || s.reps <= 0) continue;
    const w = s.weightKg ?? 0;
    if (!best || w > best.weightKg || (w === best.weightKg && s.reps > best.reps)) best = { weightKg: w, reps: s.reps };
  }
  return best;
}

/** Epley estimated 1RM — used only for charting trends. */
export function estimatedOneRepMax(weightKg: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export function weightIncrement(equipment: Equipment): number {
  switch (equipment) {
    case 'dumbbell':
      return 2;
    case 'bodyweight':
      return 0;
    default:
      return 2.5;
  }
}

/**
 * "All target sets reached" → suggest a small weight increase next time.
 * Requires every target set completed at ≥ target reps at one working weight.
 */
export function suggestionFor(ex: SessionExercise, equipment: Equipment): Suggestion | null {
  const done = completedSets(ex);
  const target = ex.targetReps;
  if (!target || done.length < ex.targetSets || done.length === 0) return null;
  const weights = new Set(done.map((s) => s.weightKg ?? 0));
  const top = Math.max(...weights);
  const allHit = done.every((s) => (s.reps ?? 0) >= target);
  const increment = weightIncrement(equipment);
  if (allHit && weights.size === 1 && increment > 0 && top > 0) {
    return {
      kind: 'increase_weight',
      message: 'All target sets reached. Consider increasing weight next session.',
      nextWeightKg: Math.round((top + increment) * 100) / 100,
    };
  }
  if (allHit && increment === 0) {
    return { kind: 'keep_building', message: 'All target sets reached. Consider adding reps next session.' };
  }
  return null;
}

export function analyzeExercise(
  history: WorkoutSession[],
  current: SessionExercise,
  currentSessionId: string,
  equipment: Equipment,
): ExerciseInsight {
  const past = exerciseHistory(history, current.exerciseId, currentSessionId);
  const last: ExercisePerformance | undefined = past[past.length - 1];
  const lastSets = last ? completedSets(last.exercise) : [];
  const previousTopSet = last ? topSet(last.exercise.sets) : null;

  let previousBestWeight: number | null = null;
  let bestSet: TopSet | null = null;
  const repsAtWeight = new Map<number, number>();
  for (const p of past) {
    for (const s of completedSets(p.exercise)) {
      const w = s.weightKg ?? 0;
      const r = s.reps ?? 0;
      previousBestWeight = previousBestWeight === null ? w : Math.max(previousBestWeight, w);
      if (!bestSet || w > bestSet.weightKg || (w === bestSet.weightKg && r > bestSet.reps)) bestSet = { weightKg: w, reps: r };
      repsAtWeight.set(w, Math.max(repsAtWeight.get(w) ?? 0, r));
    }
  }

  const currentTopSet = topSet(current.sets);
  const currentVolume = exerciseVolume(current);
  const previousVolume = last ? exerciseVolume(last.exercise) : null;

  const isWeightPR =
    previousBestWeight !== null && currentTopSet !== null && currentTopSet.weightKg > previousBestWeight && currentTopSet.weightKg > 0;

  let isRepPR = false;
  if (!isWeightPR && past.length > 0) {
    for (const s of completedSets(current)) {
      const w = s.weightKg ?? 0;
      const prev = repsAtWeight.get(w);
      if (prev !== undefined && (s.reps ?? 0) > prev) {
        isRepPR = true;
        break;
      }
    }
  }

  return {
    hasHistory: past.length > 0,
    previousDate: last?.session.date ?? null,
    previousSets: lastSets.map((s) => ({ weightKg: s.weightKg, reps: s.reps })),
    previousTopSet,
    previousBestWeight,
    bestSet,
    previousVolume,
    currentTopSet,
    currentVolume,
    weightDeltaKg: previousTopSet && currentTopSet ? currentTopSet.weightKg - previousTopSet.weightKg : null,
    volumeDeltaPct: previousVolume && previousVolume > 0 && currentVolume > 0 ? (currentVolume - previousVolume) / previousVolume : null,
    isWeightPR,
    isRepPR,
    suggestion: last ? suggestionFor(last.exercise, equipment) : null,
  };
}

export interface SessionPR {
  exerciseId: string;
  kind: 'weight' | 'reps';
  weightKg: number;
  deltaKg: number | null;
}

export interface SessionSummary {
  exerciseCount: number;
  setCount: number;
  volume: number;
  previousVolume: number | null;
  volumeDeltaPct: number | null;
  prs: SessionPR[];
}

/** Compares a finished session with the previous session of the same template (or same name). */
export function summarizeSession(
  session: WorkoutSession,
  history: WorkoutSession[],
  equipmentOf: (exerciseId: string) => Equipment,
): SessionSummary {
  const previous = history
    .filter(
      (s) =>
        s.status === 'completed' &&
        s.id !== session.id &&
        s.startedAt < session.startedAt &&
        (session.templateId ? s.templateId === session.templateId : s.name === session.name),
    )
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))[0];

  const volume = sessionVolume(session);
  const previousVolume = previous ? sessionVolume(previous) : null;
  const prs: SessionPR[] = [];
  for (const ex of session.exercises) {
    const insight = analyzeExercise(history, ex, session.id, equipmentOf(ex.exerciseId));
    if (insight.isWeightPR && insight.currentTopSet) {
      prs.push({
        exerciseId: ex.exerciseId,
        kind: 'weight',
        weightKg: insight.currentTopSet.weightKg,
        deltaKg: insight.previousBestWeight !== null ? insight.currentTopSet.weightKg - insight.previousBestWeight : null,
      });
    } else if (insight.isRepPR && insight.currentTopSet) {
      prs.push({ exerciseId: ex.exerciseId, kind: 'reps', weightKg: insight.currentTopSet.weightKg, deltaKg: null });
    }
  }

  const exercisesWithSets = session.exercises.filter((e) => completedSets(e).length > 0);
  return {
    exerciseCount: exercisesWithSets.length,
    setCount: exercisesWithSets.reduce((n, e) => n + completedSets(e).length, 0),
    volume,
    previousVolume,
    volumeDeltaPct: previousVolume && previousVolume > 0 ? (volume - previousVolume) / previousVolume : null,
    prs,
  };
}

export interface StrengthPoint {
  date: string;
  sessionId: string;
  topWeightKg: number;
  topReps: number;
  volume: number;
  estimated1RM: number;
  sets: Pick<WorkoutSet, 'weightKg' | 'reps'>[];
}

/** Chronological strength history for charts and the exercise history screen. */
export function strengthSeries(history: WorkoutSession[], exerciseId: string): StrengthPoint[] {
  return exerciseHistory(history, exerciseId).flatMap(({ session, exercise }) => {
    const top = topSet(exercise.sets);
    if (!top) return [];
    return [
      {
        date: session.date,
        sessionId: session.id,
        topWeightKg: top.weightKg,
        topReps: top.reps,
        volume: exerciseVolume(exercise),
        estimated1RM: estimatedOneRepMax(top.weightKg, top.reps),
        sets: completedSets(exercise).map((s) => ({ weightKg: s.weightKg, reps: s.reps })),
      },
    ];
  });
}

/** Change in top-set weight from first to latest session. */
export function strengthGain(history: WorkoutSession[], exerciseId: string): { first: number; latest: number; deltaKg: number } | null {
  const series = strengthSeries(history, exerciseId);
  if (series.length < 2) return null;
  const first = series[0]!.topWeightKg;
  const latest = series[series.length - 1]!.topWeightKg;
  return { first, latest, deltaKg: latest - first };
}
