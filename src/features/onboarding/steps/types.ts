import type { UseFormReturn } from 'react-hook-form';

import type { OnboardingValues } from '../schema';

export interface StepProps {
  form: UseFormReturn<OnboardingValues>;
}
