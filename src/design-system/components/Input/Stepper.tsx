import { Minus, Plus } from 'lucide-react-native';
import { View } from 'react-native';

import { makeStyles } from '../../theme';
import { IconButton } from '../Button/IconButton';
import { Text } from '../Text';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  step: number;
  min: number;
  max: number;
  format?: (value: number) => string;
  unit?: string;
  label: string;
}

/** Large value with −/+ controls. Used for targets where typing is unnecessary. */
export function Stepper({ value, onChange, step, min, max, format, unit, label }: StepperProps) {
  const styles = useStyles();
  const display = format ? format(value) : String(value);
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 100) / 100));
  return (
    <View
      style={styles.root}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: `${display}${unit ? ` ${unit}` : ''}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') onChange(clamp(value + step));
        if (e.nativeEvent.actionName === 'decrement') onChange(clamp(value - step));
      }}
    >
      <IconButton
        icon={Minus}
        variant="surface"
        size="lg"
        accessibilityLabel={`Decrease ${label}`}
        disabled={value <= min}
        onPress={() => onChange(clamp(value - step))}
      />
      <View style={styles.value}>
        <Text variant="metricL" numberOfLines={1}>
          {display}
        </Text>
        {unit ? (
          <Text variant="bodyMedium" color="secondary" style={styles.unit}>
            {unit}
          </Text>
        ) : null}
      </View>
      <IconButton
        icon={Plus}
        variant="surface"
        size="lg"
        accessibilityLabel={`Increase ${label}`}
        disabled={value >= max}
        onPress={() => onChange(clamp(value + step))}
      />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  value: { flex: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' },
  unit: { marginLeft: t.spacing.xxs },
}));
