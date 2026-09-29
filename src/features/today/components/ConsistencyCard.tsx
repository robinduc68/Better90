import { Flame } from 'lucide-react-native';
import { View } from 'react-native';

import { Card, IconBadge, makeStyles, Text } from '@/design-system';
import { formatPercent, WEEKDAY_LETTER, weekday, type ISODate } from '@/domain';

export interface HeatDay {
  date: ISODate;
  /** null = future / before journey */
  score: number | null;
  counted: boolean;
  isToday: boolean;
}

interface ConsistencyCardProps {
  current: number;
  longest: number;
  showedUpRate: number;
  last7: HeatDay[];
}

/** Makes invested effort visible: streak, last 7 days, showed-up rate. */
export function ConsistencyCard({ current, longest, showedUpRate, last7 }: ConsistencyCardProps) {
  const styles = useStyles();
  return (
    <Card padding="md" style={styles.card}>
      <View style={styles.row}>
        <IconBadge icon={Flame} tone="activity" />
        <View style={styles.flex}>
          <Text variant="metricM" tabular>
            {current} {current === 1 ? 'day' : 'days'}
          </Text>
          <Text variant="caption" color="muted">
            Current streak · best {longest}
          </Text>
        </View>
        <View style={styles.rate}>
          <Text variant="metricS" tabular>
            {formatPercent(showedUpRate)}
          </Text>
          <Text variant="caption" color="muted">
            showed up
          </Text>
        </View>
      </View>
      <View style={styles.heat} accessible accessibilityLabel={`Last 7 days: ${last7.filter((d) => d.counted).length} counted toward your streak`}>
        {last7.map((d) => (
          <View key={d.date} style={styles.day}>
            <View
              style={[
                styles.dot,
                d.score === null && styles.dotFuture,
                d.score !== null && !d.counted && d.score > 0 && styles.dotPartial,
                d.counted && styles.dotDone,
                d.isToday && styles.dotToday,
              ]}
            />
            <Text variant="caption" color={d.isToday ? 'primary' : 'muted'}>
              {WEEKDAY_LETTER[weekday(d.date)]}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: { gap: t.spacing.md },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  rate: { alignItems: 'flex-end' },
  heat: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: t.spacing.xxs },
  day: { alignItems: 'center', gap: t.spacing.xxs },
  dot: { width: 22, height: 22, borderRadius: 11, backgroundColor: t.colors.track },
  dotFuture: { backgroundColor: 'transparent', borderWidth: 1, borderColor: t.colors.border },
  dotPartial: { backgroundColor: t.colors.accentSubtle },
  dotDone: { backgroundColor: t.colors.accent },
  dotToday: { borderWidth: 2, borderColor: t.colors.accentForeground },
}));
