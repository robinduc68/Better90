import type { LucideIcon } from 'lucide-react-native';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { makeStyles, useTheme } from '../../theme';
import { Button } from '../Button';
import { Text } from '../Text';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Explains what to do next — never just "No data". */
export function EmptyState({ title, message, icon: Icon, actionLabel, onAction, secondaryLabel, onSecondary, style }: EmptyStateProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={[styles.root, style]}>
      {Icon ? (
        <View style={styles.iconWrap}>
          <Icon size={22} color={colors.textSecondary} />
        </View>
      ) : null}
      <Text variant="label" color="secondary" align="center">
        {title}
      </Text>
      <Text variant="small" color="muted" align="center" style={styles.message}>
        {message}
      </Text>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} size="md" style={styles.action} /> : null}
      {secondaryLabel && onSecondary ? <Button label={secondaryLabel} onPress={onSecondary} variant="ghost" size="md" /> : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { alignItems: 'center', paddingVertical: t.spacing['2xl'], paddingHorizontal: t.spacing.xl, gap: t.spacing.xs },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: t.spacing.xs,
  },
  message: { maxWidth: 300 },
  action: { marginTop: t.spacing.md, minWidth: 200 },
}));
