import { addDays, diffDays } from './dates';
import type { ISODate, Journey, JourneyDuration } from './types';

export interface JourneyProgress {
  /** 1-based day in the journey, clamped to [1, duration]. */
  dayNumber: number;
  totalDays: number;
  fraction: number;
  daysRemaining: number;
  hasStarted: boolean;
  isFinished: boolean;
}

export function journeyEndDate(journey: Pick<Journey, 'startDate' | 'durationDays'>): ISODate {
  return addDays(journey.startDate, journey.durationDays - 1);
}

/** Raw 1-based day number, may be ≤ 0 (before start) or > duration (after end). */
export function rawDayNumber(journey: Pick<Journey, 'startDate'>, date: ISODate): number {
  return diffDays(journey.startDate, date) + 1;
}

export function dayNumberFor(journey: Pick<Journey, 'startDate' | 'durationDays'>, date: ISODate): number {
  return Math.min(journey.durationDays, Math.max(1, rawDayNumber(journey, date)));
}

export function dateForDay(journey: Pick<Journey, 'startDate'>, dayNumber: number): ISODate {
  return addDays(journey.startDate, dayNumber - 1);
}

export function journeyProgress(journey: Pick<Journey, 'startDate' | 'durationDays'>, today: ISODate): JourneyProgress {
  const raw = rawDayNumber(journey, today);
  const dayNumber = Math.min(journey.durationDays, Math.max(1, raw));
  return {
    dayNumber,
    totalDays: journey.durationDays,
    fraction: dayNumber / journey.durationDays,
    daysRemaining: Math.max(0, journey.durationDays - dayNumber),
    hasStarted: raw >= 1,
    isFinished: raw > journey.durationDays,
  };
}

const MILESTONE_DAYS = [7, 15, 30, 45, 60, 75, 90] as const;
const CHECKPOINT_DAYS = [1, 15, 30, 45, 60, 75, 90] as const;
/** Days after a checkpoint during which we gently suggest logging it. */
export const CHECKPOINT_WINDOW_DAYS = 3;

export function milestonesFor(duration: JourneyDuration): number[] {
  return MILESTONE_DAYS.filter((d) => d <= duration);
}

export function checkpointsFor(duration: JourneyDuration): number[] {
  return CHECKPOINT_DAYS.filter((d) => d <= duration);
}

/** The checkpoint whose logging window contains `dayNumber`, if any. */
export function activeCheckpoint(duration: JourneyDuration, dayNumber: number): number | null {
  for (const cp of checkpointsFor(duration)) {
    if (dayNumber >= cp && dayNumber <= cp + CHECKPOINT_WINDOW_DAYS) return cp;
  }
  return null;
}

/** Journey weeks are 7-day blocks from the start date (Week 1 = days 1–7). */
export function weekNumberFor(journey: Pick<Journey, 'startDate'>, date: ISODate): number {
  return Math.floor((rawDayNumber(journey, date) - 1) / 7) + 1;
}

export function weekRange(journey: Pick<Journey, 'startDate' | 'durationDays'>, week: number): { start: ISODate; end: ISODate } {
  const start = addDays(journey.startDate, (week - 1) * 7);
  const lastDay = Math.min(journey.durationDays, week * 7);
  return { start, end: addDays(journey.startDate, lastDay - 1) };
}

export function totalWeeks(duration: JourneyDuration): number {
  return Math.ceil(duration / 7);
}
