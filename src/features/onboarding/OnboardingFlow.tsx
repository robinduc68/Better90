import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { AppHeader, AppScreen, Button, makeStyles, ProgressBar, Text } from '@/design-system';
import { todayISO } from '@/domain';
import { rescheduleReminders } from '@/features/notifications/useReminderScheduler';
import { nowISO } from '@/lib/now';
import { analytics } from '@/services/analytics';
import { haptics } from '@/services/haptics';
import { requestPermission } from '@/services/notifications';
import { useAppStore } from '@/store';

import { buildOnboardingResult, suggestedProtein } from './createJourney';
import { ONBOARDING_DEFAULTS, onboardingSchema, STEP_FIELDS, STEPS, type OnboardingValues } from './schema';
import { BaselineStep, TargetsStep } from './steps/BodySteps';
import { DurationStep, GoalsStep, NameStep, WelcomeStep } from './steps/IntroSteps';
import { ReadyStep, RemindersStep, RoutineStep, TrainingStep } from './steps/RoutineSteps';

const COUNTED = STEPS.length - 1; // welcome isn't counted

export function OnboardingFlow({ onDemo }: { onDemo?: () => void }) {
  const styles = useStyles();
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: ONBOARDING_DEFAULTS,
    mode: 'onTouched',
  });

  const step = STEPS[index] ?? 'welcome';
  const isLast = index === STEPS.length - 1;

  const next = async () => {
    const valid = await form.trigger([...STEP_FIELDS[step]]);
    if (!valid) return;
    if (step === 'baseline' && !form.getFieldState('proteinTargetG').isDirty) {
      form.setValue('proteinTargetG', suggestedProtein(form.getValues('weightKg')));
    }
    if (step === 'reminders' && Object.values(form.getValues('reminders')).some(Boolean)) {
      await requestPermission().catch(() => undefined);
    }
    if (isLast) return finish();
    setIndex((i) => Math.min(STEPS.length - 1, i + 1));
  };

  const back = () => setIndex((i) => Math.max(0, i - 1));

  const finish = form.handleSubmit((values) => {
    setSubmitting(true);
    const result = buildOnboardingResult(values, todayISO(), nowISO());
    completeOnboarding(result);
    analytics.track('onboarding_completed', { duration_days: values.durationDays, habit_count: result.habits.length });
    analytics.track('journey_started', { duration_days: values.durationDays });
    haptics.success();
    rescheduleReminders(200);
    router.replace('/(tabs)');
  });

  const label = step === 'welcome' ? 'Get started' : isLast ? 'Start my journey' : 'Continue';

  return (
    <AppScreen
      scroll={step !== 'welcome'}
      keyboardAware
      header={
        step === 'welcome' ? null : (
          <View>
            <AppHeader leading="back" onLeadingPress={back} center={<Text variant="caption" color="muted" tabular>{`${index} of ${COUNTED}`}</Text>} />
            <View style={styles.progress}>
              <ProgressBar value={index / COUNTED} height={2} accessibilityLabel={`Step ${index} of ${COUNTED}`} />
            </View>
          </View>
        )
      }
      footer={
        <View style={styles.footer}>
          <Button label={label} onPress={next} loading={submitting} fullWidth />
          {step === 'welcome' && onDemo ? <Button label="Explore with demo data" variant="ghost" size="md" onPress={onDemo} /> : null}
        </View>
      }
    >
      <Animated.View key={step} entering={FadeIn.duration(250)} exiting={FadeOut.duration(120)} style={styles.flex}>
        {step === 'welcome' && <WelcomeStep />}
        {step === 'name' && <NameStep form={form} />}
        {step === 'duration' && <DurationStep form={form} />}
        {step === 'goals' && <GoalsStep form={form} />}
        {step === 'baseline' && <BaselineStep form={form} />}
        {step === 'targets' && <TargetsStep form={form} />}
        {step === 'routine' && <RoutineStep form={form} />}
        {step === 'training' && <TrainingStep form={form} />}
        {step === 'reminders' && <RemindersStep form={form} />}
        {step === 'ready' && <ReadyStep form={form} />}
      </Animated.View>
    </AppScreen>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  progress: { paddingHorizontal: t.layout.screenPadding },
  footer: { gap: t.spacing.xxs },
}));
