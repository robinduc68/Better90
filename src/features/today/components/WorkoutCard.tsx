import { router } from 'expo-router';
import { ArrowRight, Check, Dumbbell } from 'lucide-react-native';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { MUSCLE_GROUP_LABEL } from '@/data/exercises';
import { Button, Card, Chip, IconBadge, makeStyles, ProgressBar, Text, useTheme } from '@/design-system';
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
import { CroppedMuscleArt, templateMuscles } from '@/features/workout/artwork';

interface WorkoutCardProps {
  isToday: boolean;
  planned: PlannedWorkout | null;
  scheduledToday: boolean;
  active: WorkoutSession | null;
  completed: WorkoutSession | null;
  hasTemplates: boolean;
}

/** Large cropped muscle artwork bleeding off the card's right edge (~40% of the card). */
function HeroArt({ exercises }: { exercises: { exerciseId: string }[] }) {
  const { width } = useWindowDimensions();
  const cardW = Math.min(width, 560) - 40;
  return <CroppedMuscleArt template={{ exercises }} width={Math.round(cardW * 0.44)} height={250} style={heroStyles.art} />;
}

const heroStyles = StyleSheet.create({
  art: { position: 'absolute', right: 0, top: 0 },
});

function muscleLine(exercises: { exerciseId: string }[]) {
  return muscleNames(exercises).join(' • ');
}

function muscleNames(exercises: { exerciseId: string }[]) {
  return templateMuscles({ exercises })
    .slice(0, 3)
    .map((g) => MUSCLE_GROUP_LABEL[g]);
}

/** Today's workout: the strongest element on Today and its primary action. */
export function WorkoutCard({ isToday, planned, scheduledToday, active, completed, hasTemplates }: WorkoutCardProps) {
  const styles = useStyles();
  const { colors } = useTheme();

  if (active) {
    const p = exerciseProgress(active);
    return (
      <Card variant="elevated" style={styles.card}>
        <HeroArt exercises={active.exercises} />
        <Text variant="label" color="accent">
          In progress · {formatDuration(Math.round(sessionDurationSec(active) / 60))}
        </Text>
        <Text variant="h2" numberOfLines={2} style={styles.title}>
          {active.name}
        </Text>
        <Text variant="small" color="secondary" tabular>
          {p.done} / {p.total} exercises
        </Text>
        <ProgressBar value={p.fraction} height={4} style={styles.bar} />
        <Button label="Continue" icon={ArrowRight} iconPosition="right" onPress={() => router.push('/workout/active')} style={styles.cta} />
      </Card>
    );
  }

  if (completed) {
    return (
      <Card variant="elevated" style={styles.card} onPress={() => router.push({ pathname: '/workout/session/[id]', params: { id: completed.id } })} accessibilityHint="Opens the workout summary">
        <HeroArt exercises={completed.exercises} />
        <View style={styles.doneRow}>
          <Check size={16} color={colors.accentForeground} strokeWidth={2.6} />
          <Text variant="label" color="accent">
            Workout complete
          </Text>
        </View>
        <Text variant="h2" numberOfLines={2} style={styles.title}>
          {completed.name}
        </Text>
        <Text variant="small" color="secondary" tabular>
          {formatDuration(Math.round(sessionDurationSec(completed) / 60))} · {formatVolume(sessionVolume(completed))}
        </Text>
        <Text variant="caption" color="muted" style={styles.muscles}>
          {muscleLine(completed.exercises)}
        </Text>
      </Card>
    );
  }

  if (!isToday) {
    return (
      <Card variant="flat" style={styles.rest}>
        <IconBadge icon={Dumbbell} tone="neutral" size="sm" />
        <Text variant="bodyMedium" color="secondary">
          {scheduledToday ? 'Planned workout not logged.' : 'Rest day.'}
        </Text>
      </Card>
    );
  }

  if (!hasTemplates || !planned) {
    return (
      <Card variant="elevated" style={styles.card}>
        <IconBadge icon={Dumbbell} tone="brand" />
        <Text variant="h3" style={styles.emptyTitle}>
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
      <HeroArt exercises={t.exercises} />
      <Text variant="label" color={isRestDay ? 'muted' : 'accent'}>
        {isRestDay ? 'Rest day · optional' : "Today's workout"}
      </Text>
      <Text variant="h1" numberOfLines={2} style={styles.titleLarge}>
        {t.name}
      </Text>
      <View style={styles.chips}>
        {muscleNames(t.exercises).map((m) => (
          <Chip key={m} label={m} tone="accent" />
        ))}
      </View>
      <Text variant="bodyMedium" color="secondary" tabular style={styles.meta}>
        {t.exercises.length} exercises
      </Text>
      <Text variant="small" color="muted" tabular>
        ~{estimateTemplateMinutes(t)} min
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
  card: { gap: t.spacing.xxs, overflow: 'hidden', minHeight: 180 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xxs, marginTop: t.spacing.xs, maxWidth: '58%' },
  meta: { marginTop: t.spacing.md },
  title: { marginTop: t.spacing.xs, maxWidth: '60%' },
  titleLarge: { marginTop: t.spacing.xs, marginBottom: t.spacing.xxs, maxWidth: '60%' },
  muscles: { marginTop: t.spacing.xs, letterSpacing: 0.8 },
  bar: { marginTop: t.spacing.md, maxWidth: '58%' },
  cta: { marginTop: t.spacing.lg },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xxs },
  rest: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  emptyTitle: { marginTop: t.spacing.sm },
}));
