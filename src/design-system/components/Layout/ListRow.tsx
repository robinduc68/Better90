import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { makeStyles, useTheme } from '../../theme';
import { PressableScale } from '../Control/PressableScale';
import { Text } from '../Text';

interface ListRowProps {
  title: string;
  subtitle?: string;
  value?: string;
  icon?: LucideIcon;
  onPress?: () => void;
  trailing?: ReactNode;
  showChevron?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
}

/** Native-feeling settings/list row. */
export function ListRow({ title, subtitle, value, icon: Icon, onPress, trailing, showChevron, destructive, disabled, accessibilityHint }: ListRowProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const chevron = showChevron ?? !!onPress;
  const content = (
    <>
      {Icon ? (
        <View style={styles.icon}>
          <Icon size={18} color={destructive ? colors.danger : colors.textSecondary} />
        </View>
      ) : null}
      <View style={styles.body}>
        <Text variant="bodyMedium" color={destructive ? 'danger' : disabled ? 'disabled' : 'primary'} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="muted" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="small" color="secondary" numberOfLines={1} tabular style={styles.value}>
          {value}
        </Text>
      ) : null}
      {trailing}
      {chevron ? <ChevronRight size={18} color={colors.textMuted} /> : null}
    </>
  );
  if (!onPress) {
    return (
      <View style={styles.row} accessible accessibilityLabel={`${title}${value ? `, ${value}` : ''}`}>
        {content}
      </View>
    );
  }
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      style={styles.row}
      pressedScale={1}
      pressedOpacity={0.7}
      accessibilityLabel={`${title}${value ? `, ${value}` : ''}`}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
    >
      {content}
    </PressableScale>
  );
}

export function ListGroup({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return <View style={styles.group}>{children}</View>;
}

export function Divider({ inset = 0 }: { inset?: number }) {
  const styles = useStyles();
  return <View style={[styles.divider, { marginLeft: inset }]} />;
}

const useStyles = makeStyles((t) => ({
  group: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    gap: t.spacing.sm,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: t.radius.sm,
    backgroundColor: t.colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  value: { maxWidth: '45%' },
  divider: { height: 1, backgroundColor: t.colors.border },
}));
