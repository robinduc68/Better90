import { router } from 'expo-router';

import { OnboardingFlow } from '@/features/onboarding/OnboardingFlow';
import { loadDemoData } from '@/data/seed/loadDemo';
import { demoToolsEnabled } from '@/lib/env';

export default function OnboardingScreen() {
  return (
    <OnboardingFlow
      onDemo={
        demoToolsEnabled
          ? () => {
              loadDemoData();
              router.replace('/(tabs)');
            }
          : undefined
      }
    />
  );
}
