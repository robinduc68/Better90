import { Plus } from 'lucide-react-native';
import { View } from 'react-native';

import { IconButton, makeStyles, ProgressBar, Text } from '@/design-system';
import { formatPercent, type JourneyProgress } from '@/domain';

interface JourneyHeroProps {
  greeting: string;
  name: string;
  progress: JourneyProgress;
  onQuickLog?: () => void;
}

/** Where am I in my journey — compact, with DAY X as the focal number. */
export function JourneyHero({ greeting, name, progress, onQuickLog }: JourneyHeroProps) {
  const styles = useStyles();
  const remaining =
    progress.isFinished || progress.daysRemaining === 0
      ? 'Final day. Finish strong.'
      : `${progress.daysRemaining} ${progress.daysRemaining === 1 ? 'day' : 'days'} remaining`;
  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <Text variant="bodyMedium" color="secondary" numberOfLines={1} style={styles.flex}>
          {greeting}, {name}
        </Text>
        {onQuickLog ? <IconButton icon={Plus} variant="surface" onPress={onQuickLog} accessibilityLabel="Quick log" /> : null}
      </View>
      <View
        accessible
        accessibilityLabel={`Day ${progress.dayNumber} of ${progress.totalDays}. ${formatPercent(progress.fraction)} of your journey complete. ${remaining}.`}
      >
        <Text variant="label" color="accent">
          Day {progress.dayNumber} of {progress.totalDays}
        </Text>
        <View style={styles.metricRow}>
          <View style={styles.dayValue}>
            <Text variant="metricXL">{progress.dayNumber}</Text>
            <Text variant="h3" color="muted" tabular>
              {' '}/ {progress.totalDays}
            </Text>
          </View>
          <Text variant="metricM" color="secondary">
            {formatPercent(progress.fraction)}
          </Text>
        </View>
        <ProgressBar value={progress.fraction} height={4} style={styles.bar} />
        <Text variant="caption" color="muted" style={styles.caption}>
          {remaining}
        </Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { paddingTop: t.spacing.xs, gap: t.spacing.sm },
  top: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  flex: { flex: 1 },
  metricRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: t.spacing.xxs },
  dayValue: { flexDirection: 'row', alignItems: 'baseline' },
  bar: { marginTop: t.spacing.sm },
  caption: { marginTop: t.spacing.xs },
}));
