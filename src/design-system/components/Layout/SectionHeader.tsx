import { View, type StyleProp, type ViewStyle } from 'react-native';

import { makeStyles } from '../../theme';
import { PressableScale } from '../Control/PressableScale';
import { Text } from '../Text';

interface SectionHeaderProps {
  title: string;
  trailing?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SectionHeader({ title, trailing, actionLabel, onAction, style }: SectionHeaderProps) {
  const styles = useStyles();
  return (
    <View style={[styles.root, style]}>
      <Text variant="label" color="muted" accessibilityRole="header">
        {title}
      </Text>
      {actionLabel && onAction ? (
        <PressableScale onPress={onAction} hitSlop={10} accessibilityLabel={actionLabel} style={styles.action}>
          <Text variant="smallMedium" color="accent">
            {actionLabel}
          </Text>
        </PressableScale>
      ) : trailing ? (
        <Text variant="smallMedium" color="secondary" tabular>
          {trailing}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: t.spacing['2xl'],
    marginBottom: t.spacing.sm,
    minHeight: 24,
  },
  action: { minHeight: 32, justifyContent: 'center' },
}));
