import { Check } from 'lucide-react-native';
import { View } from 'react-native';

import { Card, makeStyles, Text, useTheme } from '@/design-system';
import { WEEKDAY_LETTER, weekday, type ISODate } from '@/domain';

export interface WeekStripDay {
  date: ISODate;
  planned: boolean;
  done: boolean;
  isToday: boolean;
}

/** This week's sessions at a glance: done ✓, planned ring, rest day dot. */
export function WeekStrip({ days, done, target }: { days: WeekStripDay[]; done: number; target: number }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Card padding="md" style={styles.card}>
      <View style={styles.header}>
        <Text variant="label" color="muted">
          This week
        </Text>
        <Text variant="metricS" tabular>
          {done}
          <Text variant="smallMedium" color="muted">
            {' '}/ {target} sessions
          </Text>
        </Text>
      </View>
      <View style={styles.row} accessible accessibilityLabel={`${done} of ${target} sessions this week`}>
        {days.map((d) => (
          <View key={d.date} style={styles.day}>
            <View style={[styles.dot, d.planned && styles.planned, d.done && styles.done, d.isToday && !d.done && styles.today]}>
              {d.done ? <Check size={14} color={colors.onAccent} strokeWidth={3} /> : !d.planned ? <View style={styles.rest} /> : null}
            </View>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: t.spacing.xxs },
  dot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  planned: { backgroundColor: t.colors.surfaceSecondary, borderWidth: 1.5, borderColor: t.colors.borderStrong },
  done: { backgroundColor: t.colors.accent, borderWidth: 0 },
  today: { borderWidth: 2, borderColor: t.colors.accentForeground },
  rest: { width: 6, height: 6, borderRadius: 3, backgroundColor: t.colors.borderStrong },
}));
