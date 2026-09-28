import { useMemo } from 'react';

import { getExercise } from '@/data/exercises';
import {
  computeStreaks,
  computeWeeklyReport,
  dateForDay,
  dayState,
  journeyEndDate,
  journeyProgress,
  totalWeeks,
  weekNumberFor,
  type DayState,
  type ISODate,
  type WeeklyReport,
} from '@/domain';
import { useJourneyIndex } from '@/hooks';

export interface CalendarDay {
  dayNumber: number;
  date: ISODate;
  state: DayState;
  score: number | null;
}

export function useJourneyModel(today: ISODate) {
  const index = useJourneyIndex();
  return useMemo(() => {
    if (!index) return null;
    const journey = index.data.journey;
    const end = journeyEndDate(journey);
    const lastScored = today < end ? today : end;
    const scores = index.scoreRange(journey.startDate, lastScored);
    const byDate = new Map(scores.map((s) => [s.date, s.score]));
    const days: CalendarDay[] = Array.from({ length: journey.durationDays }, (_, i) => {
      const date = dateForDay(journey, i + 1);
      const score = byDate.get(date) ?? null;
      return { dayNumber: i + 1, date, score, state: dayState(date, today, score, { start: journey.startDate, end }) };
    });
    const weeks = Array.from({ length: totalWeeks(journey.durationDays) }, (_, w) => days.slice(w * 7, w * 7 + 7));
    const currentWeek = Math.min(totalWeeks(journey.durationDays), Math.max(1, weekNumberFor(journey, today)));
    const streaks = computeStreaks(scores, lastScored);
    const weekScores = scores.filter((s) => weekNumberFor(journey, s.date) === currentWeek);
    const weeklyConsistency = weekScores.length ? weekScores.reduce((a, s) => a + s.score, 0) / weekScores.length : 0;
    return { journey, progress: journeyProgress(journey, today), days, weeks, currentWeek, streaks, weeklyConsistency };
  }, [index, today]);
}

export function useWeeklyReport(week: number, today: ISODate): WeeklyReport | null {
  const index = useJourneyIndex();
  return useMemo(() => (index ? computeWeeklyReport(index, week, today, (id) => getExercise(id)?.equipment ?? 'other') : null), [index, week, today]);
}
