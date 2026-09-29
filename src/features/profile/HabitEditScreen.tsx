import { router, useLocalSearchParams } from 'expo-router';
import { Plus, Trash2, X } from 'lucide-react-native';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import {
  AppHeader,
  AppScreen,
  Button,
  Card,
  ConfirmSheet,
  EmptyState,
  FilterChip,
  IconButton,
  makeStyles,
  PressableScale,
  SectionHeader,
  SegmentedControl,
  Stepper,
  Switch,
  Text,
  TextField,
  useTheme,
} from '@/design-system';
import { WEEKDAY_LETTER, WEEKDAY_SHORT, type Habit, type HabitKind, type TimeOfDay } from '@/domain';
import { newId } from '@/lib/id';
import { useAppStore } from '@/store';

const KINDS: { value: HabitKind; label: string }[] = [
  { value: 'boolean', label: 'Done / not' },
  { value: 'duration', label: 'Minutes' },
  { value: 'count', label: 'Count' },
];
const TIMES: { value: TimeOfDay; label: string }[] = [
  { value: 'morning', label: 'Morning' },
  { value: 'anytime', label: 'Anytime' },
  { value: 'evening', label: 'Evening' },
];
const WEEK = [1, 2, 3, 4, 5, 6, 0];
const SUGGESTED_TAGS = ['BHA NIGHT', 'MASK NIGHT'];

export function HabitEditScreen() {
  const styles = useStyles();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const habit = useAppStore((s) => s.habits.find((h) => h.id === id));
  const updateHabit = useAppStore((s) => s.updateHabit);
  const archiveHabit = useAppStore((s) => s.archiveHabit);
  const [name, setName] = useState(habit?.name ?? '');
  const [newStep, setNewStep] = useState('');
  const [confirm, setConfirm] = useState(false);

  if (!habit || habit.archivedAt) {
    return (
      <AppScreen header={<AppHeader />}>
        <EmptyState title="Habit not found" message="It may have been removed." />
      </AppScreen>
    );
  }

  const patch = (p: Partial<Habit>) => updateHabit(habit.id, p);
  const tags = habit.routineTags;

  const setKind = (kind: HabitKind) =>
    patch({ kind, target: kind === 'boolean' ? null : (habit.target ?? (kind === 'duration' ? 30 : 10)), unit: kind === 'count' ? (habit.unit ?? 'times') : kind === 'duration' ? 'min' : null });

  const addStep = () => {
    const label = newStep.trim();
    if (!label) return;
    patch({ routineSteps: [...habit.routineSteps, { id: newId(), label, tag: null }] });
    setNewStep('');
  };

  const toggleTagDay = (tag: string, day: number) => {
    const existing = tags.find((t) => t.tag === tag);
    const next = existing
      ? tags.map((t) => (t.tag === tag ? { ...t, weekdays: t.weekdays.includes(day) ? t.weekdays.filter((d) => d !== day) : [...t.weekdays, day] } : t))
      : [...tags, { tag, weekdays: [day] }];
    patch({ routineTags: next.filter((t) => t.weekdays.length > 0) });
  };

  return (
    <AppScreen keyboardAware header={<AppHeader title="Edit habit" />}>
      <TextField label="Name" value={name} onChangeText={setName} onBlur={() => patch({ name: name.trim() || habit.name })} maxLength={60} returnKeyType="done" />

      <SectionHeader title="Type" />
      <SegmentedControl options={KINDS} value={habit.kind} onChange={setKind} accessibilityLabel="Habit type" />
      {habit.kind !== 'boolean' ? (
        <Card variant="flat" style={styles.target}>
          <Text variant="label" color="muted">
            Daily target
          </Text>
          <Stepper
            label="Daily target"
            value={habit.target ?? 1}
            onChange={(v) => patch({ target: v })}
            step={habit.kind === 'duration' ? 5 : (habit.target ?? 0) >= 1000 ? 500 : 1}
            min={1}
            max={habit.kind === 'duration' ? 600 : 100000}
            unit={habit.kind === 'duration' ? 'min' : (habit.unit ?? '')}
          />
          {habit.kind === 'count' ? (
            <TextField label="Unit" value={habit.unit ?? ''} onChangeText={(u) => patch({ unit: u.slice(0, 16) || null })} placeholder="e.g. steps, pages" />
          ) : null}
        </Card>
      ) : null}

      <SectionHeader title="Time of day" />
      <SegmentedControl options={TIMES} value={habit.timeOfDay} onChange={(v) => patch({ timeOfDay: v })} accessibilityLabel="Time of day" />

      {habit.kind === 'boolean' ? (
        <>
          <SectionHeader title="Routine steps" trailing="Optional" />
          <Card padding="md">
            {habit.routineSteps.map((s) => (
              <View key={s.id} style={styles.step}>
                <Text variant="bodyMedium" style={styles.flex} numberOfLines={1}>
                  {s.label}
                </Text>
                <PressableScale
                  onPress={() => {
                    const order = [null, ...tags.map((t) => t.tag), ...SUGGESTED_TAGS.filter((t) => !tags.some((x) => x.tag === t))];
                    const idx = order.indexOf(s.tag);
                    const nextTag = order[(idx + 1) % order.length] ?? null;
                    patch({ routineSteps: habit.routineSteps.map((x) => (x.id === s.id ? { ...x, tag: nextTag } : x)) });
                  }}
                  style={styles.tagButton}
                  accessibilityLabel={`${s.label}: ${s.tag ? `only on ${s.tag}` : 'every day'}. Double tap to change.`}
                >
                  <Text variant="caption" color={s.tag ? 'info' : 'muted'}>
                    {s.tag ?? 'Every day'}
                  </Text>
                </PressableScale>
                <IconButton icon={X} onPress={() => patch({ routineSteps: habit.routineSteps.filter((x) => x.id !== s.id) })} accessibilityLabel={`Remove ${s.label}`} />
              </View>
            ))}
            <View style={styles.addStep}>
              <TextInput
                value={newStep}
                onChangeText={setNewStep}
                placeholder="Add a step, e.g. Moisturizer"
                placeholderTextColor={theme.colors.textMuted}
                onSubmitEditing={addStep}
                returnKeyType="done"
                style={[theme.typography.body, styles.stepInput]}
                accessibilityLabel="New step"
              />
              <IconButton icon={Plus} variant="surface" onPress={addStep} disabled={!newStep.trim()} accessibilityLabel="Add step" />
            </View>
          </Card>

          <SectionHeader title="Special nights" trailing="Optional" />
          <Text variant="caption" color="muted" style={styles.hint}>
            Tag steps that only happen on certain days. Tap a step’s label above to assign a tag. Not skincare advice — use what works for you.
          </Text>
          {SUGGESTED_TAGS.concat(tags.map((t) => t.tag).filter((t) => !SUGGESTED_TAGS.includes(t))).map((tag) => {
            const days = tags.find((t) => t.tag === tag)?.weekdays ?? [];
            return (
              <Card key={tag} padding="md" style={styles.tagCard}>
                <Text variant="label" color={days.length ? 'info' : 'muted'}>
                  {tag}
                </Text>
                <View style={styles.days}>
                  {WEEK.map((d) => (
                    <FilterChip key={d} label={WEEKDAY_LETTER[d]!} selected={days.includes(d)} onPress={() => toggleTagDay(tag, d)} />
                  ))}
                </View>
                <Text variant="caption" color="muted">
                  {days.length ? [...days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => WEEKDAY_SHORT[d]).join(', ') : 'Not scheduled'}
                </Text>
              </Card>
            );
          })}
        </>
      ) : null}

      <SectionHeader title="Scoring" />
      <Card padding="md" style={styles.scoreRow}>
        <View style={styles.flex}>
          <Text variant="bodyMedium">Counts toward daily score</Text>
          <Text variant="caption" color="muted">
            Turn off to track without affecting consistency.
          </Text>
        </View>
        <Switch value={habit.countsTowardScore} onValueChange={(v) => patch({ countsTowardScore: v })} accessibilityLabel="Counts toward daily score" />
      </Card>

      <Button label="Remove habit" variant="ghost" size="md" icon={Trash2} onPress={() => setConfirm(true)} style={styles.remove} />
      <ConfirmSheet
        visible={confirm}
        title={`Remove ${habit.name}?`}
        message="It disappears from Today from now on. Past days keep their history."
        confirmLabel="Remove habit"
        destructive
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          archiveHabit(habit.id);
          router.back();
        }}
      />
    </AppScreen>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  target: { marginTop: t.spacing.sm, gap: t.spacing.sm },
  step: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs, minHeight: 48, borderBottomWidth: 1, borderBottomColor: t.colors.border },
  tagButton: { minHeight: 36, justifyContent: 'center', paddingHorizontal: t.spacing.xs, borderRadius: t.radius.sm, backgroundColor: t.colors.surfaceSecondary },
  addStep: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs, marginTop: t.spacing.xs },
  stepInput: { flex: 1, minHeight: 44, color: t.colors.textPrimary },
  hint: { marginBottom: t.spacing.sm },
  tagCard: { gap: t.spacing.sm, marginBottom: t.spacing.xs },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xxs },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  remove: { marginTop: t.spacing['2xl'], alignSelf: 'center' },
}));
