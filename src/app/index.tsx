import { Redirect } from 'expo-router';

import { useAppStore } from '@/store';

/** Entry: onboarding for new users, otherwise Today. */
export default function Index() {
  const hasJourney = useAppStore((s) => s.journey !== null);
  return <Redirect href={hasJourney ? '/(tabs)' : '/onboarding'} />;
}
