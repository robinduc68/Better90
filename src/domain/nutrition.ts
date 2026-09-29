import type { ISODate, Meal, MealType, ProteinLog } from './types';

export interface NutritionTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  /** Protein from quick logs (shakes, snacks without a meal). */
  quickProteinG: number;
  mealCount: number;
}

/**
 * Single derivation of daily nutrition: meals + quick protein logs.
 * Everything that shows a daily total goes through here.
 */
export function nutritionTotals(date: ISODate, proteinLogs: ProteinLog[], meals: Meal[]): NutritionTotals {
  const quick = proteinLogs.filter((l) => l.date === date).reduce((s, l) => s + l.grams, 0);
  const dayMeals = meals.filter((m) => m.date === date);
  const sum = (k: 'calories' | 'proteinG' | 'carbsG' | 'fatG') => dayMeals.reduce((s, m) => s + (m[k] ?? 0), 0);
  return {
    calories: sum('calories'),
    proteinG: quick + sum('proteinG'),
    carbsG: sum('carbsG'),
    fatG: sum('fatG'),
    quickProteinG: quick,
    mealCount: dayMeals.length,
  };
}

export const MEAL_TYPES: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snack' },
];

export const MEAL_TYPE_LABEL: Record<MealType, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };

/** Sensible default by time of day; the user can change it. */
export function mealTypeForTime(d: Date): MealType {
  const h = d.getHours();
  if (h < 11) return 'breakfast';
  if (h < 16) return 'lunch';
  if (h < 21) return 'dinner';
  return 'snack';
}
