import { JourneyIndex, planNotifications, todayISO, weekday, isHabitDone, habitLogFor, type PlannedNotification } from '@/domain';
import { useActiveWorkoutStore, useAppStore } from '@/store';

/** Builds the reminder plan from current local state. */
export function buildReminderPlan(now: Date = new Date()): PlannedNotification[] {
  const s = useAppStore.getState();
  if (!s.journey) return [];
  const active = useActiveWorkoutStore.getState().session;
  const index = new JourneyIndex({
    journey: s.journey,
    habits: s.habits,
    habitLogs: s.habitLogs,
    proteinLogs: s.proteinLogs,
    meals: s.meals,
    waterLogs: s.waterLogs,
    dailyLogs: s.dailyLogs,
    templates: s.templates,
    sessions: active ? [...s.sessions, active] : s.sessions,
  });
  const today = todayISO(now);
  const todayLogs = index.habitLogs.get(today) ?? [];
  const incompleteEveningHabits = index
    .activeHabitsOn(today)
    .filter((h) => h.timeOfDay === 'evening' && !isHabitDone(h, habitLogFor(todayLogs, h.id, today)))
    .map((h) => h.name);

  return planNotifications({
    now,
    prefs: s.notificationPrefs,
    journey: s.journey,
    today: {
      waterMl: index.waterOn(today),
      score: index.score(today).score,
      workoutCompletedToday: index.sessionsOn(today).some((x) => x.status === 'completed'),
      incompleteEveningHabits,
    },
    scheduledWorkout: (date) => {
      const wd = weekday(date);
      return s.templates.find((t) => !t.archivedAt && t.weekdays.includes(wd))?.name ?? null;
    },
  });
}
