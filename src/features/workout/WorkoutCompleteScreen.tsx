import { router, useLocalSearchParams } from 'expo-router';
import { Share2, Trophy } from 'lucide-react-native';
import { useEffect, useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getExercise } from '@/data/exercises';
import { Button, Card, EmptyState, IconBadge, makeStyles, Text } from '@/design-system';
import { formatElapsed, formatKg, formatSignedKg, formatSignedPercent, formatVolume, sessionDurationSec, summarizeSession, topSet } from '@/domain';
import { useAppStore } from '@/store';

import { ExerciseArtwork, TemplateArtwork } from './artwork';

/** Allowed to feel rewarding — restrained motion, real numbers only. */
export function WorkoutCompleteScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
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

  const stats: { value: string; label: string; accent?: boolean }[] = [
    { value: String(summary.exerciseCount), label: summary.exerciseCount === 1 ? 'Exercise' : 'Exercises' },
    { value: String(summary.setCount), label: 'Sets' },
    { value: formatVolume(summary.volume), label: 'Volume' },
    summary.prs.length > 0
      ? { value: String(summary.prs.length), label: summary.prs.length === 1 ? 'PR' : 'PRs', accent: true }
      : // Only show the comparison when it's an improvement; a shorter session isn't a failure.
        summary.volumeDeltaPct !== null && summary.volumeDeltaPct > 0
        ? { value: formatSignedPercent(summary.volumeDeltaPct), label: 'vs last session', accent: true }
        : { value: String(Math.round(sessionDurationSec(session) / 60)), label: 'Minutes' },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.hero}>
          <View style={styles.heroText}>
            <Text variant="label" color="accent" accessibilityRole="header">
              Workout complete
            </Text>
            <Text variant="h2" style={styles.name} numberOfLines={2}>
              {session.name}
            </Text>
            <Text variant="hero" style={styles.time}>
              {formatElapsed(sessionDurationSec(session))}
            </Text>
          </View>
          <TemplateArtwork template={session} size={112} framed={false} />
        </Animated.View>

        <View style={styles.grid}>
          {stats.map((s, i) => (
            <Animated.View key={s.label} entering={FadeInDown.delay(150 + i * 70).duration(320)} style={styles.statWrap}>
              <Card variant="elevated" padding="md" style={styles.stat}>
                <Text variant="metricM" color={s.accent ? 'accent' : 'primary'} numberOfLines={1} adjustsFontSizeToFit>
                  {s.value}
                </Text>
                <Text variant="label" color="muted">
                  {s.label}
                </Text>
              </Card>
            </Animated.View>
          ))}
        </View>

        {summary.prs.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(450).duration(320)}>
            <Card variant="elevated" style={styles.list}>
              <View style={styles.listHead}>
                <IconBadge icon={Trophy} tone="brand" size="sm" />
                <Text variant="label" color="accent">
                  Improvements
                </Text>
              </View>
              {summary.prs.map((pr) => (
                <View key={pr.exerciseId} style={styles.row}>
                  <Text variant="bodyMedium" style={styles.flex} numberOfLines={1}>
                    {getExercise(pr.exerciseId)?.name ?? pr.exerciseId}
                  </Text>
                  <Text variant="smallMedium" color="accent" tabular>
                    {pr.kind === 'weight'
                      ? pr.deltaKg !== null
                        ? formatSignedKg(pr.deltaKg)
                        : formatKg(pr.weightKg)
                      : pr.deltaReps
                        ? `+${pr.deltaReps} ${pr.deltaReps === 1 ? 'rep' : 'reps'}`
                        : 'More reps'}
                  </Text>
                </View>
              ))}
            </Card>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(520).duration(320)}>
          <Card style={styles.list}>
            <Text variant="label" color="muted">
              Exercises
            </Text>
            {session.exercises.map((ex) => {
              const exercise = getExercise(ex.exerciseId);
              const top = topSet(ex.sets);
              return (
                <View key={ex.id} style={styles.row}>
                  {exercise ? <ExerciseArtwork exercise={exercise} variant="thumbnail" /> : null}
                  <View style={styles.flex}>
                    <Text variant="bodyMedium" numberOfLines={1}>
                      {exercise?.name ?? ex.exerciseId}
                    </Text>
                    <Text variant="caption" color="muted" tabular>
                      {ex.sets.length} {ex.sets.length === 1 ? 'set' : 'sets'}
                    </Text>
                  </View>
                  <Text variant="smallMedium" tabular>
                    {top ? `${top.weightKg ? formatKg(top.weightKg) : 'BW'} × ${top.reps}` : '—'}
                  </Text>
                </View>
              );
            })}
          </Card>
        </Animated.View>
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button label="Done" onPress={() => router.replace('/(tabs)')} />
        <Button label="Share progress" icon={Share2} variant="ghost" size="md" onPress={() => router.push('/share')} />
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.background },
  content: { paddingHorizontal: t.layout.screenPadding, paddingTop: t.spacing.xl, paddingBottom: t.spacing.xl, gap: t.spacing.md },
  flex: { flex: 1 },
  hero: { flexDirection: 'row', alignItems: 'center', marginBottom: t.spacing.xs },
  heroText: { flex: 1 },
  name: { marginTop: t.spacing.xs },
  time: { marginTop: t.spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -t.spacing.xxs },
  statWrap: { width: '50%', padding: t.spacing.xxs },
  stat: { gap: t.spacing.xxs },
  list: { gap: t.spacing.sm },
  listHead: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  actions: { paddingHorizontal: t.layout.screenPadding, paddingTop: t.spacing.sm, gap: t.spacing.xxs, borderTopWidth: 1, borderTopColor: t.colors.border },
}));
