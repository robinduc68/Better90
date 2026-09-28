import { addDays, atClock, toISODate } from './dates';
import { formatLiters } from './format';
import { rawDayNumber } from './journey';
import type { ISODate, Journey, NotificationPreferences } from './types';

export type ReminderCategory = 'water' | 'workout' | 'habit' | 'journey';

export interface PlannedNotification {
  id: string;
  category: ReminderCategory;
  at: Date;
  title: string;
  body: string;
}

export interface TodayStatus {
  waterMl: number;
  /** 0–1 daily completion. */
  score: number;
  workoutCompletedToday: boolean;
  /** Evening-routine habits not done yet, e.g. ["Night skincare"]. */
  incompleteEveningHabits: string[];
}

export interface PlanInput {
  now: Date;
  prefs: NotificationPreferences;
  journey: Journey;
  today: TodayStatus;
  /** Name of the workout scheduled on a date, if any. */
  scheduledWorkout: (date: ISODate) => string | null;
  daysAhead?: number;
}

/** Evenly spaced reminder times in [start, end]. */
export function waterTimes(start: number, end: number, perDay: number): number[] {
  const n = Math.max(0, Math.min(8, Math.round(perDay)));
  if (n === 0 || end <= start) return [];
  if (n === 1) return [Math.round((start + end) / 2)];
  const step = (end - start) / (n - 1);
  return Array.from({ length: n }, (_, i) => Math.round(start + step * i));
}

/**
 * Builds the reminder schedule for today and the next few days.
 * Calm, factual copy — no guilt, no streak threats. Reminders that are
 * no longer useful (target reached, workout done) are skipped.
 */
export function planNotifications({ now, prefs, journey, today, scheduledWorkout, daysAhead = 3 }: PlanInput): PlannedNotification[] {
  const out: PlannedNotification[] = [];
  const todayISO = toISODate(now);
  const target = journey.waterTargetMl;

  for (let offset = 0; offset < daysAhead; offset++) {
    const date = addDays(todayISO, offset);
    const day = rawDayNumber(journey, date);
    if (day < 1 || day > journey.durationDays) continue;
    const isToday = offset === 0;
    const future = (at: Date) => at.getTime() > now.getTime() + 30_000;

    if (prefs.journey.enabled) {
      const at = atClock(date, prefs.journey.time);
      if (future(at)) {
        out.push({ id: `journey:${date}`, category: 'journey', at, title: `Day ${day} is ready.`, body: 'Open Level90 to see today.' });
      }
    }

    if (prefs.workout.enabled) {
      const name = scheduledWorkout(date);
      const at = atClock(date, prefs.workout.time);
      if (name && future(at) && !(isToday && today.workoutCompletedToday)) {
        out.push({ id: `workout:${date}`, category: 'workout', at, title: `Workout planned today: ${name}.`, body: 'Your last numbers are ready when you are.' });
      }
    }

    if (prefs.water.enabled && target > 0 && !(isToday && today.waterMl >= target)) {
      waterTimes(prefs.water.start, prefs.water.end, prefs.water.perDay).forEach((time, i) => {
        const at = atClock(date, time);
        if (!future(at)) return;
        out.push({
          id: `water:${date}:${i}`,
          category: 'water',
          at,
          title: 'A little water?',
          body: isToday
            ? `You're at ${formatLiters(today.waterMl)} / ${formatLiters(target)}L today.`
            : `Today's target is ${formatLiters(target)}L.`,
        });
      });
    }

    if (prefs.habit.enabled) {
      const at = atClock(date, prefs.habit.time);
      if (future(at)) {
        if (isToday) {
          const pct = Math.round(today.score * 100);
          if (today.incompleteEveningHabits.length > 0) {
            const first = today.incompleteEveningHabits[0]!;
            out.push({ id: `habit:${date}`, category: 'habit', at, title: `${first} still open.`, body: `You're ${pct}% through today's goals.` });
          } else if (today.score < 1) {
            out.push({ id: `habit:${date}`, category: 'habit', at, title: `You're ${pct}% through today's goals.`, body: 'One more task?' });
          }
        } else {
          out.push({ id: `habit:${date}`, category: 'habit', at, title: 'Evening check-in', body: "See what's left for today." });
        }
      }
    }
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}
