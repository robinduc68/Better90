import { View } from 'react-native';

import { makeStyles } from '../../theme';
import { PressableScale } from './PressableScale';
import { Text } from '../Text';

interface Option<T extends string | number> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string | number> {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

export function SegmentedControl<T extends string | number>({ options, value, onChange, accessibilityLabel }: SegmentedControlProps<T>) {
  const styles = useStyles();
  return (
    <View style={styles.root} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <PressableScale
            key={String(opt.value)}
            onPress={() => onChange(opt.value)}
            style={[styles.segment, selected && styles.selected]}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={opt.label}
          >
            <Text variant="smallMedium" color={selected ? 'primary' : 'secondary'} numberOfLines={1}>
              {opt.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: {
    flexDirection: 'row',
    backgroundColor: t.colors.surfaceSecondary,
    borderRadius: t.radius.md,
    padding: t.spacing.xxs,
    gap: t.spacing.xxs,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: t.radius.sm,
    paddingHorizontal: t.spacing.xs,
  },
  selected: {
    backgroundColor: t.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: t.colors.borderStrong,
  },
}));
