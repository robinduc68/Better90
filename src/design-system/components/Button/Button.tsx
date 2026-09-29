import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, View, type StyleProp, type ViewStyle } from 'react-native';

import { makeStyles, useTheme } from '../../theme';
import { PressableScale } from '../Control/PressableScale';
import { Text, type TextColor } from '../Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
export type ButtonSize = 'lg' | 'md' | 'sm';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const TEXT_COLOR: Record<Exclude<ButtonVariant, 'dark'>, TextColor> = {
  primary: 'onAccent',
  secondary: 'primary',
  ghost: 'secondary',
  danger: 'danger',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const styles = useStyles();
  const theme = useTheme();
  const inactive = disabled || loading;
  const textColor: TextColor | undefined = variant === 'dark' ? undefined : inactive && variant !== 'primary' ? 'disabled' : TEXT_COLOR[variant];
  const iconColor =
    variant === 'dark'
      ? theme.colors.background
      : variant === 'primary'
      ? theme.colors.onAccent
      : variant === 'danger'
        ? theme.colors.danger
        : variant === 'ghost'
          ? theme.colors.textSecondary
          : theme.colors.textPrimary;
  const iconSize = size === 'sm' ? 16 : 20;

  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[
        styles.base,
        styles[size],
        styles[variant],
        fullWidth && styles.fullWidth,
        inactive && (variant === 'primary' ? styles.primaryDisabled : styles.disabled),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? theme.colors.onAccent : theme.colors.textSecondary} />
      ) : (
        <View style={[styles.content, iconPosition === 'right' && styles.reverse]}>
          {Icon ? <Icon size={iconSize} color={iconColor} strokeWidth={2.2} /> : null}
          <Text
            variant={size === 'sm' ? 'smallMedium' : 'bodySemibold'}
            color={textColor ?? 'primary'}
            style={variant === 'dark' ? { color: theme.colors.background } : undefined}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}

const useStyles = makeStyles((t) => ({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: t.radius.lg,
    paddingHorizontal: t.spacing.lg,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
  reverse: { flexDirection: 'row-reverse' },
  lg: { minHeight: t.layout.buttonHeight },
  md: { minHeight: 46, borderRadius: t.radius.md },
  sm: { minHeight: 36, borderRadius: t.radius.md, paddingHorizontal: t.spacing.sm },
  primary: { backgroundColor: t.colors.accent },
  secondary: { backgroundColor: t.colors.surfaceElevated, borderWidth: 1, borderColor: t.colors.borderStrong },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: t.colors.dangerMuted },
  /** Secondary emphasis without lime, e.g. "Add meal". */
  dark: { backgroundColor: t.colors.textPrimary },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.55 },
  primaryDisabled: { opacity: 0.4 },
}));
