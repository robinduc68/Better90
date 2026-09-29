import { memo, useEffect } from 'react';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useReducedMotion, useTheme } from '@/design-system';
import { useSvgId } from '@/lib/svgId';

import { water as w } from '../palette';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

const TOP = 10;
const BOTTOM = 112;
const GLASS = 'M12 10 L68 10 L61 108 Q60 114 54 114 L26 114 Q20 114 19 108 Z';

/**
 * Glass of water whose level animates to `fill` (0–1).
 * TODO: Replace with final Level90 artwork.
 */
export const WaterGlass = memo(function WaterGlass({ fill, height }: { fill: number; height: number }) {
  const { scheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(1, fill));
  const level = useSharedValue(reduceMotion ? clamped : 0);
  const clipId = useSvgId('glass');
  const gradId = useSvgId('water');

  useEffect(() => {
    level.value = reduceMotion ? clamped : withTiming(clamped, { duration: 650, easing: Easing.out(Easing.cubic) });
  }, [clamped, level, reduceMotion]);

  const waterProps = useAnimatedProps(() => {
    const y = BOTTOM - (BOTTOM - TOP - 6) * level.value;
    return { y, height: 120 - y };
  });
  const surfaceProps = useAnimatedProps(() => {
    const y = BOTTOM - (BOTTOM - TOP - 6) * level.value;
    return { cy: y, opacity: level.value > 0.02 ? 1 : 0 };
  });

  return (
    <Svg width={(height * 80) / 120} height={height} viewBox="0 0 80 120">
      <Defs>
        <ClipPath id={clipId}>
          <Path d={GLASS} />
        </ClipPath>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={w.light} />
          <Stop offset="1" stopColor={w.deep} />
        </LinearGradient>
      </Defs>
      <Path d={GLASS} fill={scheme === 'dark' ? w.glassFillDark : w.glassFillLight} />
      <G clipPath={`url(#${clipId})`}>
        <AnimatedRect x={0} width={80} fill={`url(#${gradId})`} animatedProps={waterProps} />
        <AnimatedEllipse cx={40} rx={30} ry={3.2} fill={w.surface} animatedProps={surfaceProps} />
      </G>
      <Path d={GLASS} fill="none" stroke={w.glassStroke} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M20 20 L25 96" stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
});

/** Small glass for the 250 ml indicator row. */
export const GlassDot = memo(function GlassDot({ filled, size = 22 }: { filled: boolean; size?: number }) {
  const { colors } = useTheme();
  return (
    <Svg width={(size * 80) / 120} height={size} viewBox="0 0 80 120">
      <Path d={GLASS} fill={filled ? colors.tones.water.fg : 'none'} stroke={filled ? colors.tones.water.fg : colors.borderStrong} strokeWidth={8} strokeLinejoin="round" />
    </Svg>
  );
});
