import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { Timer } from 'lucide-react-native';

import { Button, IconBadge, makeStyles, ProgressBar, Text } from '@/design-system';
import { formatElapsed } from '@/domain';

import { extendRest, skipRest } from './activeActions';
import type { RestTimerView } from './useRestTimer';

/** Compact sticky rest timer; stays visible while browsing the next exercise. */
export function RestTimerBar({ timer }: { timer: RestTimerView }) {
  const styles = useStyles();
  if (!timer.active) return null;
  return (
    <Animated.View entering={FadeInDown.duration(200)} exiting={FadeOutDown.duration(180)} style={styles.bar} accessibilityLiveRegion="polite">
      <View style={styles.row}>
        <IconBadge icon={Timer} tone={timer.justFinished ? 'brand' : 'neutral'} size="sm" style={styles.icon} />
        <View style={styles.time} accessible accessibilityLabel={timer.justFinished ? 'Rest complete' : `Rest, ${timer.remainingSec} seconds left`}>
          <Text variant="label" color={timer.justFinished ? 'accent' : 'muted'}>
            {timer.justFinished ? 'Rest complete' : 'Rest'}
          </Text>
          <Text variant="metricM" color={timer.justFinished ? 'accent' : 'primary'}>
            {formatElapsed(timer.remainingSec)}
          </Text>
        </View>
        {!timer.justFinished ? (
          <View style={styles.actions}>
            <Button label="+30 s" variant="secondary" size="md" onPress={() => void extendRest(30)} accessibilityLabel="Add 30 seconds" />
            <Button label="Skip" variant="ghost" size="md" onPress={() => void skipRest()} accessibilityLabel="Skip rest" />
          </View>
        ) : null}
      </View>
      <ProgressBar value={timer.fraction} height={2} style={styles.progress} />
    </Animated.View>
  );
}

const useStyles = makeStyles((t) => ({
  bar: {
    marginHorizontal: t.layout.screenPaddingDense,
    marginBottom: t.spacing.xs,
    paddingHorizontal: t.spacing.md,
    paddingTop: t.spacing.xs,
    paddingBottom: t.spacing.xs,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: t.colors.borderStrong,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  icon: { marginRight: t.spacing.sm },
  time: { flex: 1, gap: 0 },
  actions: { flexDirection: 'row', gap: t.spacing.xs, alignItems: 'center' },
  progress: { marginTop: t.spacing.xs },
}));
