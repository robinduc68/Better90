import { Image } from 'expo-image';
import { Dumbbell } from 'lucide-react-native';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { EQUIPMENT_LABEL, MUSCLE_GROUP_LABEL, resolveExerciseImage } from '@/data/exercises';
import { makeStyles, Text, useTheme } from '@/design-system';
import type { Exercise } from '@/domain';

interface ExerciseImageProps {
  exercise: Exercise;
  variant: 'thumb' | 'banner' | 'hero';
  style?: StyleProp<ViewStyle>;
}

const HEIGHT = { thumb: 52, banner: 96, hero: 220 } as const;

/**
 * Renders bundled or CDN imagery when available, otherwise a designed
 * placeholder (muscle group + equipment) — never scraped images.
 */
export function ExerciseImage({ exercise, variant, style }: ExerciseImageProps) {
  const styles = useStyles();
  const theme = useTheme();
  const source = resolveExerciseImage(exercise.id, exercise.image);
  const height = HEIGHT[variant];
  const box = [variant === 'thumb' ? styles.thumb : [styles.banner, { height }], style];

  if (source) {
    return (
      <View style={box}>
        <Image
          source={source.kind === 'local' ? source.asset : { uri: source.uri }}
          style={styles.fill}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
          accessibilityLabel={`${exercise.name} illustration`}
        />
      </View>
    );
  }

  if (variant === 'thumb') {
    return (
      <View style={box} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Dumbbell size={20} color={theme.colors.textMuted} strokeWidth={1.6} />
      </View>
    );
  }

  return (
    <View style={box} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg style={styles.pattern} width="100%" height="100%">
        {Array.from({ length: 9 }, (_, i) => (
          <Line key={i} x1={`${i * 12.5}%`} y1="0" x2={`${i * 12.5}%`} y2="100%" stroke={theme.colors.border} strokeWidth={1} />
        ))}
        <Circle cx="82%" cy="50%" r={height * 0.62} stroke={theme.colors.borderStrong} strokeWidth={1} fill="none" />
        <Circle cx="82%" cy="50%" r={height * 0.36} stroke={theme.colors.border} strokeWidth={1} fill="none" />
      </Svg>
      <View style={styles.placeholderContent}>
        <Dumbbell size={variant === 'hero' ? 28 : 20} color={theme.colors.textMuted} strokeWidth={1.6} />
        <Text variant={variant === 'hero' ? 'h2' : 'h3'} color="secondary" style={styles.muscle}>
          {MUSCLE_GROUP_LABEL[exercise.muscleGroup].toUpperCase()}
        </Text>
        <Text variant="caption" color="muted">
          {EQUIPMENT_LABEL[exercise.equipment]}
        </Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  fill: { width: '100%', height: '100%' },
  thumb: {
    width: HEIGHT.thumb,
    height: HEIGHT.thumb,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  banner: { width: '100%', borderRadius: t.radius.lg, backgroundColor: t.colors.surfaceSecondary, overflow: 'hidden' },
  pattern: { position: 'absolute' },
  placeholderContent: { flex: 1, justifyContent: 'flex-end', padding: t.spacing.md, gap: 2 },
  muscle: { letterSpacing: 1.5, marginTop: t.spacing.xs },
}));
