import { z } from 'zod';

const optionalMeasure = (min: number, max: number, label: string) =>
  z
    .number()
    .min(min, `${label} looks too low`)
    .max(max, `${label} looks too high`)
    .nullable();

export const onboardingSchema = z.object({
  name: z.string().trim().min(1, 'Add a name to continue').max(40, 'Keep it under 40 characters'),
  durationDays: z.union([z.literal(30), z.literal(60), z.literal(90)]),
  goals: z.array(z.enum(['build_muscle', 'lose_fat', 'recomposition', 'appearance', 'discipline', 'custom'])).min(1, 'Pick at least one'),
  customGoal: z.string().trim().max(80),
  heightCm: optionalMeasure(80, 250, 'Height'),
  weightKg: optionalMeasure(20, 400, 'Weight'),
  waistCm: optionalMeasure(30, 250, 'Waist'),
  chestCm: optionalMeasure(40, 250, 'Chest'),
  armCm: optionalMeasure(10, 80, 'Arm'),
  proteinTargetG: z.number().min(0).max(400),
  waterTargetMl: z.number().min(0).max(8000),
  sleepTargetMin: z.number().min(0).max(960),
  habitKeys: z.array(z.string()),
  customHabit: z.string().trim().max(40),
  gymDaysPerWeek: z.number().int().min(0).max(7),
  activities: z.array(z.enum(['football', 'running', 'cycling', 'other'])),
  reminders: z.object({ water: z.boolean(), workout: z.boolean(), habit: z.boolean(), journey: z.boolean() }),
});

export type OnboardingValues = z.infer<typeof onboardingSchema>;

export const ONBOARDING_DEFAULTS: OnboardingValues = {
  name: '',
  durationDays: 90,
  goals: [],
  customGoal: '',
  heightCm: null,
  weightKg: null,
  waistCm: null,
  chestCm: null,
  armCm: null,
  proteinTargetG: 120,
  waterTargetMl: 2500,
  sleepTargetMin: 450,
  habitKeys: ['morning_skincare', 'night_skincare'],
  customHabit: '',
  gymDaysPerWeek: 4,
  activities: [],
  reminders: { water: true, workout: true, habit: true, journey: true },
};

/** Fields validated before leaving each step. */
export const STEP_FIELDS = {
  welcome: [],
  name: ['name'],
  duration: ['durationDays'],
  goals: ['goals', 'customGoal'],
  baseline: ['heightCm', 'weightKg', 'waistCm', 'chestCm', 'armCm'],
  targets: ['proteinTargetG', 'waterTargetMl', 'sleepTargetMin'],
  routine: ['habitKeys', 'customHabit'],
  training: ['gymDaysPerWeek', 'activities'],
  reminders: ['reminders'],
  ready: [],
} as const satisfies Record<string, readonly (keyof OnboardingValues)[]>;

export type OnboardingStep = keyof typeof STEP_FIELDS;
export const STEPS = Object.keys(STEP_FIELDS) as OnboardingStep[];
