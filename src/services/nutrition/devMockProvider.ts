import type { MealAnalysisResult, NutritionAnalysisProvider } from './types';

/**
 * DEVELOPMENT ONLY. Returns a fixed, clearly-labeled sample so the review UI
 * can be built and tested. It does not look at the image.
 */
export const devMockProvider: NutritionAnalysisProvider = {
  id: 'dev-mock',
  async analyzeMealImage(): Promise<MealAnalysisResult> {
    await new Promise((r) => setTimeout(r, 900));
    return {
      provider: 'dev-mock',
      isMock: true,
      mealName: 'Sample: chicken, rice & broccoli',
      estimatedCalories: 620,
      estimatedProtein: 46,
      estimatedCarbs: 71,
      estimatedFat: 14,
      confidence: 0.5,
      items: [
        { name: 'Grilled chicken', estimatedAmount: '150 g', calories: 250, protein: 40, carbs: 0, fat: 8 },
        { name: 'White rice', estimatedAmount: '1 cup', calories: 300, protein: 5, carbs: 65, fat: 1 },
        { name: 'Broccoli', estimatedAmount: '80 g', calories: 70, protein: 1, carbs: 6, fat: 5 },
      ],
    };
  },
};
