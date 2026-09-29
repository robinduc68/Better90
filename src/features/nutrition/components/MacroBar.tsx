import { View } from 'react-native';

import { makeStyles, ProgressBar, Text, type Tone } from '@/design-system';

interface MacroBarProps {
  label: string;
  value: number;
  target: number | null;
  unit: string;
  tone: 'accent' | Exclude<Tone, 'brand' | 'neutral'>;
  prominent?: boolean;
}

export function MacroBar({ label, value, target, unit, tone, prominent = false }: MacroBarProps) {
  const styles = useStyles();
  const hasTarget = target !== null && target > 0;
  return (
    <View style={styles.root} accessible accessibilityLabel={`${label}: ${Math.round(value)}${unit}${hasTarget ? ` of ${target}${unit}` : ''}`}>
      <View style={styles.head}>
        <Text variant={prominent ? 'bodySemibold' : 'smallMedium'} color={prominent ? 'primary' : 'secondary'}>
          {label}
        </Text>
        <Text variant={prominent ? 'metricS' : 'smallMedium'} tabular>
          {Math.round(value)}
          <Text variant="caption" color="muted">
            {hasTarget ? ` / ${target}${unit}` : unit}
          </Text>
        </Text>
      </View>
      <ProgressBar value={hasTarget ? value / target : 0} height={prominent ? 8 : 4} tone={tone} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { gap: t.spacing.xs },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
}));
