import { View } from 'react-native';

import { Card, makeStyles, MetricText, ProgressBar, QuickAddButton, Text } from '@/design-system';

interface QuickAction {
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
}

interface MetricCardProps {
  label: string;
  value: string;
  unit: string;
  target: string;
  progress: number;
  actions: QuickAction[];
  onPress: () => void;
  accessibilityHint?: string;
}

/** Compact two-column metric with one-tap quick adds (protein, water). */
export function MetricCard({ label, value, unit, target, progress, actions, onPress, accessibilityHint }: MetricCardProps) {
  const styles = useStyles();
  const done = progress >= 1;
  return (
    <Card padding="md" style={styles.card} onPress={onPress} accessibilityLabel={`${label}: ${value}${unit} of ${target}${done ? ', target reached' : ''}`} accessibilityHint={accessibilityHint}>
      <View style={styles.header}>
        <Text variant="label" color="muted">
          {label}
        </Text>
        {done ? (
          <Text variant="caption" color="accent">
            Done
          </Text>
        ) : null}
      </View>
      <MetricText value={value} unit={unit} size="metricM" style={styles.value} />
      <Text variant="caption" color="muted" tabular>
        of {target}
      </Text>
      <ProgressBar value={progress} height={4} style={styles.bar} />
      <View style={styles.actions}>
        {actions.map((a) => (
          <QuickAddButton key={a.label} label={a.label} onPress={a.onPress} accessibilityLabel={a.accessibilityLabel} style={styles.action} />
        ))}
      </View>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: { flex: 1, minWidth: 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 16 },
  value: { marginTop: t.spacing.sm },
  bar: { marginTop: t.spacing.sm },
  actions: { flexDirection: 'row', gap: t.spacing.xs, marginTop: t.spacing.md },
  action: { flex: 1, paddingHorizontal: t.spacing.xxs },
}));
