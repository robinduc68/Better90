import NetInfo from '@react-native-community/netinfo';

import { devMockProvider } from './devMockProvider';
import type { AnalysisOutcome, NutritionAnalysisProvider } from './types';

/**
 * Service boundary for meal photo analysis.
 *
 * No real provider is integrated yet. To add one, implement
 * `NutritionAnalysisProvider` (recommended: a Supabase Edge Function that
 * receives a private storage path, calls a vision model server-side, and
 * returns `MealAnalysisResult`) and return it from `resolveProvider()`.
 * Never ship provider API keys in the app.
 *
 * Development-only mock: set EXPO_PUBLIC_NUTRITION_ANALYSIS=dev-mock in a
 * __DEV__ build. Its output is labeled as mock data in the UI.
 */
function resolveProvider(): NutritionAnalysisProvider | null {
  if (__DEV__ && process.env.EXPO_PUBLIC_NUTRITION_ANALYSIS === 'dev-mock') return devMockProvider;
  return null;
}

export const nutritionAnalysis = {
  isAvailable(): boolean {
    return resolveProvider() !== null;
  },

  async analyzeMealImage(imageUri: string): Promise<AnalysisOutcome> {
    const provider = resolveProvider();
    if (!provider) return { status: 'unavailable', reason: 'not_configured' };
    if (provider.id !== devMockProvider.id) {
      const net = await NetInfo.fetch();
      if (net.isConnected === false) return { status: 'unavailable', reason: 'offline' };
    }
    try {
      return { status: 'ok', result: await provider.analyzeMealImage(imageUri) };
    } catch (e) {
      return { status: 'failed', message: e instanceof Error ? e.message : 'Analysis failed' };
    }
  },
};
