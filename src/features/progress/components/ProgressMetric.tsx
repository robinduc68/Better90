import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Card, IconBadge, makeStyles, Text, type Tone } from '@/design-system';

interface ProgressMetricProps {
  icon: LucideIcon;
  tone?: Tone;
  label: string;
  value: string | null;
  unit: string;
  /** Neutral description of change — never judged good or bad. */
  delta: string | null;
  since: string | null;
}

export function ProgressMetric({ icon, tone = 'neutral', label, value, unit, delta, since }: ProgressMetricProps) {
  const styles = useStyles();
  return (
    <Card variant="base" padding="md" style={styles.card} accessibilityLabel={`${label}: ${value ? `${value} ${unit}` : 'not logged'}${delta ? `, ${delta} ${since ?? ''}` : ''}`}>
      <View style={styles.head}>
        <IconBadge icon={icon} tone={tone} size="sm" />
        <Text variant="label" color="muted" numberOfLines={1} style={styles.flex}>
          {label}
        </Text>
      </View>
      <View style={styles.value}>
        <Text variant="metricM">{value ?? '—'}</Text>
        {value ? (
          <Text variant="smallMedium" color="secondary" style={styles.unit}>
            {unit}
          </Text>
        ) : null}
      </View>
      <Text variant="caption" color="muted" tabular numberOfLines={1}>
        {delta ? `${delta}${since ? ` ${since}` : ''}` : value ? 'First entry' : 'Not logged yet'}
      </Text>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: { flexBasis: '47%', flexGrow: 1, gap: t.spacing.xs },
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
  value: { flexDirection: 'row', alignItems: 'baseline', marginTop: t.spacing.xxs },
  unit: { marginLeft: 3 },
}));
