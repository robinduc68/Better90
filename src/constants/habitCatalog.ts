import type { Habit, HabitCategory, HabitKind, TimeOfDay } from '@/domain';

export interface HabitTemplate {
  key: string;
  name: string;
  kind: HabitKind;
  target: number | null;
  unit: string | null;
  category: HabitCategory;
  timeOfDay: TimeOfDay;
  steps: string[];
  description: string;
}

/** Predefined habits offered in onboarding and in Profile → Habits. */
export const HABIT_CATALOG: HabitTemplate[] = [
  {
    key: 'morning_skincare',
    name: 'Morning skincare',
    kind: 'boolean',
    target: null,
    unit: null,
    category: 'skincare',
    timeOfDay: 'morning',
    steps: ['Cleanser', 'Vitamin C', 'Moisturizer', 'Sunscreen'],
    description: 'Checklist routine',
  },
  {
    key: 'night_skincare',
    name: 'Night skincare',
    kind: 'boolean',
    target: null,
    unit: null,
    category: 'skincare',
    timeOfDay: 'evening',
    steps: ['Cleanser', 'Moisturizer'],
    description: 'Checklist routine',
  },
  { key: 'english', name: 'English', kind: 'duration', target: 60, unit: 'min', category: 'learning', timeOfDay: 'anytime', steps: [], description: '60 min' },
  {
    key: 'professional_learning',
    name: 'Professional learning',
    kind: 'duration',
    target: 60,
    unit: 'min',
    category: 'learning',
    timeOfDay: 'anytime',
    steps: [],
    description: '60 min',
  },
  { key: 'reading', name: 'Reading', kind: 'duration', target: 20, unit: 'min', category: 'reading', timeOfDay: 'evening', steps: [], description: '20 min' },
  { key: 'steps', name: 'Steps', kind: 'count', target: 10000, unit: 'steps', category: 'movement', timeOfDay: 'anytime', steps: [], description: '10,000 steps' },
  { key: 'posture', name: 'Posture', kind: 'boolean', target: null, unit: null, category: 'movement', timeOfDay: 'anytime', steps: [], description: 'Done / not done' },
  { key: 'meditation', name: 'Meditation', kind: 'duration', target: 10, unit: 'min', category: 'mind', timeOfDay: 'anytime', steps: [], description: '10 min' },
];

export const ONBOARDING_HABIT_KEYS = ['morning_skincare', 'night_skincare', 'english', 'professional_learning', 'reading', 'steps'];

export function habitFromTemplate(
  t: HabitTemplate,
  ids: () => string,
  sortOrder: number,
  now: string,
): Habit {
  return {
    id: ids(),
    templateKey: t.key,
    name: t.name,
    kind: t.kind,
    target: t.target,
    unit: t.unit,
    category: t.category,
    timeOfDay: t.timeOfDay,
    routineSteps: t.steps.map((label) => ({ id: ids(), label, tag: null })),
    routineTags: [],
    countsTowardScore: true,
    sortOrder,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}
