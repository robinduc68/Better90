import { useMemo } from 'react';

import {
  activeRoutineTags,
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
    return {
      date,
      isToday: date === today,
      progress: journeyProgress(journey, date),
      score,
      proteinG: index.proteinOn(date),
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
    };
  }, [index, date, today]);
}

export function sessionProgress(session: WorkoutSession) {
  return exerciseProgress(session);
}
