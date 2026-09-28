import { memo } from 'react';
import { View } from 'react-native';

import { Checkmark, makeStyles, NumericInput, PressableScale, Text } from '@/design-system';
import type { WorkoutSet } from '@/domain';

interface SetRowProps {
  index: number;
  set: WorkoutSet;
  bodyweight: boolean;
  onChange: (patch: Partial<Pick<WorkoutSet, 'weightKg' | 'reps'>>) => void;
  onToggle: () => void;
  onOptions: () => void;
}

/** Compact row: set number · weight · reps · complete. Large targets for gym use. */
export const SetRow = memo(function SetRow({ index, set, bodyweight, onChange, onToggle, onOptions }: SetRowProps) {
  const styles = useStyles();
  const done = set.completedAt !== null;
  const n = index + 1;
  return (
    <View style={[styles.row, done && styles.done]}>
      <PressableScale onPress={onOptions} hitSlop={4} style={styles.number} accessibilityLabel={`Set ${n} options`} accessibilityHint="Delete or duplicate this set">
        <Text variant="metricS" color={done ? 'accent' : 'secondary'}>
          {n}
        </Text>
      </PressableScale>
      <NumericInput
        value={set.weightKg}
        onChangeValue={(v) => onChange({ weightKg: v })}
        align="center"
        size="md"
        placeholder={bodyweight ? 'BW' : '—'}
        style={styles.input}
        accessibilityLabel={`Set ${n} weight in kilograms`}
        maxLength={6}
      />
      <NumericInput
        value={set.reps}
        onChangeValue={(v) => onChange({ reps: v === null ? null : Math.round(v) })}
        decimals={false}
        align="center"
        size="md"
        placeholder="—"
        style={styles.input}
        accessibilityLabel={`Set ${n} reps`}
        maxLength={4}
      />
      <PressableScale
        onPress={onToggle}
        hitSlop={6}
        style={styles.check}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={`Complete set ${n}`}
      >
        <Checkmark checked={done} size={32} />
      </PressableScale>
    </View>
  );
});

export function SetHeader() {
  const styles = useStyles();
  return (
    <View style={styles.header} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Text variant="label" color="muted" style={styles.hNumber}>
        Set
      </Text>
      <Text variant="label" color="muted" style={styles.hCol}>
        kg
      </Text>
      <Text variant="label" color="muted" style={styles.hCol}>
        Reps
      </Text>
      <View style={styles.hCheck} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
    minHeight: 60,
    paddingHorizontal: t.spacing.xxs,
    borderRadius: t.radius.md,
  },
  done: { backgroundColor: t.colors.accentMuted },
  number: { width: 40, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 48 },
  check: { width: 56, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs, paddingHorizontal: t.spacing.xxs, marginBottom: t.spacing.xxs },
  hNumber: { width: 40, textAlign: 'center' },
  hCol: { flex: 1, textAlign: 'center' },
  hCheck: { width: 56 },
}));
