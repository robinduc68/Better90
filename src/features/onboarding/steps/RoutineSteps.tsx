import { Bell, CalendarCheck, Droplet, Dumbbell, Moon } from 'lucide-react-native';
import { Controller } from 'react-hook-form';
import { View } from 'react-native';

import { ACTIVITY_OPTIONS, GOAL_OPTIONS } from '@/constants/goals';
import { HABIT_CATALOG, ONBOARDING_HABIT_KEYS } from '@/constants/habitCatalog';
import { FilterChip, makeStyles, SegmentedControl, Switch, Text, TextField, useTheme } from '@/design-system';
import { formatDuration, formatLiters } from '@/domain';

import { OptionRow } from '../components/OptionRow';
import { StepHeader } from '../components/StepHeader';
import type { OnboardingValues } from '../schema';
import type { StepProps } from './types';

export function RoutineStep({ form }: StepProps) {
  const styles = useStyles();
  const options = HABIT_CATALOG.filter((h) => ONBOARDING_HABIT_KEYS.includes(h.key));
  return (
    <View>
      <StepHeader eyebrow="Your routine" title="What do you want to do daily?" subtitle="Each one becomes a one-tap item on Today." />
      <Controller
        control={form.control}
        name="habitKeys"
        render={({ field }) => (
          <View style={styles.list}>
            {options.map((h) => {
              const selected = field.value.includes(h.key);
              return (
                <OptionRow
                  key={h.key}
                  label={h.name}
                  description={h.description}
                  selected={selected}
                  onPress={() => field.onChange(selected ? field.value.filter((k) => k !== h.key) : [...field.value, h.key])}
                />
              );
            })}
          </View>
        )}
      />
      <View style={styles.custom}>
        <Controller
          control={form.control}
          name="customHabit"
          render={({ field }) => (
            <TextField label="Custom habit" value={field.value} onChangeText={field.onChange} placeholder="e.g. Stretch 10 min" maxLength={40} hint="Optional. Tracked as done / not done." />
          )}
        />
      </View>
    </View>
  );
}

const GYM_DAYS = [0, 1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n) }));

export function TrainingStep({ form }: StepProps) {
  const styles = useStyles();
  return (
    <View>
      <StepHeader eyebrow="Training" title="How often will you train?" subtitle="Gym sessions per week." />
      <Controller
        control={form.control}
        name="gymDaysPerWeek"
        render={({ field }) => <SegmentedControl options={GYM_DAYS} value={field.value} onChange={field.onChange} accessibilityLabel="Gym days per week" />}
      />
      <Text variant="label" color="muted" style={styles.sectionLabel}>
        Other activities
      </Text>
      <Controller
        control={form.control}
        name="activities"
        render={({ field }) => (
          <View style={styles.chips}>
            {ACTIVITY_OPTIONS.map((a) => {
              const selected = field.value.includes(a.key);
              return (
                <FilterChip
                  key={a.key}
                  label={a.label}
                  selected={selected}
                  onPress={() => field.onChange(selected ? field.value.filter((k) => k !== a.key) : [...field.value, a.key])}
                />
              );
            })}
          </View>
        )}
      />
      <Text variant="caption" color="muted" style={styles.note}>
        Log these from Today whenever you play.
      </Text>
    </View>
  );
}

type ReminderKey = keyof OnboardingValues['reminders'];

const REMINDERS: { key: ReminderKey; title: string; body: string; icon: typeof Bell }[] = [
  { key: 'water', title: 'Water', body: '3 gentle reminders between 09:00 and 20:00. Stops once you hit your target.', icon: Droplet },
  { key: 'workout', title: 'Workout', body: 'A note on days you have a workout planned.', icon: Dumbbell },
  { key: 'habit', title: 'Evening check-in', body: "At 21:00, only if something's still open.", icon: Moon },
  { key: 'journey', title: 'Journey', body: '"Day 24 is ready." Each morning.', icon: CalendarCheck },
];

export function RemindersStep({ form }: StepProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View>
      <StepHeader eyebrow="Reminders" title="Helpful, never noisy." subtitle="Choose what you want. Change anytime." />
      <View style={styles.reminders}>
        {REMINDERS.map((r) => (
          <Controller
            key={r.key}
            control={form.control}
            name={`reminders.${r.key}`}
            render={({ field }) => (
              <View style={styles.reminder}>
                <View style={styles.reminderIcon}>
                  <r.icon size={18} color={colors.textSecondary} />
                </View>
                <View style={styles.reminderBody}>
                  <Text variant="bodyMedium">{r.title}</Text>
                  <Text variant="caption" color="muted">
                    {r.body}
                  </Text>
                </View>
                <Switch value={field.value} onValueChange={field.onChange} accessibilityLabel={`${r.title} reminders`} />
              </View>
            )}
          />
        ))}
      </View>
    </View>
  );
}

export function ReadyStep({ form }: StepProps) {
  const styles = useStyles();
  const v = form.watch();
  const goals = GOAL_OPTIONS.filter((g) => v.goals.includes(g.key)).map((g) => (g.key === 'custom' && v.customGoal ? v.customGoal : g.label));
  const rows: [string, string][] = [
    ['Goals', goals.join(' · ') || '—'],
    ['Protein', `${v.proteinTargetG} g`],
    ['Water', `${formatLiters(v.waterTargetMl)} L`],
    ['Sleep', formatDuration(v.sleepTargetMin)],
    ['Training', `${v.gymDaysPerWeek}× per week`],
    ['Daily habits', String(v.habitKeys.length + (v.customHabit.trim() ? 1 : 0))],
  ];
  return (
    <View style={styles.ready}>
      <Text variant="label" color="accent">
        Ready, {v.name.trim() || 'friend'}?
      </Text>
      <Text variant="hero" accessibilityRole="header" style={styles.readyTitle}>
        {v.durationDays} DAYS
      </Text>
      <Text variant="body" color="secondary">
        Day 1 starts today. Show up, log it, and watch it add up.
      </Text>
      <View style={styles.summary}>
        {rows.map(([k, val]) => (
          <View key={k} style={styles.summaryRow}>
            <Text variant="small" color="muted">
              {k}
            </Text>
            <Text variant="smallMedium" numberOfLines={1} style={styles.summaryValue} tabular>
              {val}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  list: { gap: t.spacing.xs },
  custom: { marginTop: t.spacing.lg },
  sectionLabel: { marginTop: t.spacing['2xl'], marginBottom: t.spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs },
  note: { marginTop: t.spacing.sm },
  reminders: { gap: t.spacing.xs },
  reminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    padding: t.spacing.md,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  reminderIcon: {
    width: 36,
    height: 36,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderBody: { flex: 1, gap: 2 },
  ready: { paddingTop: t.spacing['3xl'], gap: t.spacing.xs },
  readyTitle: { marginTop: t.spacing.xs },
  summary: {
    marginTop: t.spacing['2xl'],
    borderRadius: t.radius.card,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
    paddingHorizontal: t.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: t.spacing.md,
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  summaryValue: { flexShrink: 1, textAlign: 'right' },
}));
