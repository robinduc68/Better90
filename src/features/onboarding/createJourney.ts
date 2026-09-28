import { HABIT_CATALOG, habitFromTemplate } from '@/constants/habitCatalog';
import type { Habit } from '@/domain';
import { newId } from '@/lib/id';
import { defaultNotificationPrefs } from '@/store';
import type { OnboardingResult } from '@/store/slices/journeySlice';

import type { OnboardingValues } from './schema';

/** Turns onboarding answers into the initial journey, habits and baseline. Day 1 = today. */
export function buildOnboardingResult(v: OnboardingValues, today: string, now: string): OnboardingResult {
  const habits: Habit[] = [];
  v.habitKeys.forEach((key) => {
    const t = HABIT_CATALOG.find((h) => h.key === key);
    if (t) habits.push(habitFromTemplate(t, newId, habits.length, now));
  });
  if (v.customHabit.trim()) {
    habits.push({
      id: newId(),
      templateKey: null,
      name: v.customHabit.trim(),
      kind: 'boolean',
      target: null,
      unit: null,
      category: 'custom',
      timeOfDay: 'anytime',
      routineSteps: [],
      routineTags: [],
      countsTowardScore: true,
      sortOrder: habits.length,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  const hasBaseline = [v.weightKg, v.waistCm, v.chestCm, v.armCm].some((x) => x !== null);
  const prefs = defaultNotificationPrefs(now);

  return {
    profile: { id: newId(), name: v.name.trim(), heightCm: v.heightCm, unitSystem: 'metric', createdAt: now, updatedAt: now },
    journey: {
      id: newId(),
      startDate: today,
      durationDays: v.durationDays,
      goals: v.goals,
      customGoal: v.goals.includes('custom') && v.customGoal.trim() ? v.customGoal.trim() : null,
      proteinTargetG: v.proteinTargetG,
      waterTargetMl: v.waterTargetMl,
      sleepTargetMin: v.sleepTargetMin,
      gymDaysPerWeek: v.gymDaysPerWeek,
      activities: v.activities,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    habits,
    measurement: hasBaseline
      ? {
          id: newId(),
          date: today,
          weightKg: v.weightKg,
          waistCm: v.waistCm,
          chestCm: v.chestCm,
          leftArmCm: v.armCm,
          rightArmCm: v.armCm,
          bodyFatPct: null,
          updatedAt: now,
        }
      : null,
    notificationPrefs: {
      ...prefs,
      water: { ...prefs.water, enabled: v.reminders.water },
      workout: { ...prefs.workout, enabled: v.reminders.workout },
      habit: { ...prefs.habit, enabled: v.reminders.habit },
      journey: { ...prefs.journey, enabled: v.reminders.journey },
    },
  };
}

/** A starting point only — the user adjusts it. Not nutrition advice. */
export function suggestedProtein(weightKg: number | null): number {
  if (!weightKg) return 120;
  return Math.min(250, Math.max(60, Math.round((weightKg * 1.8) / 5) * 5));
}
