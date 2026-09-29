import { useMemo } from 'react';

import {
  activeRoutineTags,
  addDays,
  DEFAULT_SCORING,
  applicableSteps,
  computeStreaks,
  exerciseProgress,
  habitLogFor,
  journeyEndDate,
  journeyProgress,
  plannedWorkoutFor,
  type DayScore,
  type Habit,
  type HabitLog,
  type ISODate,
  type JourneyProgress,
  type PlannedWorkout,
  type RoutineStep,
  type StreakSummary,
  type WorkoutSession,
} from '@/domain';
import { useJourneyIndex } from '@/hooks';

export interface HabitItem {
  habit: Habit;
  log: HabitLog | undefined;
  steps: RoutineStep[];
  tags: string[];
  done: boolean;
  progress: number;
}

export interface DayModel {
  date: ISODate;
  isToday: boolean;
  progress: JourneyProgress;
  score: DayScore;
  proteinG: number;
  calories: number;
  waterMl: number;
  sleepMinutes: number | null;
  habits: HabitItem[];
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
  completedSession: WorkoutSession | null;
  planned: PlannedWorkout | null;
  workoutPlanned: boolean;
  streaks: StreakSummary;
  /** First unfinished item, used for the "Next" hint. */
  nextLabel: string | null;
  /** Last 7 days ending on this date, for the consistency heatmap. */
  last7: { date: ISODate; score: number | null; counted: boolean; isToday: boolean }[];
  /** Share of elapsed days that counted toward the streak. */
  showedUpRate: number;
}

/** Everything a day view needs, derived from local data. */
export function useDayModel(date: ISODate, today: ISODate): DayModel | null {
  const index = useJourneyIndex();
  return useMemo(() => {
    if (!index) return null;
    const { journey, templates, sessions: allSessions } = index.data;
    const score = index.score(date);
    const logs = index.habitLogs.get(date) ?? [];
    const habits: HabitItem[] = index.activeHabitsOn(date).map((habit) => {
      const log = habitLogFor(logs, habit.id, date);
      const item = score.items.find((i) => i.key === `habit:${habit.id}`);
      return {
        habit,
        log,
        steps: applicableSteps(habit, date),
        tags: activeRoutineTags(habit, date),
        done: item?.done ?? false,
        progress: item?.progress ?? 0,
      };
    });
    const sessions = index.sessionsOn(date);
    const start = journey.startDate;
    const end = date < today ? date : today;
    const streakScores = index.scoreRange(start, end > journeyEndDate(journey) ? journeyEndDate(journey) : end);
    const next = score.items.find((i) => !i.done);
    const threshold = DEFAULT_SCORING.thresholds.streak;
    const byDate = new Map(streakScores.map((x) => [x.date, x.score]));
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(date, i - 6);
      const sc = byDate.get(d) ?? null;
      return { date: d, score: sc, counted: sc !== null && sc >= threshold, isToday: d === today };
    });
    const elapsed = streakScores.filter((x) => x.date < today || x.score >= threshold).length;
    return {
      date,
      isToday: date === today,
      progress: journeyProgress(journey, date),
      score,
      proteinG: index.proteinOn(date),
      calories: index.nutritionOn(date).calories,
      waterMl: index.waterOn(date),
      sleepMinutes: index.sleepOn(date),
      habits,
      sessions,
      activeSession: sessions.find((s) => s.status === 'active') ?? null,
      completedSession: sessions.find((s) => s.status === 'completed') ?? null,
      planned: plannedWorkoutFor(templates, allSessions, date),
      workoutPlanned: index.workoutPlannedOn(date),
      streaks: computeStreaks(streakScores, end),
      nextLabel: next ? next.label : null,
      last7,
      showedUpRate: elapsed ? streakScores.filter((x) => x.score >= threshold).length / elapsed : 0,
    };
  }, [index, date, today]);
}

export function sessionProgress(session: WorkoutSession) {
  return exerciseProgress(session);
}
