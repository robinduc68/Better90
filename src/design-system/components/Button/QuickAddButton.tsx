import type { StyleProp, ViewStyle } from 'react-native';

import { makeStyles } from '../../theme';
import { PressableScale } from '../Control/PressableScale';
import { Text } from '../Text';

interface QuickAddButtonProps {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  emphasis?: 'default' | 'accent';
  style?: StyleProp<ViewStyle>;
}

/** Compact pill for one-tap logging, e.g. "+250ml". */
export function QuickAddButton({ label, onPress, accessibilityLabel, emphasis = 'default', style }: QuickAddButtonProps) {
  const styles = useStyles();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={4}
      style={[styles.base, emphasis === 'accent' && styles.accent, style]}
    >
      <Text variant="smallMedium" color={emphasis === 'accent' ? 'accent' : 'primary'} tabular numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

const useStyles = makeStyles((t) => ({
  base: {
    minHeight: 40,
    paddingHorizontal: t.spacing.sm,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: t.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accent: { backgroundColor: t.colors.accentMuted, borderColor: 'transparent' },
}));
