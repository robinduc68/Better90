import { TrendingUp, Trophy } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { IconBadge, makeStyles, Text } from '@/design-system';
import { formatKg, formatSignedKg, formatSignedPercent, type ExerciseInsight } from '@/domain';

/**
 * Compact, non-interrupting progression feedback. Suggestions come from the
 * previous session; the prefilled weight is never changed for the user.
 */
export function ProgressionInsight({ insight, doneSets }: { insight: ExerciseInsight; doneSets: number }) {
  const styles = useStyles();
  const pr = insight.isWeightPR ? 'New PR' : insight.isRepPR ? 'Rep PR' : null;
  const gained = doneSets > 0 && insight.weightDeltaKg !== null && insight.weightDeltaKg > 0 ? formatSignedKg(insight.weightDeltaKg) : null;
  const volume =
    doneSets > 0 && doneSets >= insight.previousSets.length && insight.volumeDeltaPct !== null && insight.volumeDeltaPct > 0
      ? `${formatSignedPercent(insight.volumeDeltaPct)} volume`
      : null;

  if (pr || gained || volume) {
    return (
      <Animated.View entering={ZoomIn.duration(200)} style={styles.box} accessibilityLiveRegion="polite">
        <IconBadge icon={Trophy} tone="brand" size="sm" />
        <View style={styles.flex}>
          <Text variant="label" color="accent">
            {pr ?? 'Progress'}
          </Text>
          <Text variant="smallMedium" tabular>
            {[gained, volume].filter(Boolean).join(' · ') || 'More reps than ever at this weight'}
          </Text>
        </View>
      </Animated.View>
    );
  }

  if (insight.suggestion) {
    return (
      <View style={styles.box}>
        <IconBadge icon={TrendingUp} tone="positive" size="sm" />
        <View style={styles.flex}>
          <Text variant="label" color="secondary">
            Ready to progress
          </Text>
          <Text variant="small" color="secondary">
            {insight.suggestion.kind === 'increase_weight'
              ? `Target reached last session. Try ${formatKg(insight.suggestion.nextWeightKg)} when ready.`
              : 'Target reached last session. Try an extra rep when ready.'}
          </Text>
        </View>
      </View>
    );
  }
  return null;
}

const useStyles = makeStyles((t) => ({
  box: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, marginTop: t.spacing.sm, paddingVertical: t.spacing.xs },
  flex: { flex: 1, gap: 1 },
}));
