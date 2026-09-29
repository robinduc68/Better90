import { memo, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/design-system';
import type { MuscleGroup } from '@/domain';
import { useSvgId } from '@/lib/svgId';

import { MuscleGroupArtwork } from './MuscleGroupArtwork';
import { bestSide } from './muscleRegions';
import { templateMuscles, type HasExercises } from './TemplateArtwork';

const LOWER: ReadonlySet<MuscleGroup> = new Set(['legs', 'glutes', 'calves']);

interface CroppedMuscleArtProps {
  template: HasExercises;
  width: number;
  height: number;
  /** Card surface color the art fades into on its left edge. */
  fadeInto?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * TYPE A artwork: a zoomed, cropped body showing what a workout trains.
 * Upper-body days crop to the torso; leg days crop to the legs.
 */
export const CroppedMuscleArt = memo(function CroppedMuscleArt({ template, width, height, fadeInto, style }: CroppedMuscleArtProps) {
  const { colors } = useTheme();
  const fadeId = useSvgId('crop');
  const groups = useMemo(() => templateMuscles(template), [template]);
  const lower = groups.length > 0 && LOWER.has(groups[0]!);
  const side = bestSide(groups);
  const figureH = height * 1.9;
  const figureW = (figureH / 120) * 60;
  const top = lower ? -figureH * 0.47 : -figureH * 0.13;
  return (
    <View style={[{ width, height, overflow: 'hidden' }, style]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={{ position: 'absolute', top, left: width - figureW * 0.78 }}>
        <MuscleGroupArtwork primary={groups.slice(0, 2)} secondary={groups.slice(2)} view={side} height={figureH} />
      </View>
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={fadeId} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={fadeInto ?? colors.surfaceElevated} stopOpacity="1" />
            <Stop offset="0.35" stopColor={fadeInto ?? colors.surfaceElevated} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${fadeId})`} />
      </Svg>
    </View>
  );
});
