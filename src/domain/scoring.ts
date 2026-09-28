import { applicableSteps } from './habits';
import type { Habit, HabitLog, ISODate } from './types';

/**
 * Daily scoring. Isolated and configurable so the rules can evolve
 * without touching screens. The model is forgiving: partial progress
 * counts, and a day can count toward consistency without being 100%.
 */

export type ScoreItemKind = 'workout' | 'protein' | 'water' | 'sleep' | 'habit';

export interface ScoringConfig {
  weights: Record<ScoreItemKind, number>;
  thresholds: {
    /** Score at which a past day is shown as completed (✓). */
    complete: number;
    /** Below this a past day is "missed" (shown neutrally). */
    partial: number;
    /** Minimum score for a day to extend the streak ("showed up"). */
    streak: number;
  };
  /** Sleep within this many minutes of target counts as met. */
  sleepToleranceMin: number;
}

export const DEFAULT_SCORING: ScoringConfig = {
  weights: { workout: 2, protein: 1, water: 1, sleep: 1, habit: 1 },
  thresholds: { complete: 0.85, partial: 0.3, streak: 0.6 },
  sleepToleranceMin: 15,
};

export interface ScoreItem {
  key: string;
  kind: ScoreItemKind;
  label: string;
  /** 0–1 */
  progress: number;
  done: boolean;
  weight: number;
}

export interface DayInputs {
  date: ISODate;
  proteinG: number;
  proteinTargetG: number;
  waterMl: number;
  waterTargetMl: number;
  sleepMinutes: number | null;
  sleepTargetMin: number;
  habits: Habit[];
  habitLogs: HabitLog[];
  workoutPlanned: boolean;
  /** 0–1 progress of today's session; 1 when completed. */
  workoutProgress: number;
  workoutCompleted: boolean;
}

export type DayState = 'completed' | 'partial' | 'missed' | 'today' | 'future' | 'outside';

export interface DayScore {
  date: ISODate;
  items: ScoreItem[];
  score: number;
  doneCount: number;
  totalCount: number;
}

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);

/** Whether a habit existed (and was active) on a date. */
export function habitActiveOn(habit: Habit, date: ISODate): boolean {
  if (!habit.countsTowardScore) return false;
  if (habit.createdAt.slice(0, 10) > date) return false;
  if (habit.archivedAt && habit.archivedAt.slice(0, 10) <= date) return false;
  return true;
}

export function habitProgress(habit: Habit, log: HabitLog | undefined, applicableStepCount: number): { progress: number; done: boolean } {
  if (!log) return { progress: 0, done: false };
  if (habit.kind === 'boolean') {
    if (log.value >= 1) return { progress: 1, done: true };
    if (applicableStepCount > 0) return { progress: clamp01(log.stepsDone.length / applicableStepCount) * 0.99, done: false };
    return { progress: 0, done: false };
  }
  const target = habit.target ?? 1;
  const progress = clamp01(log.value / target);
  return { progress, done: log.value >= target };
}

export function scoreDay(input: DayInputs, config: ScoringConfig = DEFAULT_SCORING): DayScore {
  const items: ScoreItem[] = [];
  const w = config.weights;

  if (input.workoutPlanned || input.workoutCompleted) {
    items.push({
      key: 'workout',
      kind: 'workout',
      label: 'Workout',
      progress: input.workoutCompleted ? 1 : clamp01(input.workoutProgress),
      done: input.workoutCompleted,
      weight: w.workout,
    });
  }

  if (input.proteinTargetG > 0) {
    items.push({
      key: 'protein',
      kind: 'protein',
      label: 'Protein',
      progress: clamp01(input.proteinG / input.proteinTargetG),
      done: input.proteinG >= input.proteinTargetG,
      weight: w.protein,
    });
  }

  if (input.waterTargetMl > 0) {
    items.push({
      key: 'water',
      kind: 'water',
      label: 'Water',
      progress: clamp01(input.waterMl / input.waterTargetMl),
      done: input.waterMl >= input.waterTargetMl,
      weight: w.water,
    });
  }

  if (input.sleepTargetMin > 0) {
    const slept = input.sleepMinutes ?? 0;
    items.push({
      key: 'sleep',
      kind: 'sleep',
      label: 'Sleep',
      progress: clamp01(slept / input.sleepTargetMin),
      done: input.sleepMinutes !== null && slept >= input.sleepTargetMin - config.sleepToleranceMin,
      weight: w.sleep,
    });
  }

  for (const habit of input.habits) {
    if (!habitActiveOn(habit, input.date)) continue;
    const log = input.habitLogs.find((l) => l.habitId === habit.id && l.date === input.date);
    const { progress, done } = habitProgress(habit, log, applicableSteps(habit, input.date).length);
    items.push({ key: `habit:${habit.id}`, kind: 'habit', label: habit.name, progress, done, weight: w.habit });
  }

  const totalWeight = items.reduce((s, i) => s + i.weight, 0);
  const score = totalWeight === 0 ? 0 : items.reduce((s, i) => s + i.progress * i.weight, 0) / totalWeight;
  return {
    date: input.date,
    items,
    score,
    doneCount: items.filter((i) => i.done).length,
    totalCount: items.length,
  };
}

export function dayState(
  date: ISODate,
  today: ISODate,
  score: number | null,
  bounds: { start: ISODate; end: ISODate },
  config: ScoringConfig = DEFAULT_SCORING,
): DayState {
  if (date < bounds.start || date > bounds.end) return 'outside';
  if (date > today) return 'future';
  if (date === today) return 'today';
  const s = score ?? 0;
  if (s >= config.thresholds.complete) return 'completed';
  if (s >= config.thresholds.partial) return 'partial';
  return 'missed';
}

export interface StreakSummary {
  current: number;
  longest: number;
  /** Days that met the streak threshold. */
  showedUpDays: number;
  /** Average daily score across elapsed days (today included only once it counts). */
  consistency: number;
}

/**
 * `scores` must cover consecutive dates from journey start through `today`, ascending.
 * Today never breaks a streak while it is still in progress.
 */
export function computeStreaks(scores: DayScore[], today: ISODate, config: ScoringConfig = DEFAULT_SCORING): StreakSummary {
  const threshold = config.thresholds.streak;
  const counts = (s: DayScore) => s.score >= threshold;

  let longest = 0;
  let run = 0;
  let showedUpDays = 0;
  for (const s of scores) {
    if (counts(s)) {
      run += 1;
      showedUpDays += 1;
      longest = Math.max(longest, run);
    } else if (s.date !== today) {
      run = 0;
    }
  }

  let current = 0;
  for (let i = scores.length - 1; i >= 0; i--) {
    const s = scores[i]!;
    if (counts(s)) current += 1;
    else if (s.date === today) continue;
    else break;
  }

  const elapsed = scores.filter((s) => s.date < today || counts(s));
  const consistency = elapsed.length === 0 ? 0 : elapsed.reduce((sum, s) => sum + s.score, 0) / elapsed.length;

  return { current, longest, showedUpDays, consistency };
}
