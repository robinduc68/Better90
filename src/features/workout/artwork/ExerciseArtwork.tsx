import { Image } from 'expo-image';
import { memo, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { EXERCISE_MOVEMENT, MovementArtwork, type Segment } from '@/assets/illustrations/exercises';
import { resolveExerciseImage } from '@/data/exercises';
import { makeStyles } from '@/design-system';
import type { Exercise, MuscleGroup } from '@/domain';

import { MuscleGroupArtwork } from './MuscleGroupArtwork';
import { secondaryGroups } from './muscleRegions';

export type ArtworkVariant = 'thumbnail' | 'card' | 'hero' | 'detail';

interface ExerciseArtworkProps {
  exercise: Exercise;
  variant: ArtworkVariant;
  /** Which part of the rep to draw; default shows the motion (start ghosted). */
  frame?: 'start' | 'end' | 'motion';
  style?: StyleProp<ViewStyle>;
}

const HEIGHT: Record<ArtworkVariant, number> = { thumbnail: 52, card: 176, hero: 200, detail: 240 };

const GROUP_SEGMENTS: Record<MuscleGroup, Segment[]> = {
  chest: ['chest'],
  back: ['torso'],
  shoulders: ['shoulder'],
  biceps: ['upperArm'],
  triceps: ['upperArm'],
  legs: ['thigh'],
  glutes: ['hip'],
  calves: ['shin'],
  abs: ['abs'],
  full_body: ['torso', 'thigh'],
};

export function exerciseSegments(exercise: Exercise): { primary: Segment[]; secondary: Segment[] } {
  const primary = GROUP_SEGMENTS[exercise.muscleGroup];
  const secondary = secondaryGroups(exercise)
    .flatMap((g) => GROUP_SEGMENTS[g])
    .filter((s) => !primary.includes(s));
  return { primary, secondary };
}

/**
 * Exercise imagery (TYPE B: the movement). Resolution order:
 * licensed image for the exerciseId → movement illustration → muscle-group art.
 * The box is fixed-size, so loading or failure never shifts layout.
 */
export const ExerciseArtwork = memo(function ExerciseArtwork({ exercise, variant, frame = 'motion', style }: ExerciseArtworkProps) {
  const styles = useStyles();
  const [failed, setFailed] = useState(false);
  const source = failed ? null : resolveExerciseImage(exercise.id, exercise.image);
  const height = HEIGHT[variant];
  const isThumb = variant === 'thumbnail';
  const movement = EXERCISE_MOVEMENT[exercise.id];
  const segs = exerciseSegments(exercise);

  return (
    <View style={[isThumb ? styles.thumb : [styles.frame, { height }], style]} accessibilityElementsHidden={!source} importantForAccessibility={source ? 'auto' : 'no-hide-descendants'}>
      <View style={styles.center}>
        {movement ? (
          <MovementArtwork movement={movement} height={isThumb ? height - 4 : height - 8} primary={segs.primary} secondary={segs.secondary} frame={isThumb ? 'end' : frame} />
        ) : (
          <MuscleGroupArtwork primary={[exercise.muscleGroup]} secondary={secondaryGroups(exercise)} maxSides={isThumb ? 1 : 2} height={height - 12} />
        )}
      </View>
      {source ? (
        <Image
          source={source.kind === 'local' ? source.asset : { uri: source.uri }}
          style={styles.image}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
          onError={() => setFailed(true)}
          accessibilityLabel={`${exercise.name} illustration`}
        />
      ) : null}
    </View>
  );
});

const useStyles = makeStyles((t) => ({
  thumb: { width: HEIGHT.thumbnail, height: HEIGHT.thumbnail, borderRadius: t.radius.md, backgroundColor: t.colors.surfaceSecondary, overflow: 'hidden' },
  frame: { width: '100%', borderRadius: t.radius.lg, backgroundColor: t.colors.surfaceSecondary, overflow: 'hidden' },
  image: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
}));
