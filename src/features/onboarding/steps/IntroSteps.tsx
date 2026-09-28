import { Controller } from 'react-hook-form';
import { View } from 'react-native';

import { GOAL_OPTIONS } from '@/constants/goals';
import { makeStyles, PressableScale, Text, TextField, Wordmark } from '@/design-system';
import type { GoalKey, JourneyDuration } from '@/domain';

import { OptionRow } from '../components/OptionRow';
import { StepHeader } from '../components/StepHeader';
import type { StepProps } from './types';

export function WelcomeStep() {
  const styles = useStyles();
  return (
    <View style={styles.welcome}>
      <Wordmark size="md" />
      <View style={styles.hero}>
        <Text variant="hero" accessibilityRole="header">
          90 DAYS.
        </Text>
        <Text variant="hero" color="accent">
          A BETTER YOU.
        </Text>
        <Text variant="body" color="secondary" style={styles.heroSub}>
          Track the habits that actually change you — training, nutrition, routine and sleep, in one place.
        </Text>
      </View>
    </View>
  );
}

export function NameStep({ form }: StepProps) {
  return (
    <View>
      <StepHeader eyebrow="Let's start" title="What should we call you?" />
      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <TextField
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="Your name"
            autoFocus
            autoCapitalize="words"
            autoComplete="given-name"
            returnKeyType="done"
            maxLength={40}
            error={fieldState.error?.message}
            accessibilityLabel="Your name"
          />
        )}
      />
    </View>
  );
}

const DURATIONS: { value: JourneyDuration; title: string; caption: string }[] = [
  { value: 30, title: '30 days', caption: 'A focused sprint' },
  { value: 60, title: '60 days', caption: 'A real habit reset' },
  { value: 90, title: '90 days', caption: 'The full transformation' },
];

export function DurationStep({ form }: StepProps) {
  const styles = useStyles();
  return (
    <View>
      <StepHeader eyebrow="Your journey" title="How long is your journey?" subtitle="You can see every day of it on your calendar." />
      <Controller
        control={form.control}
        name="durationDays"
        render={({ field }) => (
          <View style={styles.durations}>
            {DURATIONS.map((d) => {
              const selected = field.value === d.value;
              return (
                <PressableScale
                  key={d.value}
                  onPress={() => field.onChange(d.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${d.title}, ${d.caption}`}
                  style={[styles.duration, selected && styles.durationSelected]}
                >
                  <Text variant="metricL" color={selected ? 'accent' : 'primary'}>
                    {d.value}
                  </Text>
                  <View style={styles.durationBody}>
                    <Text variant="bodySemibold">{d.title}</Text>
                    <Text variant="caption" color="muted">
                      {d.caption}
                    </Text>
                  </View>
                  <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <View style={styles.radioDot} /> : null}</View>
                </PressableScale>
              );
            })}
          </View>
        )}
      />
    </View>
  );
}

export function GoalsStep({ form }: StepProps) {
  const styles = useStyles();
  const goals = form.watch('goals');
  return (
    <View>
      <StepHeader eyebrow="Your goals" title="What are you building?" subtitle="Pick one or more." />
      <Controller
        control={form.control}
        name="goals"
        render={({ field, fieldState }) => (
          <View style={styles.list}>
            {GOAL_OPTIONS.map((g) => {
              const selected = field.value.includes(g.key);
              return (
                <OptionRow
                  key={g.key}
                  label={g.label}
                  selected={selected}
                  onPress={() =>
                    field.onChange(selected ? field.value.filter((x: GoalKey) => x !== g.key) : [...field.value, g.key])
                  }
                />
              );
            })}
            {fieldState.error ? (
              <Text variant="caption" color="danger">
                {fieldState.error.message}
              </Text>
            ) : null}
          </View>
        )}
      />
      {goals.includes('custom') ? (
        <View style={styles.customGoal}>
          <Controller
            control={form.control}
            name="customGoal"
            render={({ field }) => (
              <TextField label="Your goal" value={field.value} onChangeText={field.onChange} placeholder="e.g. Run a half marathon" maxLength={80} />
            )}
          />
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  welcome: { flex: 1, paddingTop: t.spacing.md },
  hero: { flex: 1, justifyContent: 'center', gap: t.spacing.xxs, paddingBottom: t.spacing['3xl'] },
  heroSub: { marginTop: t.spacing.md, maxWidth: 320 },
  list: { gap: t.spacing.xs },
  customGoal: { marginTop: t.spacing.md },
  durations: { gap: t.spacing.sm },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    padding: t.spacing.lg,
    borderRadius: t.radius.card,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  durationSelected: { borderColor: t.colors.accentSubtle, backgroundColor: t.colors.accentMuted },
  durationBody: { flex: 1, gap: 2 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: t.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: t.colors.accent },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: t.colors.accent },
}));
