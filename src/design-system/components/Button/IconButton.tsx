import type { LucideIcon } from 'lucide-react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { makeStyles, useTheme } from '../../theme';
import { PressableScale } from '../Control/PressableScale';

interface IconButtonProps {
  icon: LucideIcon;
  onPress?: () => void;
  accessibilityLabel: string;
  variant?: 'ghost' | 'surface' | 'accent';
  size?: 'md' | 'lg';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  hitSlop?: number;
}

export function IconButton({
  icon: Icon,
  onPress,
  accessibilityLabel,
  variant = 'ghost',
  size = 'md',
  disabled,
  style,
  hitSlop = 4,
}: IconButtonProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const color = variant === 'accent' ? colors.onAccent : disabled ? colors.textDisabled : colors.textPrimary;
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      style={[styles.base, styles[size], styles[variant], style]}
    >
      <Icon size={size === 'lg' ? 24 : 20} color={color} strokeWidth={2} />
    </PressableScale>
  );
}

const useStyles = makeStyles((t) => ({
  base: { alignItems: 'center', justifyContent: 'center', borderRadius: t.radius.md },
  md: { width: 44, height: 44 },
  lg: { width: 52, height: 52, borderRadius: t.radius.lg },
  ghost: {},
  surface: { backgroundColor: t.colors.surfaceSecondary, borderWidth: 1, borderColor: t.colors.border },
  accent: { backgroundColor: t.colors.accent },
}));
