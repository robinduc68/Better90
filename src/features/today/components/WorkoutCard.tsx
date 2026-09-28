import { router } from 'expo-router';
import { ArrowRight, Check, Dumbbell } from 'lucide-react-native';
import { View } from 'react-native';

import { Button, Card, makeStyles, ProgressBar, Text, useTheme } from '@/design-system';
import {
  estimateTemplateMinutes,
  exerciseProgress,
  formatDuration,
  formatVolume,
  sessionDurationSec,
  sessionVolume,
  type PlannedWorkout,
  type WorkoutSession,
} from '@/domain';
import { startWorkout } from '@/features/workout/actions';

interface WorkoutCardProps {
  isToday: boolean;
  planned: PlannedWorkout | null;
  scheduledToday: boolean;
  active: WorkoutSession | null;
  completed: WorkoutSession | null;
  hasTemplates: boolean;
}

/** Today's workout gets more weight than simple habits: its own card, the screen's primary action. */
export function WorkoutCard({ isToday, planned, scheduledToday, active, completed, hasTemplates }: WorkoutCardProps) {
  const styles = useStyles();
  const { colors } = useTheme();

  if (active) {
    const p = exerciseProgress(active);
    return (
      <Card variant="elevated" style={styles.card}>
        <View style={styles.headerRow}>
          <Text variant="label" color="accent">
            In progress
          </Text>
          <Text variant="caption" color="muted" tabular>
            {formatDuration(Math.round(sessionDurationSec(active) / 60))}
          </Text>
        </View>
        <Text variant="h2" numberOfLines={1} style={styles.title}>
          {active.name}
        </Text>
        <Text variant="small" color="secondary" tabular>
          {p.done} / {p.total} exercises completed
        </Text>
        <ProgressBar value={p.fraction} height={4} style={styles.bar} />
        <Button label="Continue" icon={ArrowRight} iconPosition="right" onPress={() => router.push('/workout/active')} style={styles.cta} />
      </Card>
    );
  }

  if (completed) {
    return (
      <Card style={styles.card} onPress={() => router.push({ pathname: '/workout/session/[id]', params: { id: completed.id } })} accessibilityHint="Opens the workout summary">
        <View style={styles.headerRow}>
          <Text variant="label" color="accent">
            Workout complete
          </Text>
          <Check size={18} color={colors.accentForeground} strokeWidth={2.5} />
        </View>
        <Text variant="h2" numberOfLines={1} style={styles.title}>
          {completed.name}
        </Text>
        <Text variant="small" color="secondary" tabular>
          {formatDuration(Math.round(sessionDurationSec(completed) / 60))} · {formatVolume(sessionVolume(completed))} volume
        </Text>
      </Card>
    );
  }

  if (!isToday) {
    return (
      <Card variant="flat" style={styles.card}>
        <Text variant="bodyMedium" color="secondary">
          {scheduledToday ? 'Planned workout not logged.' : 'Rest day.'}
        </Text>
      </Card>
    );
  }

  if (!hasTemplates || !planned) {
    return (
      <Card style={styles.card}>
        <View style={styles.emptyIcon}>
          <Dumbbell size={20} color={colors.textSecondary} />
        </View>
        <Text variant="label" color="muted" style={styles.emptyLabel}>
          No workout yet
        </Text>
        <Text variant="small" color="secondary">
          Create your first workout and start tracking strength.
        </Text>
        <Button label="Create workout" variant="secondary" size="md" onPress={() => router.push('/(tabs)/workout')} style={styles.cta} />
      </Card>
    );
  }

  const t = planned.template;
  const isRestDay = !scheduledToday;
  return (
    <Card variant="elevated" style={styles.card}>
      {isRestDay ? (
        <Text variant="label" color="muted">
          Rest day · Optional
        </Text>
      ) : (
        <Text variant="label" color="accent">
          Planned
        </Text>
      )}
      <Text variant="h2" numberOfLines={1} style={styles.title}>
        {isRestDay ? `Next up: ${t.name}` : t.name}
      </Text>
      <Text variant="small" color="secondary" tabular>
        {t.exercises.length} exercises · ~{estimateTemplateMinutes(t)} min
      </Text>
      <Button
        label={isRestDay ? 'Start anyway' : 'Start workout'}
        variant={isRestDay ? 'secondary' : 'primary'}
        icon={ArrowRight}
        iconPosition="right"
        onPress={() => startWorkout(t)}
        style={styles.cta}
      />
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: { gap: t.spacing.xxs },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { marginTop: t.spacing.xs },
  bar: { marginTop: t.spacing.md },
  cta: { marginTop: t.spacing.lg },
  emptyIcon: {
    width: 40,
    height: 40,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLabel: { marginTop: t.spacing.sm },
}));
