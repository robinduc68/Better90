import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, makeStyles, ProgressRing, Text } from '@/design-system';
import { formatPercent } from '@/domain';
import { useTodayDate } from '@/hooks';
import { haptics } from '@/services/haptics';
import { useAppStore } from '@/store';

import { useShareStats } from './useShareStats';

/** Milestones (Day 7, 15, 30 …) get a meaningful, restrained moment. */
export function MilestoneScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { day } = useLocalSearchParams<{ day: string }>();
  const n = Number(day) || 0;
  const today = useTodayDate();
  const stats = useShareStats(today);
  const markSeen = useAppStore((s) => s.markMilestoneSeen);
  const hasPhotos = useAppStore((s) => new Set(s.photos.map((p) => p.dayNumber)).size >= 2);

  useEffect(() => {
    haptics.success();
    markSeen(n);
  }, [n, markSeen]);

  if (!stats) return null;
  const done = n >= stats.totalDays;

  const rows: [string, string][] = [
    ['Consistency', formatPercent(stats.consistency)],
    ['Workouts', String(stats.workouts)],
  ];
  if (stats.bestLift) rows.push(['Best improvement', `${stats.bestLift.name} +${stats.bestLift.deltaKg} kg`]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 32, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.body}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.ring}>
          <ProgressRing value={n / stats.totalDays} size={132} strokeWidth={6} accessibilityLabel={`Day ${n} of ${stats.totalDays}`}>
            <Text variant="label" color="muted">
              Day
            </Text>
            <Text variant="metricXL">{n}</Text>
          </ProgressRing>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <Text variant="hero" accessibilityRole="header">
            {done ? `${n} DAYS\nCOMPLETED.` : `${n} DAYS OF\nSHOWING UP.`}
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(450).duration(400)} style={styles.rows}>
          {rows.map(([k, v]) => (
            <View key={k} style={styles.row}>
              <Text variant="label" color="muted">
                {k}
              </Text>
              <Text variant="h3" tabular numberOfLines={1}>
                {v}
              </Text>
            </View>
          ))}
        </Animated.View>
      </View>
      <View style={styles.actions}>
        {hasPhotos ? <Button label="Compare progress" variant="secondary" onPress={() => router.replace('/progress/compare')} /> : null}
        <Button label="Share" onPress={() => router.replace('/share')} />
        <Button label="Keep going" variant="ghost" size="md" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} />
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.background, paddingHorizontal: t.layout.screenPadding },
  body: { flex: 1, gap: t.spacing.xl },
  ring: { alignItems: 'flex-start' },
  rows: { gap: t.spacing.md, borderTopWidth: 1, borderTopColor: t.colors.border, paddingTop: t.spacing.lg },
  row: { gap: t.spacing.xxs },
  actions: { gap: t.spacing.xs },
}));
