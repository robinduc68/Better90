import { router, useLocalSearchParams } from 'expo-router';
import { Share2, Trophy } from 'lucide-react-native';
import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getExercise } from '@/data/exercises';
import { Button, Card, EmptyState, makeStyles, Text, useTheme } from '@/design-system';
import { formatElapsed, formatKg, formatSignedKg, formatSignedPercent, formatVolume, sessionDurationSec, summarizeSession, topSet } from '@/domain';
import { useAppStore } from '@/store';

/** Allowed to feel rewarding — restrained motion, real numbers. */
export function WorkoutCompleteScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessions = useAppStore((s) => s.sessions);
  const session = sessions.find((s) => s.id === id);
  const summary = useMemo(
    () => (session ? summarizeSession(session, sessions, (exId) => getExercise(exId)?.equipment ?? 'other') : null),
    [session, sessions],
  );

  useEffect(() => {
    if (!session) router.replace('/(tabs)');
  }, [session]);

  if (!session || !summary) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <EmptyState title="Workout saved" message="Find it in your workout history." />
      </View>
    );
  }

  const stats: [string, string][] = [
    [String(summary.exerciseCount), summary.exerciseCount === 1 ? 'Exercise' : 'Exercises'],
    [String(summary.setCount), 'Sets'],
    [formatVolume(summary.volume), 'Volume'],
  ];
  if (summary.volumeDeltaPct !== null) stats.push([formatSignedPercent(summary.volumeDeltaPct), 'vs last session']);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.body}>
        <Animated.View entering={FadeIn.duration(400)}>
          <Text variant="label" color="accent" accessibilityRole="header">
            Workout complete
          </Text>
          <Text variant="h2" style={styles.name}>
            {session.name}
          </Text>
          <Text variant="hero" style={styles.time}>
            {formatElapsed(sessionDurationSec(session))}
          </Text>
        </Animated.View>

        <View style={styles.grid}>
          {stats.map(([value, label], i) => (
            <Animated.View key={label} entering={FadeInDown.delay(150 + i * 80).duration(350)} style={styles.stat}>
              <Text
                variant="metricM"
                color={label === 'vs last session' && (summary.volumeDeltaPct ?? 0) > 0 ? 'accent' : 'primary'}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {value}
              </Text>
              <Text variant="label" color="muted">
                {label}
              </Text>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(420).duration(350)} style={styles.exercises}>
          {session.exercises.map((ex) => {
            const top = topSet(ex.sets);
            return (
              <View key={ex.id} style={styles.exRow}>
                <Text variant="small" color="secondary" style={styles.flex} numberOfLines={1}>
                  {getExercise(ex.exerciseId)?.name ?? ex.exerciseId}
                </Text>
                <Text variant="smallMedium" tabular>
                  {top ? `${top.weightKg ? formatKg(top.weightKg) : 'BW'} × ${top.reps}` : '—'}
                </Text>
              </View>
            );
          })}
        </Animated.View>

        {summary.prs.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(500).duration(350)}>
            <Card variant="elevated" style={styles.prs}>
              <View style={styles.prHeader}>
                <Trophy size={16} color={colors.accentForeground} />
                <Text variant="label" color="accent">
                  {summary.prs.length === 1 ? 'New PR' : `${summary.prs.length} new PRs`}
                </Text>
              </View>
              {summary.prs.map((pr) => (
                <View key={pr.exerciseId} style={styles.prRow}>
                  <Text variant="bodyMedium" style={styles.flex} numberOfLines={1}>
                    {getExercise(pr.exerciseId)?.name ?? pr.exerciseId}
                  </Text>
                  <Text variant="smallMedium" color="secondary" tabular>
                    {pr.kind === 'weight' && pr.deltaKg !== null ? formatSignedKg(pr.deltaKg) : `${formatKg(pr.weightKg)} · more reps`}
                  </Text>
                </View>
              ))}
            </Card>
          </Animated.View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button label="Done" onPress={() => router.replace('/(tabs)')} />
        <Button label="Share progress" icon={Share2} variant="ghost" size="md" onPress={() => router.push('/share')} />
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.background, paddingHorizontal: t.layout.screenPadding },
  body: { flex: 1, gap: t.spacing.lg },
  flex: { flex: 1 },
  name: { marginTop: t.spacing.xs },
  time: { marginTop: t.spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: t.spacing.xl },
  stat: { width: '50%', gap: t.spacing.xxs, paddingRight: t.spacing.md },
  prs: { gap: t.spacing.sm },
  prHeader: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
  prRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  actions: { gap: t.spacing.xxs },
  exercises: { borderTopWidth: 1, borderTopColor: t.colors.border, paddingTop: t.spacing.sm },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minHeight: 32 },
}));
