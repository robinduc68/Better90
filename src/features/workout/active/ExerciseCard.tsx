import { router } from 'expo-router';
import { Check, ChevronDown, ChevronUp, Ellipsis, Plus, TrendingUp, Trophy } from 'lucide-react-native';
import { useMemo } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { getExercise, MUSCLE_GROUP_LABEL } from '@/data/exercises';
import { Button, Card, Chip, IconButton, makeStyles, PressableScale, Text, useTheme } from '@/design-system';
import {
  analyzeExercise,
  formatKg,
  formatSignedKg,
  formatSignedPercent,
  isExerciseComplete,
  type SessionExercise,
  type WorkoutSession,
} from '@/domain';
import { useActiveWorkoutStore } from '@/store';

import { ExerciseImage } from '../components/ExerciseImage';
import { formatSetList } from '../format';
import { toggleSetComplete } from './activeActions';
import { SetHeader, SetRow } from './SetRow';

interface ExerciseCardProps {
  item: SessionExercise;
  sessionId: string;
  history: WorkoutSession[];
  expanded: boolean;
  onToggleExpanded: () => void;
  onOptions: () => void;
  onSetOptions: (setId: string, index: number) => void;
}

export function ExerciseCard({ item, sessionId, history, expanded, onToggleExpanded, onOptions, onSetOptions }: ExerciseCardProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  // Short screens: keep the set table above the fold by using a thumbnail instead of a banner.
  const compact = useWindowDimensions().height < 740;
  const exercise = getExercise(item.exerciseId);
  const updateSet = useActiveWorkoutStore((s) => s.updateSet);
  const addSet = useActiveWorkoutStore((s) => s.addSet);
  const setExerciseComplete = useActiveWorkoutStore((s) => s.setExerciseComplete);

  const insight = useMemo(
    () => (exercise ? analyzeExercise(history, item, sessionId, exercise.equipment) : null),
    [history, item, sessionId, exercise],
  );
  if (!exercise || !insight) return null;

  const complete = isExerciseComplete(item);
  const doneSets = item.sets.filter((s) => s.completedAt).length;
  const subtitle = [MUSCLE_GROUP_LABEL[exercise.muscleGroup], exercise.secondaryMuscles[0]].filter(Boolean).join(' • ');

  const badges: { key: string; label: string; icon?: typeof Trophy }[] = [];
  if (insight.isWeightPR) badges.push({ key: 'pr', label: 'New PR', icon: Trophy });
  else if (insight.isRepPR) badges.push({ key: 'rep', label: 'Rep PR', icon: Trophy });
  if (doneSets > 0 && insight.weightDeltaKg !== null && insight.weightDeltaKg > 0) badges.push({ key: 'kg', label: formatSignedKg(insight.weightDeltaKg) });
  if (doneSets > 0 && insight.volumeDeltaPct !== null && insight.volumeDeltaPct > 0 && doneSets >= insight.previousSets.length) {
    badges.push({ key: 'vol', label: `${formatSignedPercent(insight.volumeDeltaPct)} volume` });
  }

  if (!expanded) {
    return (
      <Card padding="md">
        <PressableScale onPress={onToggleExpanded} pressedScale={1} pressedOpacity={0.7} style={styles.collapsed} accessibilityLabel={`${exercise.name}, ${doneSets} of ${item.sets.length} sets done`} accessibilityHint="Expand">
          <ExerciseImage exercise={exercise} variant="thumb" />
          <View style={styles.flex}>
            <Text variant="bodySemibold" numberOfLines={1}>
              {exercise.name}
            </Text>
            <Text variant="caption" color={complete ? 'accent' : 'muted'} tabular numberOfLines={1}>
              {complete ? 'Complete · ' : ''}
              {doneSets} / {item.sets.length} sets
              {insight.currentTopSet ? ` · ${formatKg(insight.currentTopSet.weightKg)}` : ''}
            </Text>
          </View>
          {badges[0] ? <Chip label={badges[0].label} tone="accent" icon={badges[0].icon} /> : null}
          {complete ? <Check size={20} color={colors.accentForeground} /> : <ChevronDown size={20} color={colors.textMuted} />}
        </PressableScale>
      </Card>
    );
  }

  return (
    <Card padding="md" variant="base">
      {!compact ? (
        <PressableScale onPress={() => router.push({ pathname: '/workout/exercise/[id]', params: { id: exercise.id } })} pressedScale={1} pressedOpacity={0.85} accessibilityLabel={`${exercise.name} details`}>
          <ExerciseImage exercise={exercise} variant="banner" />
        </PressableScale>
      ) : null}

      <View style={[styles.titleRow, compact && styles.titleRowCompact]}>
        {compact ? (
          <PressableScale onPress={() => router.push({ pathname: '/workout/exercise/[id]', params: { id: exercise.id } })} accessibilityLabel={`${exercise.name} details`}>
            <ExerciseImage exercise={exercise} variant="thumb" />
          </PressableScale>
        ) : null}
        <View style={styles.flex}>
          <Text variant="h3" numberOfLines={2} style={styles.title}>
            {exercise.name.toUpperCase()}
          </Text>
          <Text variant="caption" color="muted">
            {subtitle}
          </Text>
        </View>
        <IconButton icon={ChevronUp} onPress={onToggleExpanded} accessibilityLabel="Collapse" />
        <IconButton icon={Ellipsis} onPress={onOptions} accessibilityLabel={`${exercise.name} options`} />
      </View>

      {badges.length > 0 ? (
        <View style={styles.badges}>
          {badges.map((b) => (
            <Chip key={b.key} label={b.label} tone="accent" icon={b.icon} />
          ))}
        </View>
      ) : null}

      <View style={styles.previous} accessible accessibilityLabel={insight.hasHistory ? `Last time: ${formatSetList(insight.previousSets)}` : 'First time logging this exercise'}>
        <View style={styles.flex}>
          <Text variant="label" color="muted">
            Last time
          </Text>
          <Text variant="smallMedium" color="secondary" tabular>
            {insight.hasHistory ? formatSetList(insight.previousSets) : 'First session — set your baseline.'}
          </Text>
        </View>
        {insight.bestSet && insight.bestSet.weightKg > 0 ? (
          <View style={styles.best}>
            <Text variant="label" color="muted">
              Best
            </Text>
            <Text variant="smallMedium" color="secondary" tabular>
              {formatKg(insight.bestSet.weightKg)} × {insight.bestSet.reps}
            </Text>
          </View>
        ) : null}
      </View>
      {insight.suggestion ? (
        <View style={styles.suggestion}>
          <TrendingUp size={14} color={colors.textMuted} />
          <Text variant="caption" color="muted" style={styles.flex}>
            {insight.suggestion.kind === 'increase_weight'
              ? `Last time you hit every target. Consider ${formatKg(insight.suggestion.nextWeightKg)} — your call.`
              : insight.suggestion.message}
          </Text>
        </View>
      ) : null}

      <View style={styles.table}>
        <SetHeader />
        {item.sets.map((set, i) => (
          <SetRow
            key={set.id}
            index={i}
            set={set}
            bodyweight={exercise.isBodyweight}
            onChange={(patch) => updateSet(item.id, set.id, patch)}
            onToggle={() => void toggleSetComplete(item.id, set.id)}
            onOptions={() => onSetOptions(set.id, i)}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Button label="Add set" icon={Plus} variant="ghost" size="md" onPress={() => addSet(item.id)} />
        {complete ? (
          <Text variant="smallMedium" color="accent">
            Exercise complete
          </Text>
        ) : (
          <Button label="Complete exercise" variant="secondary" size="md" onPress={() => { setExerciseComplete(item.id, true); onToggleExpanded(); }} />
        )}
      </View>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  collapsed: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginTop: t.spacing.md, gap: t.spacing.xxs },
  titleRowCompact: { marginTop: 0, gap: t.spacing.sm },
  title: { letterSpacing: 0.4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs, marginTop: t.spacing.sm },
  previous: {
    flexDirection: 'row',
    gap: t.spacing.md,
    marginTop: t.spacing.md,
    padding: t.spacing.sm,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surfaceSecondary,
  },
  best: { alignItems: 'flex-end' },
  suggestion: { flexDirection: 'row', gap: t.spacing.xs, alignItems: 'flex-start', marginTop: t.spacing.sm, paddingHorizontal: t.spacing.xxs },
  table: { marginTop: t.spacing.md, gap: t.spacing.xxs },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: t.spacing.sm },
}));
