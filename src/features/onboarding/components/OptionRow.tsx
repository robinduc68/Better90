import { View } from 'react-native';

import { Checkmark, makeStyles, PressableScale, Text } from '@/design-system';

interface OptionRowProps {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  multi?: boolean;
}

/** Large selectable row. Selection is shown by shape + check, not color alone. */
export function OptionRow({ label, description, selected, onPress, multi = true }: OptionRowProps) {
  const styles = useStyles();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={multi ? { checked: selected } : { selected }}
      accessibilityLabel={label}
      accessibilityHint={description}
      style={[styles.row, selected && styles.selected]}
    >
      <View style={styles.body}>
        <Text variant="bodyMedium">{label}</Text>
        {description ? (
          <Text variant="caption" color="muted">
            {description}
          </Text>
        ) : null}
      </View>
      <Checkmark checked={selected} size={24} />
    </PressableScale>
  );
}

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
    gap: t.spacing.sm,
  },
  selected: { borderColor: t.colors.accentSubtle, backgroundColor: t.colors.accentMuted },
  body: { flex: 1, gap: 2 },
}));
