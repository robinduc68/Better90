/**
 * Contract for image-based meal estimation.
 *
 * Results are ESTIMATES. The UI must always present them as such and let the
 * user edit every value before a meal is saved.
 */
export interface MealAnalysisItem {
  name: string;
  estimatedAmount?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface MealAnalysisResult {
  mealName?: string;
  estimatedCalories?: number;
  estimatedProtein?: number;
  estimatedCarbs?: number;
  estimatedFat?: number;
  /** 0–1 */
  confidence?: number;
  items?: MealAnalysisItem[];
  /** Which provider produced this; 'dev-mock' must never reach production users. */
  provider: string;
  /** True for development mock output so the UI can label it loudly. */
  isMock: boolean;
}

export type AnalysisOutcome =
  | { status: 'ok'; result: MealAnalysisResult }
  | { status: 'unavailable'; reason: 'not_configured' | 'offline' }
  | { status: 'failed'; message: string };

export interface NutritionAnalysisProvider {
  readonly id: string;
  analyzeMealImage(imageUri: string): Promise<MealAnalysisResult>;
}
