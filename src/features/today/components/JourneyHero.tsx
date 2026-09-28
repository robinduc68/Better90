import { View } from 'react-native';

import { makeStyles, ProgressBar, Text } from '@/design-system';
import { formatPercent, type JourneyProgress } from '@/domain';

interface JourneyHeroProps {
  greeting: string;
  name: string;
  progress: JourneyProgress;
}

/** Where am I in my journey — the first thing on Today. */
export function JourneyHero({ greeting, name, progress }: JourneyHeroProps) {
  const styles = useStyles();
  const remaining =
    progress.isFinished || progress.daysRemaining === 0
      ? 'Final day. Finish strong.'
      : `${progress.daysRemaining} ${progress.daysRemaining === 1 ? 'day' : 'days'} remaining`;
  return (
    <View style={styles.root}>
      <Text variant="bodyMedium" color="secondary" numberOfLines={1}>
        {greeting}, {name}
      </Text>
      <View
        style={styles.metricRow}
        accessible
        accessibilityLabel={`Day ${progress.dayNumber} of ${progress.totalDays}. ${formatPercent(progress.fraction)} of your journey complete. ${remaining}.`}
      >
        <View style={styles.dayBlock}>
          <Text variant="label" color="muted">
            Day
          </Text>
          <View style={styles.dayValue}>
            <Text variant="metricXL">{progress.dayNumber}</Text>
            <Text variant="h3" color="muted" tabular>
              {' '}
              / {progress.totalDays}
            </Text>
          </View>
        </View>
        <View style={styles.pctBlock}>
          <Text variant="metricL" color="accent">
            {formatPercent(progress.fraction)}
          </Text>
        </View>
      </View>
      <ProgressBar value={progress.fraction} height={4} />
      <Text variant="caption" color="muted" style={styles.caption}>
        {remaining}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { paddingTop: t.spacing.md, gap: t.spacing.sm },
  metricRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: t.spacing.xs },
  dayBlock: { gap: t.spacing.xxs },
  dayValue: { flexDirection: 'row', alignItems: 'baseline' },
  pctBlock: { paddingBottom: t.spacing.xxs },
  caption: { letterSpacing: 0.2 },
}));
