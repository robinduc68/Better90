import { router, useLocalSearchParams } from 'expo-router';
import { ArrowDown, ArrowUp, Minus, Plus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { getExercise } from '@/data/exercises';
import {
  AppHeader,
  AppScreen,
  Button,
  Card,
  ConfirmSheet,
  EmptyState,
  IconButton,
  makeStyles,
  PressableScale,
  SectionHeader,
  Text,
  TextField,
} from '@/design-system';
import { estimateTemplateMinutes, WEEKDAY_LETTER, WEEKDAY_SHORT, type TemplateExercise } from '@/domain';
import { useActiveWorkoutStore, useAppStore } from '@/store';

import { startWorkout } from './actions';
import { ExerciseArtwork } from '@/features/workout/artwork';

/** Monday-first week for display. */
const WEEK = [1, 2, 3, 4, 5, 6, 0];

export function TemplateEditorScreen() {
  const styles = useStyles();
  const { id, isNew } = useLocalSearchParams<{ id: string; isNew?: string }>();
  const template = useAppStore((s) => s.templates.find((t) => t.id === id));
  const updateTemplate = useAppStore((s) => s.updateTemplate);
  const archiveTemplate = useAppStore((s) => s.archiveTemplate);
  const hasActive = useActiveWorkoutStore((s) => s.session !== null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState(template?.name ?? '');

  if (!template || template.archivedAt) {
    return (
      <AppScreen header={<AppHeader />}>
        <EmptyState title="Workout not found" message="It may have been deleted." actionLabel="Back to workouts" onAction={() => router.back()} />
      </AppScreen>
    );
  }

  const toggleDay = (d: number) =>
    updateTemplate(template.id, { weekdays: template.weekdays.includes(d) ? template.weekdays.filter((x) => x !== d) : [...template.weekdays, d] });

  return (
    <AppScreen
      keyboardAware
      header={<AppHeader title="Edit workout" subtitle={`${template.exercises.length} exercises · ~${estimateTemplateMinutes(template)} min`} />}
      footer={
        <Button
          label={hasActive ? 'Workout in progress' : 'Start workout'}
          disabled={template.exercises.length === 0 || hasActive}
          onPress={() => startWorkout(template)}
        />
      }
    >
      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        onBlur={() => updateTemplate(template.id, { name: name.trim() || 'Workout' })}
        onSubmitEditing={() => updateTemplate(template.id, { name: name.trim() || 'Workout' })}
        autoFocus={isNew === '1'}
        selectTextOnFocus={isNew === '1'}
        maxLength={60}
        returnKeyType="done"
        placeholder="e.g. Back + Shoulders"
      />

      <SectionHeader title="Planned days" trailing={template.weekdays.length ? `${template.weekdays.length}× / week` : 'Optional'} />
      <View style={styles.days}>
        {WEEK.map((d) => {
          const on = template.weekdays.includes(d);
          return (
            <PressableScale
              key={d}
              onPress={() => toggleDay(d)}
              style={[styles.day, on && styles.dayOn]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={WEEKDAY_SHORT[d]}
            >
              <Text variant="smallMedium" color={on ? 'onAccent' : 'secondary'}>
                {WEEKDAY_LETTER[d]}
              </Text>
            </PressableScale>
          );
        })}
      </View>
      <Text variant="caption" color="muted" style={styles.hint}>
        Planned days show this workout on Today and count it toward your daily score.
      </Text>

      <SectionHeader title="Exercises" />
      {template.exercises.length === 0 ? (
        <Card variant="flat">
          <EmptyState title="No exercises yet" message="Add exercises from the library. You can reorder them anytime." />
        </Card>
      ) : (
        <View style={styles.list}>
          {template.exercises.map((item, index) => (
            <TemplateExerciseRow key={item.id} templateId={template.id} item={item} index={index} count={template.exercises.length} />
          ))}
        </View>
      )}
      <Button
        label="Add exercises"
        icon={Plus}
        variant="secondary"
        onPress={() => router.push({ pathname: '/workout/library', params: { mode: 'template', templateId: template.id } })}
        style={styles.add}
      />

      <Button label="Delete workout" variant="ghost" size="md" icon={Trash2} onPress={() => setConfirmDelete(true)} style={styles.delete} />
      <ConfirmSheet
        visible={confirmDelete}
        title="Delete this workout?"
        message="Your past sessions and history stay. Only the template is removed."
        confirmLabel="Delete workout"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          archiveTemplate(template.id);
          router.back();
        }}
      />
    </AppScreen>
  );
}

function TemplateExerciseRow({ templateId, item, index, count }: { templateId: string; item: TemplateExercise; index: number; count: number }) {
  const styles = useStyles();
  const exercise = getExercise(item.exerciseId);
  const update = useAppStore((s) => s.updateTemplateExercise);
  const remove = useAppStore((s) => s.removeTemplateExercise);
  const move = useAppStore((s) => s.moveTemplateExercise);
  if (!exercise) return null;
  return (
    <Card padding="md" style={styles.item}>
      <View style={styles.itemHeader}>
        <ExerciseArtwork exercise={exercise} variant="thumbnail" />
        <PressableScale
          onPress={() => router.push({ pathname: '/workout/exercise/[id]', params: { id: exercise.id } })}
          pressedScale={1}
          pressedOpacity={0.7}
          style={styles.itemName}
          accessibilityHint="Opens exercise details"
        >
          <Text variant="bodySemibold" numberOfLines={2}>
            {exercise.name}
          </Text>
        </PressableScale>
        <IconButton icon={ArrowUp} onPress={() => move(templateId, item.id, -1)} disabled={index === 0} accessibilityLabel={`Move ${exercise.name} up`} />
        <IconButton icon={ArrowDown} onPress={() => move(templateId, item.id, 1)} disabled={index === count - 1} accessibilityLabel={`Move ${exercise.name} down`} />
      </View>
      <View style={styles.targets}>
        <MiniStepper label="Sets" value={item.targetSets} min={1} max={10} onChange={(v) => update(templateId, item.id, { targetSets: v })} />
        <MiniStepper label="Reps" value={item.targetReps} min={1} max={50} onChange={(v) => update(templateId, item.id, { targetReps: v })} />
        <IconButton icon={Trash2} onPress={() => remove(templateId, item.id)} accessibilityLabel={`Remove ${exercise.name}`} />
      </View>
    </Card>
  );
}

function MiniStepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const styles = useStyles();
  return (
    <View style={styles.mini} accessible accessibilityRole="adjustable" accessibilityLabel={label} accessibilityValue={{ now: value, min, max }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onChange(Math.min(max, Math.max(min, value + (e.nativeEvent.actionName === 'increment' ? 1 : -1))))}
    >
      <Text variant="caption" color="muted" style={styles.miniLabel}>
        {label}
      </Text>
      <IconButton icon={Minus} onPress={() => onChange(Math.max(min, value - 1))} disabled={value <= min} accessibilityLabel={`Fewer ${label.toLowerCase()}`} />
      <Text variant="metricS" style={styles.miniValue}>
        {value}
      </Text>
      <IconButton icon={Plus} onPress={() => onChange(Math.min(max, value + 1))} disabled={value >= max} accessibilityLabel={`More ${label.toLowerCase()}`} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  days: { flexDirection: 'row', justifyContent: 'space-between', gap: t.spacing.xxs },
  day: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: t.colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOn: { backgroundColor: t.colors.accent },
  hint: { marginTop: t.spacing.sm },
  list: { gap: t.spacing.xs },
  item: { gap: t.spacing.sm },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  itemName: { flex: 1, minHeight: 44, justifyContent: 'center' },
  targets: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
  mini: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: t.colors.surfaceSecondary, borderRadius: t.radius.md, paddingLeft: t.spacing.sm },
  miniLabel: { flex: 1 },
  miniValue: { minWidth: 24, textAlign: 'center' },
  add: { marginTop: t.spacing.md },
  delete: { marginTop: t.spacing['2xl'], alignSelf: 'center' },
}));
