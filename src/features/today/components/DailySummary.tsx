import { View } from 'react-native';

import { Card, makeStyles, ProgressRing, Text } from '@/design-system';
import { formatPercent, type DayScore } from '@/domain';

interface DailySummaryProps {
  score: DayScore;
  nextLabel: string | null;
  isToday: boolean;
  streak: number;
}

export function DailySummary({ score, nextLabel, isToday, streak }: DailySummaryProps) {
  const styles = useStyles();
  const allDone = score.totalCount > 0 && score.doneCount === score.totalCount;
  const message = allDone
    ? isToday
      ? 'Everything done today.'
      : 'Everything done.'
    : nextLabel
      ? `Next: ${nextLabel}`
      : 'Add habits to track your day.';
  return (
    <Card padding="lg" style={styles.card}>
      <ProgressRing value={score.score} size={96} strokeWidth={8} accessibilityLabel={`${formatPercent(score.score)} of ${isToday ? "today's" : 'this day’s'} goals complete`}>
        <Text variant="metricM">{formatPercent(score.score)}</Text>
        <Text variant="label" color="muted" style={styles.ringLabel}>
          {isToday ? 'Today' : 'Day'}
        </Text>
      </ProgressRing>
      <View style={styles.body}>
        <Text variant="h3" tabular>
          {score.doneCount} of {score.totalCount} done
        </Text>
        <Text variant="small" color="secondary" numberOfLines={2}>
          {message}
        </Text>
        {streak > 0 ? (
          <View style={styles.streak}>
            <Text variant="caption" color="muted">
              Streak
            </Text>
            <Text variant="caption" color="accent" tabular>
              {streak} {streak === 1 ? 'day' : 'days'}
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg },
  ringLabel: { marginTop: -2 },
  body: { flex: 1, gap: t.spacing.xxs },
  streak: { flexDirection: 'row', gap: t.spacing.xs, marginTop: t.spacing.xs },
}));
