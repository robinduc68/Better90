import { STARTER_TEMPLATES } from '@/constants/starterTemplates';
import { getExercise } from '@/data/exercises/library';
import {
  addDays,
  atClock,
  weightIncrement,
  weekday,
  type ActivityLog,
  type BodyMeasurement,
  type DailyLog,
  type Habit,
  type HabitLog,
  type ISODate,
  type Journey,
  type Meal,
  type Profile,
  type ProteinLog,
  type SessionExercise,
  type WaterLog,
  type WorkoutSession,
  type WorkoutTemplate,
} from '@/domain';
import type { AppData } from '@/store/types';

/**
 * Deterministic demo data for a fictional user ("Alex"), 90-day body
 * recomposition journey, currently on Day 23. Workout history follows the
 * progression rule (all target reps hit → +1 increment next session) so the
 * progressive-overload views have real signal.
 *
 * Pure: no Expo imports, so the SQL seed script can reuse it in Node.
 */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const START_WEIGHTS: Record<string, number> = {
  'lat-pulldown': 30,
  'chest-supported-row': 40,
  'reverse-pec-deck': 25,
  'lateral-raise': 7,
  'face-pull': 17.5,
  'bench-press': 50,
  'incline-dumbbell-press': 18,
  'cable-fly': 12.5,
  'triceps-pushdown': 20,
  'overhead-triceps-extension': 15,
  'back-squat': 60,
  'romanian-deadlift': 55,
  'leg-press': 100,
  'lying-leg-curl': 30,
  'standing-calf-raise': 50,
  'barbell-curl': 25,
  'hammer-curl': 12,
  'skull-crusher': 20,
  'hanging-leg-raise': 0,
};

export const DEMO_DAY = 23;

export function generateDemoData(today: ISODate, newId: () => string, seed = 90): Partial<AppData> {
  const rand = mulberry32(seed);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]!;
  const startDate = addDays(today, -(DEMO_DAY - 1));
  const created = atClock(startDate, 8 * 60).toISOString();

  const profile: Profile = { id: newId(), name: 'Alex', heightCm: 176, unitSystem: 'metric', createdAt: created, updatedAt: created };

  const journey: Journey = {
    id: newId(),
    startDate,
    durationDays: 90,
    goals: ['recomposition', 'discipline'],
    customGoal: null,
    proteinTargetG: 130,
    waterTargetMl: 2500,
    sleepTargetMin: 450,
    gymDaysPerWeek: 4,
    activities: ['football'],
    status: 'active',
    calorieTargetKcal: 2300,
    carbsTargetG: 260,
    fatTargetG: 70,
    createdAt: created,
    updatedAt: created,
  };

  const step = (label: string, tag: string | null = null) => ({ id: newId(), label, tag });
  const habit = (h: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt' | 'countsTowardScore'>): Habit => ({
    ...h,
    id: newId(),
    countsTowardScore: true,
    archivedAt: null,
    createdAt: created,
    updatedAt: created,
  });
  const morning = habit({
    templateKey: 'morning_skincare',
    name: 'Morning skincare',
    kind: 'boolean',
    target: null,
    unit: null,
    category: 'skincare',
    timeOfDay: 'morning',
    routineSteps: [step('Cleanser'), step('Vitamin C'), step('Moisturizer'), step('Sunscreen')],
    routineTags: [],
    sortOrder: 0,
  });
  const night = habit({
    templateKey: 'night_skincare',
    name: 'Night skincare',
    kind: 'boolean',
    target: null,
    unit: null,
    category: 'skincare',
    timeOfDay: 'evening',
    routineSteps: [step('Cleanser'), step('BHA', 'BHA NIGHT'), step('Clay mask', 'MASK NIGHT'), step('Moisturizer')],
    routineTags: [
      { tag: 'BHA NIGHT', weekdays: [2, 5] },
      { tag: 'MASK NIGHT', weekdays: [0] },
    ],
    sortOrder: 1,
  });
  const english = habit({
    templateKey: 'english',
    name: 'English',
    kind: 'duration',
    target: 60,
    unit: 'min',
    category: 'learning',
    timeOfDay: 'anytime',
    routineSteps: [],
    routineTags: [],
    sortOrder: 2,
  });
  const learning = habit({
    templateKey: 'professional_learning',
    name: 'Professional learning',
    kind: 'duration',
    target: 60,
    unit: 'min',
    category: 'learning',
    timeOfDay: 'anytime',
    routineSteps: [],
    routineTags: [],
    sortOrder: 3,
  });
  const habits = [morning, night, english, learning];

  // Schedule 4 templates so that today is a Back + Shoulders day.
  const todayWd = weekday(today);
  const offsets = [0, 1, 3, 5];
  const templates: WorkoutTemplate[] = STARTER_TEMPLATES.map((t, i) => ({
    id: newId(),
    name: t.name,
    weekdays: [(todayWd + offsets[i]!) % 7],
    exercises: t.exercises.map(([exerciseId, targetSets, targetReps]) => ({ id: newId(), exerciseId, targetSets, targetReps, restSeconds: null })),
    archivedAt: null,
    createdAt: created,
    updatedAt: created,
  }));

  // ---- Workout history (days 1..22), following the progression rule ----
  const current = new Map(Object.entries(START_WEIGHTS));
  const sessions: WorkoutSession[] = [];
  for (let day = 1; day < DEMO_DAY; day++) {
    const date = addDays(startDate, day - 1);
    const wd = weekday(date);
    const template = templates.find((t) => t.weekdays.includes(wd));
    if (!template) continue;
    if (day === 12) continue; // one skipped session — life happens
    const startMin = 18 * 60 + Math.floor(rand() * 60);
    const startedAt = atClock(date, startMin);
    let clock = startedAt.getTime() + 4 * 60_000;
    const exercises: SessionExercise[] = template.exercises.map((te) => {
      const ex = getExercise(te.exerciseId);
      const weight = current.get(te.exerciseId) ?? 0;
      let allHit = true;
      const sets = Array.from({ length: te.targetSets }, (_, i) => {
        const miss = i === 0 ? 0 : rand() < 0.2 ? (rand() < 0.6 ? 1 : 2) : 0;
        const reps = te.targetReps - miss;
        if (miss > 0) allHit = false;
        clock += (90 + Math.floor(rand() * 60)) * 1000;
        return { id: newId(), weightKg: ex?.isBodyweight ? null : weight, reps, completedAt: new Date(clock).toISOString() };
      });
      if (allHit && ex) current.set(te.exerciseId, Math.round((weight + weightIncrement(ex.equipment)) * 10) / 10);
      clock += 60_000;
      return {
        id: newId(),
        exerciseId: te.exerciseId,
        targetSets: te.targetSets,
        targetReps: te.targetReps,
        completedAt: new Date(clock).toISOString(),
        sets,
      };
    });
    sessions.push({
      id: newId(),
      templateId: template.id,
      name: template.name,
      date,
      startedAt: startedAt.toISOString(),
      endedAt: new Date(clock + 2 * 60_000).toISOString(),
      status: 'completed',
      exercises,
      updatedAt: new Date(clock).toISOString(),
    });
  }

  // ---- Daily logs ----
  const proteinLogs: ProteinLog[] = [];
  const meals: Meal[] = [];
  const meal = (date: ISODate, mealType: Meal['mealType'], name: string, min: number, kcal: number, p: number, c: number, f: number): Meal => ({
    id: newId(),
    date,
    mealType,
    name,
    loggedAt: atClock(date, min).toISOString(),
    calories: kcal,
    proteinG: p,
    carbsG: c,
    fatG: f,
    items: [],
    photoUri: null,
    photoStoragePath: null,
    source: 'manual',
    estimateConfidence: null,
    updatedAt: atClock(date, min).toISOString(),
  });
  const waterLogs: WaterLog[] = [];
  const dailyLogs: DailyLog[] = [];
  const habitLogs: HabitLog[] = [];
  const activityLogs: ActivityLog[] = [];
  const lowDays = new Set([5, 9]);

  for (let day = 1; day <= DEMO_DAY; day++) {
    const date = addDays(startDate, day - 1);
    const isToday = day === DEMO_DAY;
    const low = lowDays.has(day);
    const at = (min: number) => atClock(date, min).toISOString();

    if (isToday) {
      meals.push(meal(date, 'breakfast', 'Oats, berries & yogurt', 8 * 60 + 12, 502, 35, 56, 14));
      meals.push(meal(date, 'lunch', 'Chicken rice bowl', 12 * 60 + 40, 640, 48, 71, 15));
    } else if (day >= DEMO_DAY - 3) {
      meals.push(meal(date, 'breakfast', 'Eggs & toast', 8 * 60, 480, 30, 40, 20));
      meals.push(meal(date, 'dinner', 'Salmon, rice & greens', 19 * 60 + 15, 720, 45, 68, 26));
    }
    const proteinTotal = isToday ? 108 : low ? 70 + Math.floor(rand() * 20) : rand() < 0.78 ? 130 + Math.floor(rand() * 20) : 100 + Math.floor(rand() * 25);
    // Meals already carry protein; quick logs top up the rest of the day's total.
    let remaining = Math.max(0, proteinTotal - meals.filter((m) => m.date === date).reduce((a, m) => a + (m.proteinG ?? 0), 0));
    let t = 8 * 60;
    while (remaining > 0) {
      const g = Math.min(remaining, pick([20, 25, 30, 35, 40]));
      proteinLogs.push({ id: newId(), date, grams: g, loggedAt: at(t) });
      remaining -= g;
      t += 150 + Math.floor(rand() * 60);
    }

    const waterTotal = isToday ? 2000 : low ? 1250 : rand() < 0.7 ? 2500 + (rand() < 0.3 ? 250 : 0) : 1750 + (rand() < 0.5 ? 250 : 0);
    let w = waterTotal;
    t = 8 * 60 + 30;
    while (w > 0) {
      const ml = Math.min(w, rand() < 0.5 ? 250 : 500);
      waterLogs.push({ id: newId(), date, ml, loggedAt: at(t) });
      w -= ml;
      t += 70 + Math.floor(rand() * 40);
    }

    const sleep = isToday ? 452 : low ? 360 + Math.floor(rand() * 30) : 405 + Math.floor(rand() * 75);
    dailyLogs.push({ id: newId(), date, sleepMinutes: sleep, note: null, updatedAt: at(7 * 60) });

    const logHabit = (h: Habit, value: number, stepsDone: string[] = []) =>
      habitLogs.push({ id: newId(), habitId: h.id, date, value, stepsDone, updatedAt: at(12 * 60) });

    if (isToday) {
      logHabit(morning, 1, morning.routineSteps.map((s) => s.id));
      logHabit(english, 60);
      logHabit(learning, 45);
      continue;
    }
    if (!low || rand() < 0.5) logHabit(morning, 1, morning.routineSteps.map((s) => s.id));
    if (!low && rand() < 0.85) logHabit(night, 1, night.routineSteps.map((s) => s.id));
    logHabit(english, low ? 20 : rand() < 0.7 ? 60 : 30 + Math.floor(rand() * 4) * 10);
    logHabit(learning, low ? 0 : rand() < 0.6 ? 60 : 30 + Math.floor(rand() * 3) * 10);

    if (weekday(date) === (todayWd + 2) % 7) activityLogs.push({ id: newId(), date, activity: 'football', minutes: 90, loggedAt: at(19 * 60) });
  }

  const m = (day: number, weightKg: number, waistCm: number, chestCm: number, arm: number): BodyMeasurement => ({
    id: newId(),
    date: addDays(startDate, day - 1),
    weightKg,
    waistCm,
    chestCm,
    leftArmCm: arm,
    rightArmCm: arm + 0.3,
    bodyFatPct: null,
    updatedAt: atClock(addDays(startDate, day - 1), 7 * 60).toISOString(),
  });

  return {
    profile,
    journey,
    habits,
    habitLogs,
    proteinLogs,
    meals,
    waterLogs,
    dailyLogs,
    activityLogs,
    templates,
    sessions,
    measurements: [m(1, 65.8, 79, 94, 31.5), m(8, 66.0, 78.6, 94.2, 31.6), m(15, 66.3, 78.1, 95, 32), m(22, 66.3, 77.6, 95.4, 32.2)],
    photos: [],
  };
}
