import type { Meal } from '@/domain';
import { nowISO } from '@/lib/now';

import { upsertById, type GetState, type SetState } from './common';

export interface MealActions {
  saveMeal: (meal: Omit<Meal, 'updatedAt'>) => void;
  deleteMeal: (id: string) => Meal | null;
}

export function createMealActions(set: SetState, get: GetState): MealActions {
  return {
    saveMeal: (meal) => {
      const next: Meal = { ...meal, updatedAt: nowISO() };
      set((s) => ({ meals: upsertById(s.meals, next) }));
      get().enqueue('meals', next.id);
    },
    deleteMeal: (id) => {
      const meal = get().meals.find((m) => m.id === id) ?? null;
      set((s) => ({ meals: s.meals.filter((m) => m.id !== id) }));
      get().enqueue('meals', id, 'delete');
      return meal;
    },
  };
}
