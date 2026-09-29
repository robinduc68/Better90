import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '../../hooks';
import { useTheme } from '../../theme';
import { motion, type Tone } from '../../tokens';

interface ProgressBarProps {
  /** 0–1. Values above 1 are clamped visually. */
  value: number;
  height?: 2 | 4 | 6 | 8;
  tone?: 'accent' | 'neutral' | 'subtle' | Exclude<Tone, 'brand' | 'neutral'>;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function ProgressBar({ value, height = 4, tone = 'accent', style, accessibilityLabel }: ProgressBarProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const progress = useSharedValue(reduceMotion ? clamped : 0);

  useEffect(() => {
    progress.value = reduceMotion
      ? clamped
      : withTiming(clamped, { duration: motion.progress, easing: Easing.out(Easing.cubic) });
  }, [clamped, progress, reduceMotion]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const fillColor =
    tone === 'accent'
      ? theme.colors.accent
      : tone === 'subtle'
        ? theme.colors.accentSubtle
        : tone === 'neutral'
          ? theme.colors.textSecondary
          : theme.colors.tones[tone].fg;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[{ height, borderRadius: height, backgroundColor: theme.colors.track, overflow: 'hidden' }, style]}
    >
      <Animated.View style={[{ height, borderRadius: height, backgroundColor: fillColor }, fillStyle]} />
    </View>
  );
}
