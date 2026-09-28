import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { makeStyles, useTheme } from '../../theme';
import { elevation } from '../../tokens';
import { PressableScale } from '../Control/PressableScale';

export interface CardProps {
  children: ReactNode;
  variant?: 'base' | 'elevated' | 'flat' | 'outline';
  padding?: 'none' | 'md' | 'lg';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/** Elevation comes from surface contrast + a subtle border, not heavy shadows. */
export function Card({ children, variant = 'base', padding = 'lg', onPress, style, accessibilityLabel, accessibilityHint }: CardProps) {
  const styles = useStyles();
  const { scheme } = useTheme();
  const composed = [
    styles.root,
    styles[variant],
    padding === 'md' ? styles.padMd : padding === 'lg' ? styles.padLg : null,
    variant === 'flat' || variant === 'outline' ? null : elevation(scheme, variant === 'elevated' ? 2 : 1),
    style,
  ];
  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        style={composed}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        pressedOpacity={0.92}
      >
        {children}
      </PressableScale>
    );
  }
  return (
    <View style={composed} accessibilityLabel={accessibilityLabel}>
      {children}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { borderRadius: t.radius.card },
  base: { backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border },
  elevated: { backgroundColor: t.colors.surfaceElevated, borderWidth: 1, borderColor: t.colors.border },
  flat: { backgroundColor: t.colors.surfaceSecondary },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: t.colors.borderStrong },
  padMd: { padding: t.spacing.md },
  padLg: { padding: t.spacing.lg },
}));
