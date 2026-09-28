import { Check } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '../../hooks';
import { useTheme } from '../../theme';
import { motion } from '../../tokens';

interface CheckmarkProps {
  checked: boolean;
  size?: number;
  /** Partial progress (0–1) renders as an accent arc hint instead of empty. */
  partial?: boolean;
}

/** Circle that fills with the accent and a check glyph when complete. Shape + icon, never color alone. */
export function Checkmark({ checked, size = 28, partial = false }: CheckmarkProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    progress.value = reduceMotion ? (checked ? 1 : 0) : withTiming(checked ? 1 : 0, { duration: motion.check });
  }, [checked, progress, reduceMotion]);

  const fillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.6 + progress.value * 0.4 }],
  }));

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: checked ? theme.colors.accent : partial ? theme.colors.accentSubtle : theme.colors.borderStrong,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: theme.colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          },
          fillStyle,
        ]}
      >
        <Check size={size * 0.58} color={theme.colors.onAccent} strokeWidth={3} />
      </Animated.View>
    </View>
  );
}
