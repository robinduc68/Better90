import { BookOpen, Check, ChevronDown, ChevronUp, Ellipsis, Plus, Trophy } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { getExercise, MUSCLE_GROUP_LABEL } from '@/data/exercises';
import { Button, Card, Chip, IconButton, makeStyles, PressableScale, Text, useTheme } from '@/design-system';
import { analyzeExercise, formatKg, isExerciseComplete, type SessionExercise, type WorkoutSession } from '@/domain';
import { useActiveWorkoutStore } from '@/store';

import { ExerciseArtwork } from '@/features/workout/artwork';
import { HowToSheet } from '@/features/workout/components/HowToSheet';
import { formatSetList } from '../format';
import { toggleSetComplete } from './activeActions';
import { ProgressionInsight } from './ProgressionInsight';
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
  const [howTo, setHowTo] = useState(false);

  const insight = useMemo(
    () => (exercise ? analyzeExercise(history, item, sessionId, exercise.equipment) : null),
    [history, item, sessionId, exercise],
  );
  if (!exercise || !insight) return null;

  const complete = isExerciseComplete(item);
  const doneSets = item.sets.filter((s) => s.completedAt).length;
  const subtitle = [MUSCLE_GROUP_LABEL[exercise.muscleGroup], exercise.secondaryMuscles[0]].filter(Boolean).join(' • ');

  const pr = insight.isWeightPR ? 'New PR' : insight.isRepPR ? 'Rep PR' : null;

  if (!expanded) {
    const top = insight.currentTopSet;
    return (
      <Card padding="md" variant={complete ? 'flat' : 'base'}>
        <PressableScale onPress={onToggleExpanded} pressedScale={1} pressedOpacity={0.7} style={styles.collapsed} accessibilityLabel={`${exercise.name}, ${doneSets} of ${item.sets.length} sets done${pr ? `, ${pr}` : ''}`} accessibilityHint="Expand">
          {complete ? (
            <View style={styles.doneBadge}>
              <Check size={16} color={colors.onAccent} strokeWidth={3} />
            </View>
          ) : (
            <ExerciseArtwork exercise={exercise} variant="thumbnail" />
          )}
          <View style={styles.flex}>
            <Text variant="bodySemibold" numberOfLines={1} style={styles.collapsedTitle}>
              {exercise.name.toUpperCase()}
            </Text>
            <Text variant="caption" color={complete ? 'secondary' : 'muted'} tabular numberOfLines={1}>
              {doneSets} / {item.sets.length} sets
              {top ? ` · ${top.weightKg ? formatKg(top.weightKg) : 'BW'} × ${top.reps}` : ''}
            </Text>
          </View>
          {pr ? <Chip label={pr} tone="accent" icon={Trophy} /> : null}
          <ChevronDown size={20} color={colors.textMuted} />
        </PressableScale>
      </Card>
    );
  }

  return (
    <Card padding="md" variant="base">
      {!compact ? (
        <View>
          <PressableScale onPress={() => setHowTo(true)} pressedScale={1} pressedOpacity={0.9} accessibilityLabel={`How to do ${exercise.name}`}>
            <ExerciseArtwork exercise={exercise} variant="card" />
          </PressableScale>
          <PressableScale onPress={() => setHowTo(true)} style={styles.howTo} accessibilityLabel={`How to do ${exercise.name}`}>
            <BookOpen size={14} color={colors.textPrimary} />
            <Text variant="caption">How to</Text>
          </PressableScale>
        </View>
      ) : null}

      <View style={[styles.titleRow, compact && styles.titleRowCompact]}>
        {compact ? (
          <PressableScale onPress={() => setHowTo(true)} accessibilityLabel={`How to do ${exercise.name}`}>
            <ExerciseArtwork exercise={exercise} variant="thumbnail" />
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

      <View style={styles.previous} accessible accessibilityLabel={insight.hasHistory ? `Last time: ${formatSetList(insight.previousSets)}` : 'First time logging this exercise'}>
        <View style={styles.flex}>
          <Text variant="label" color="muted">
            Last session
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
      <ProgressionInsight insight={insight} doneSets={doneSets} />

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
      <HowToSheet exercise={howTo ? exercise : null} onClose={() => setHowTo(false)} />
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  collapsed: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  collapsedTitle: { letterSpacing: 0.3 },
  doneBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center', marginHorizontal: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginTop: t.spacing.md, gap: t.spacing.xxs },
  titleRowCompact: { marginTop: 0, gap: t.spacing.sm },
  howTo: {
    position: 'absolute',
    left: t.spacing.sm,
    top: t.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xxs,
    paddingHorizontal: t.spacing.sm,
    minHeight: 32,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.surfaceElevated,
  },
  title: { letterSpacing: 0.4 },
  previous: {
    flexDirection: 'row',
    gap: t.spacing.md,
    marginTop: t.spacing.md,
    padding: t.spacing.sm,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surfaceSecondary,
  },
  best: { alignItems: 'flex-end' },
  table: { marginTop: t.spacing.md, gap: t.spacing.xxs },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: t.spacing.sm },
}));
