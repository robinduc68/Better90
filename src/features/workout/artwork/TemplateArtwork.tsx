import { memo, useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { getExercise } from '@/data/exercises';
import { makeStyles } from '@/design-system';
import type { MuscleGroup } from '@/domain';

import { MuscleGroupArtwork } from './MuscleGroupArtwork';

/** Anything with an exercise list: templates, sessions. */
export interface HasExercises {
  exercises: readonly { exerciseId: string }[];
}

/** Muscle groups a template trains, most frequent first. */
export function templateMuscles(template: HasExercises): MuscleGroup[] {
  const counts = new Map<MuscleGroup, number>();
  for (const e of template.exercises) {
    const g = getExercise(e.exerciseId)?.muscleGroup;
    if (g) counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([g]) => g);
}

/** Template identity: which muscles it trains, on a soft tile. */
export const TemplateArtwork = memo(function TemplateArtwork({
  template,
  size,
  style,
  framed = true,
}: {
  template: HasExercises;
  size: number;
  style?: StyleProp<ViewStyle>;
  framed?: boolean;
}) {
  const styles = useStyles();
  const groups = useMemo(() => templateMuscles(template), [template]);
  return (
    <View style={[framed && styles.frame, { width: size, height: size }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <MuscleGroupArtwork primary={groups.slice(0, 2)} secondary={groups.slice(2)} maxSides={2} height={size * (framed ? 0.82 : 1)} />
    </View>
  );
});

const useStyles = makeStyles((t) => ({
  frame: { borderRadius: t.radius.lg, backgroundColor: t.colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
}));
