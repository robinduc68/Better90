import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { EQUIPMENT_LABEL, getExercise, MUSCLE_GROUP_LABEL } from '@/data/exercises';
import { AppHeader, AppScreen, Card, ChartCard, EmptyState, LineChart, makeStyles, SectionHeader, Text } from '@/design-system';
import { formatKg, formatShortDate, formatSignedKg, strengthSeries } from '@/domain';
import { useAppStore } from '@/store';

import { ExerciseImage } from './components/ExerciseImage';
import { formatSetList } from './format';

export function ExerciseDetailScreen() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const exercise = getExercise(id ?? '');
  const sessions = useAppStore((s) => s.sessions);
  const series = useMemo(() => (exercise ? strengthSeries(sessions, exercise.id) : []), [sessions, exercise]);

  if (!exercise) {
    return (
      <AppScreen header={<AppHeader />}>
        <EmptyState title="Exercise not found" message="It may have been removed from the library." />
      </AppScreen>
    );
  }

  const first = series[0];
  const last = series[series.length - 1];
  const best = series.reduce<(typeof series)[number] | null>((b, p) => (!b || p.topWeightKg > b.topWeightKg ? p : b), null);

  return (
    <AppScreen header={<AppHeader title={exercise.name} />} safeTop>
      <ExerciseImage exercise={exercise} variant="hero" />
      <Text variant="h1" style={styles.title}>
        {exercise.name}
      </Text>

      <View style={styles.facts}>
        <Fact label="Primary" value={MUSCLE_GROUP_LABEL[exercise.muscleGroup]} />
        <Fact label="Secondary" value={exercise.secondaryMuscles.join(' • ') || '—'} />
        <Fact label="Equipment" value={EQUIPMENT_LABEL[exercise.equipment]} />
      </View>

      <SectionHeader title="How to" />
      <View style={styles.steps}>
        {exercise.instructions.map((step, i) => (
          <View key={i} style={styles.step}>
            <Text variant="smallMedium" color="accent" tabular style={styles.stepNo}>
              {i + 1}
            </Text>
            <Text variant="body" color="secondary" style={styles.stepText}>
              {step}
            </Text>
          </View>
        ))}
      </View>
      <Text variant="caption" color="muted" style={styles.disclaimer}>
        General cues, not personal coaching. Use a load you can control.
      </Text>

      <SectionHeader title="History" />
      {series.length === 0 ? (
        <Card variant="flat">
          <EmptyState title="No history yet" message="Log this exercise in a workout to see your strength trend." />
        </Card>
      ) : (
        <>
          {series.length > 1 && first && last ? (
            <ChartCard
              title="Top set"
              summary={`${formatKg(first.topWeightKg)} → ${formatKg(last.topWeightKg)}`}
              delta={last.topWeightKg !== first.topWeightKg ? formatSignedKg(last.topWeightKg - first.topWeightKg) : undefined}
            >
              <LineChart
                points={series.map((p) => ({ id: p.sessionId, label: formatShortDate(p.date), value: p.topWeightKg }))}
                formatValue={(v) => formatKg(v)}
                accessibilityLabel={`Top set weight over ${series.length} sessions, from ${formatKg(first.topWeightKg)} to ${formatKg(last.topWeightKg)}`}
              />
            </ChartCard>
          ) : null}
          {best ? (
            <Text variant="small" color="secondary" style={styles.best} tabular>
              Best: {formatKg(best.topWeightKg)} × {best.topReps}
            </Text>
          ) : null}
          <View style={styles.history}>
            {[...series].reverse().map((p) => (
              <View key={p.sessionId} style={styles.historyRow}>
                <Text variant="smallMedium" color="muted" style={styles.historyDate}>
                  {formatShortDate(p.date)}
                </Text>
                <View style={styles.historyBody}>
                  <Text variant="bodySemibold" tabular>
                    {formatKg(p.topWeightKg)}
                  </Text>
                  <Text variant="small" color="secondary" tabular>
                    {formatSetList(p.sets)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </AppScreen>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.fact}>
      <Text variant="label" color="muted">
        {label}
      </Text>
      <Text variant="bodyMedium">{value}</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  title: { marginTop: t.spacing.xl },
  facts: { marginTop: t.spacing.lg, gap: t.spacing.md },
  fact: { gap: t.spacing.xxs },
  steps: { gap: t.spacing.sm },
  step: { flexDirection: 'row', gap: t.spacing.sm },
  stepNo: { width: 20, paddingTop: 2 },
  stepText: { flex: 1 },
  disclaimer: { marginTop: t.spacing.md },
  best: { marginTop: t.spacing.md },
  history: { marginTop: t.spacing.md },
  historyRow: { flexDirection: 'row', gap: t.spacing.md, paddingVertical: t.spacing.sm, borderBottomWidth: 1, borderBottomColor: t.colors.border },
  historyDate: { width: 56, paddingTop: 2 },
  historyBody: { flex: 1, gap: 2 },
}));
