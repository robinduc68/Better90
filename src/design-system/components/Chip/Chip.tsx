import type { LucideIcon } from 'lucide-react-native';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { makeStyles, useTheme } from '../../theme';
import { PressableScale } from '../Control/PressableScale';
import { Text } from '../Text';

interface ChipProps {
  label: string;
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'info';
  icon?: LucideIcon;
  style?: StyleProp<ViewStyle>;
}

/** Non-interactive status chip / tag, e.g. "NEW PR", "BHA NIGHT". */
export function Chip({ label, tone = 'neutral', icon: Icon, style }: ChipProps) {
  const styles = useStyles();
  const theme = useTheme();
  const color =
    tone === 'accent'
      ? theme.colors.accentForeground
      : tone === 'success'
        ? theme.colors.success
        : tone === 'warning'
          ? theme.colors.warning
          : tone === 'info'
            ? theme.colors.info
            : theme.colors.textSecondary;
  return (
    <View style={[styles.chip, tone === 'accent' ? styles.accent : styles.neutral, style]}>
      {Icon ? <Icon size={12} color={color} strokeWidth={2.5} /> : null}
      <Text variant="caption" style={[styles.text, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: LucideIcon;
}

export function FilterChip({ label, selected, onPress, icon: Icon }: FilterChipProps) {
  const styles = useStyles();
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={[styles.filter, selected && styles.filterSelected]}
    >
      {Icon ? <Icon size={16} color={selected ? theme.colors.accentForeground : theme.colors.textSecondary} /> : null}
      <Text variant="smallMedium" color={selected ? 'primary' : 'secondary'} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

const useStyles = makeStyles((t) => ({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: t.spacing.xxs,
    paddingHorizontal: t.spacing.xs,
    paddingVertical: 3,
    borderRadius: t.radius.pill,
  },
  neutral: { backgroundColor: t.colors.surfaceSecondary },
  accent: { backgroundColor: t.colors.accentMuted },
  text: { letterSpacing: 0.6, textTransform: 'uppercase' },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
    minHeight: 40,
    paddingHorizontal: t.spacing.md,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterSelected: { backgroundColor: t.colors.accentMuted, borderColor: t.colors.accentSubtle },
}));
