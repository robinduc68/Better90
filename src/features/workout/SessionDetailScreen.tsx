import { router, useLocalSearchParams } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { getExercise } from '@/data/exercises';
import { AppHeader, AppScreen, Button, Card, Chip, ConfirmSheet, EmptyState, makeStyles, StatCard, Text } from '@/design-system';
import { formatDayDate, formatDuration, formatKg, formatVolume, exerciseVolume, sessionDurationSec, sessionVolume, summarizeSession } from '@/domain';
import { useAppStore } from '@/store';

export function SessionDetailScreen() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessions = useAppStore((s) => s.sessions);
  const deleteSession = useAppStore((s) => s.deleteSession);
  const session = sessions.find((s) => s.id === id);
  const [confirm, setConfirm] = useState(false);
  const summary = useMemo(
    () => (session ? summarizeSession(session, sessions, (exId) => getExercise(exId)?.equipment ?? 'other') : null),
    [session, sessions],
  );

  if (!session || !summary) {
    return (
      <AppScreen header={<AppHeader />}>
        <EmptyState title="Workout not found" message="It may have been deleted." />
      </AppScreen>
    );
  }
  const prIds = new Set(summary.prs.map((p) => p.exerciseId));

  return (
    <AppScreen header={<AppHeader title={session.name} subtitle={formatDayDate(session.date)} />}>
      <View style={styles.stats}>
        <StatCard label="Duration" value={formatDuration(Math.round(sessionDurationSec(session) / 60))} />
        <StatCard label="Volume" value={formatVolume(sessionVolume(session))} />
        <StatCard label="Sets" value={String(summary.setCount)} />
      </View>
      <View style={styles.list}>
        {session.exercises.map((ex) => {
          const exercise = getExercise(ex.exerciseId);
          const sets = ex.sets.filter((s) => s.completedAt);
          return (
            <Card key={ex.id} padding="md" onPress={() => router.push({ pathname: '/workout/exercise/[id]', params: { id: ex.exerciseId } })}>
              <View style={styles.exHeader}>
                <Text variant="bodySemibold" style={styles.flex} numberOfLines={1}>
                  {exercise?.name ?? ex.exerciseId}
                </Text>
                {prIds.has(ex.exerciseId) ? <Chip label="PR" tone="accent" /> : null}
              </View>
              {sets.map((s, i) => (
                <View key={s.id} style={styles.setRow}>
                  <Text variant="small" color="muted" style={styles.setNo} tabular>
                    {i + 1}
                  </Text>
                  <Text variant="smallMedium" tabular style={styles.flex}>
                    {s.weightKg ? formatKg(s.weightKg) : 'Bodyweight'} × {s.reps ?? '—'}
                  </Text>
                </View>
              ))}
              <Text variant="caption" color="muted" tabular style={styles.exVolume}>
                {formatVolume(exerciseVolume(ex))}
              </Text>
            </Card>
          );
        })}
      </View>
      <Button label="Delete workout" variant="ghost" size="md" icon={Trash2} onPress={() => setConfirm(true)} style={styles.delete} />
      <ConfirmSheet
        visible={confirm}
        title="Delete this workout?"
        message="It will be removed from your history and progress charts."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          deleteSession(session.id);
          router.back();
        }}
      />
    </AppScreen>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  stats: { flexDirection: 'row', gap: t.spacing.xs },
  list: { marginTop: t.spacing.xl, gap: t.spacing.xs },
  exHeader: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs, marginBottom: t.spacing.xs },
  setRow: { flexDirection: 'row', alignItems: 'center', minHeight: 28 },
  setNo: { width: 24 },
  exVolume: { marginTop: t.spacing.xs },
  delete: { marginTop: t.spacing['2xl'], alignSelf: 'center' },
}));
