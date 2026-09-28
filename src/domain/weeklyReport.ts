import { addDays, dateRange } from './dates';
import type { JourneyIndex } from './daily';
import { habitActiveOn, habitProgress, DEFAULT_SCORING, type ScoringConfig } from './scoring';
import { applicableSteps, habitLogFor } from './habits';
import { weekRange } from './journey';
import { summarizeSession } from './progression';
import type { Equipment, ISODate } from './types';
import { sessionVolume } from './workout';

export interface HitCount {
  key: string;
  label: string;
  hit: number;
  of: number;
}

export interface WeeklyReport {
  week: number;
  start: ISODate;
  end: ISODate;
  /** Days of this week already elapsed (≤ 7). */
  daysElapsed: number;
  isComplete: boolean;
  consistency: number;
  coreDone: number;
  coreTotal: number;
  workouts: HitCount;
  protein: HitCount;
  water: HitCount;
  habits: HitCount[];
  averageSleepMin: number | null;
  strongest: HitCount | null;
  focus: HitCount | null;
  volume: number;
  previousVolume: number | null;
  volumeDeltaPct: number | null;
  prCount: number;
}

export function computeWeeklyReport(
  index: JourneyIndex,
  week: number,
  today: ISODate,
  equipmentOf: (exerciseId: string) => Equipment,
  config: ScoringConfig = DEFAULT_SCORING,
): WeeklyReport {
  const { journey, sessions: allSessions } = index.data;
  const { start, end } = weekRange(journey, week);
  const lastElapsed = end < today ? end : today;
  const days = lastElapsed < start ? [] : dateRange(start, lastElapsed);
  const scores = days.map((d) => index.score(d, config));

  const consistency = scores.length === 0 ? 0 : scores.reduce((s, d) => s + d.score, 0) / scores.length;
  const coreDone = scores.reduce((n, s) => n + s.doneCount, 0);
  const coreTotal = scores.reduce((n, s) => n + s.totalCount, 0);

  const weekSessions = allSessions.filter((s) => s.status === 'completed' && s.date >= start && s.date <= end);
  const plannedDays = days.filter((d) => index.workoutPlannedOn(d)).length;
  const weekLength = dateRange(start, end).length;
  const plannedTarget = plannedDays > 0 ? plannedDays : Math.round((journey.gymDaysPerWeek * days.length) / 7);
  const workouts: HitCount = {
    key: 'workout',
    label: 'Workout',
    hit: weekSessions.length,
    of: Math.max(plannedTarget, Math.min(weekSessions.length, journey.gymDaysPerWeek)),
  };

  const protein: HitCount = {
    key: 'protein',
    label: 'Protein',
    hit: days.filter((d) => index.proteinOn(d) >= journey.proteinTargetG).length,
    of: days.length,
  };
  const water: HitCount = {
    key: 'water',
    label: 'Water',
    hit: days.filter((d) => index.waterOn(d) >= journey.waterTargetMl).length,
    of: days.length,
  };

  const habits: HitCount[] = index.data.habits
    .filter((h) => h.countsTowardScore && days.some((d) => habitActiveOn(h, d)))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((h) => {
      const activeDays = days.filter((d) => habitActiveOn(h, d));
      const hit = activeDays.filter((d) => {
        const log = habitLogFor(index.habitLogs.get(d) ?? [], h.id, d);
        return habitProgress(h, log, applicableSteps(h, d).length).done;
      }).length;
      return { key: h.id, label: h.name, hit, of: activeDays.length };
    });

  const sleeps = days.map((d) => index.sleepOn(d)).filter((v): v is number => v !== null);
  const averageSleepMin = sleeps.length === 0 ? null : sleeps.reduce((a, b) => a + b, 0) / sleeps.length;

  const candidates = [workouts, protein, water, ...habits].filter((c) => c.of > 0);
  const rate = (c: HitCount) => c.hit / c.of;
  const sorted = [...candidates].sort((a, b) => rate(b) - rate(a) || b.of - a.of);
  const strongest = sorted[0] && rate(sorted[0]) > 0 ? sorted[0] : null;
  const weakest = sorted[sorted.length - 1];
  const focus = weakest && rate(weakest) < 1 && weakest !== strongest ? weakest : null;

  const volume = weekSessions.reduce((s, x) => s + sessionVolume(x), 0);
  const prevStart = addDays(start, -7);
  const prevEnd = addDays(start, -1);
  const prevSessions = allSessions.filter((s) => s.status === 'completed' && s.date >= prevStart && s.date <= prevEnd);
  const previousVolume = week > 1 ? prevSessions.reduce((s, x) => s + sessionVolume(x), 0) : null;
  const prCount = weekSessions.reduce((n, s) => n + summarizeSession(s, allSessions, equipmentOf).prs.length, 0);

  return {
    week,
    start,
    end,
    daysElapsed: days.length,
    isComplete: end < today || days.length === weekLength,
    consistency,
    coreDone,
    coreTotal,
    workouts,
    protein,
    water,
    habits,
    averageSleepMin,
    strongest,
    focus,
    volume,
    previousVolume,
    volumeDeltaPct: previousVolume && previousVolume > 0 && volume > 0 ? (volume - previousVolume) / previousVolume : null,
    prCount,
  };
}
