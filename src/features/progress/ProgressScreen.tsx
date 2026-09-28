import { router } from 'expo-router';
import { Camera, Check, ChevronRight, Plus } from 'lucide-react-native';
import { View } from 'react-native';

import {
  AppScreen,
  Button,
  Card,
  ChartCard,
  EmptyState,
  IconButton,
  LineChart,
  ListGroup,
  ListRow,
  makeStyles,
  SectionHeader,
  StatCard,
  Text,
  useTheme,
  Divider,
} from '@/design-system';
import { formatKg, formatShortDate, formatSignedKg, formatVolume } from '@/domain';
import { useTodayDate } from '@/hooks';

import { MEASURES, useProgressModel, type MeasureSummary } from './useProgressModel';

function signed(v: number, unit: string) {
  const r = Math.round(v * 10) / 10;
  if (r === 0) return `±0 ${unit}`;
  return `${r > 0 ? '+' : '−'}${Math.abs(r)} ${unit}`;
}

export function ProgressScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const today = useTodayDate();
  const model = useProgressModel(today);
  if (!model) return null;
  const weight = model.measures.weightKg;

  return (
    <AppScreen>
      <View style={styles.header}>
        <View>
          <Text variant="h1" accessibilityRole="header">
            Your progress
          </Text>
          <Text variant="small" color="muted" tabular>
            Journey day {model.progress.dayNumber} of {model.progress.totalDays}
          </Text>
        </View>
        <IconButton icon={Plus} variant="surface" onPress={() => router.push('/progress/measurement')} accessibilityLabel="Add measurement" />
      </View>

      <SectionHeader title="Weight" />
      {weight.points.length >= 2 && weight.first && weight.latest ? (
        <ChartCard
          title="Body weight"
          summary={`${formatKg(weight.first.value)} → ${formatKg(weight.latest.value)}`}
          delta={signed(weight.latest.value - weight.first.value, 'kg')}
        >
          <LineChart
            points={weight.points.map((p) => ({ id: p.date, label: formatShortDate(p.date), value: p.value }))}
            formatValue={(v) => formatKg(v)}
            accessibilityLabel={`Weight from ${formatKg(weight.first.value)} to ${formatKg(weight.latest.value)}`}
          />
        </ChartCard>
      ) : (
        <Card variant="flat">
          <EmptyState
            title={weight.latest ? `${formatKg(weight.latest.value)} · ${formatShortDate(weight.latest.date)}` : 'No weigh-ins yet'}
            message="No need to weigh in daily. Log at checkpoints to see the trend."
            actionLabel="Add measurement"
            onAction={() => router.push('/progress/measurement')}
          />
        </Card>
      )}

      <SectionHeader title="Checkpoints" />
      <View style={styles.checkpoints}>
        {model.checkpoints.map((cp) => (
          <View key={cp.day} style={styles.checkpoint} accessible accessibilityLabel={`Day ${cp.day}, ${cp.state === 'done' ? 'logged' : cp.state === 'now' ? 'due now' : cp.state === 'upcoming' ? 'upcoming' : 'not logged'}`}>
            <View style={[styles.cpDot, cp.state === 'done' && styles.cpDone, cp.state === 'now' && styles.cpNow]}>
              {cp.state === 'done' ? <Check size={14} color={colors.onAccent} strokeWidth={3} /> : null}
            </View>
            <Text variant="caption" color={cp.state === 'upcoming' ? 'muted' : 'secondary'} tabular>
              {cp.day}
            </Text>
          </View>
        ))}
      </View>

      <SectionHeader title="Body" actionLabel="Add" onAction={() => router.push('/progress/measurement')} />
      <ListGroup>
        {MEASURES.filter((m) => m.key !== 'weightKg').map((m, i) => (
          <View key={m.key}>
            {i > 0 ? <Divider inset={16} /> : null}
            <MeasureRow summary={model.measures[m.key]} />
          </View>
        ))}
      </ListGroup>

      <SectionHeader title="Photos" />
      <Card onPress={() => router.push('/progress/photos')} style={styles.photos} accessibilityHint="Opens private progress photos">
        <View style={styles.photoIcon}>
          <Camera size={20} color={colors.textSecondary} />
        </View>
        <View style={styles.flex}>
          <Text variant="bodyMedium">Progress photos</Text>
          <Text variant="caption" color="muted">
            {model.photoCount ? `${model.photoCount} private ${model.photoCount === 1 ? 'photo' : 'photos'}` : 'Private to you. Front, side, back.'}
          </Text>
        </View>
        <ChevronRight size={18} color={colors.textMuted} />
      </Card>

      <SectionHeader title="Strength" />
      <View style={styles.stats}>
        <StatCard label="Workouts" value={String(model.workoutsCompleted)} />
        <StatCard label="Total volume" value={formatVolume(model.totalVolume)} />
      </View>
      {model.strength.length === 0 ? (
        <Text variant="small" color="muted" style={styles.hint}>
          Log an exercise twice to see strength changes here.
        </Text>
      ) : (
        <View style={styles.strength}>
          <ListGroup>
            {model.strength.slice(0, 6).map((s, i) => (
              <View key={s.exercise.id}>
                {i > 0 ? <Divider inset={16} /> : null}
                <ListRow
                  title={s.exercise.name}
                  subtitle={`${formatKg(s.gain.first)} → ${formatKg(s.gain.latest)}`}
                  value={s.gain.deltaKg !== 0 ? formatSignedKg(s.gain.deltaKg) : 'Holding'}
                  onPress={() => router.push({ pathname: '/workout/exercise/[id]', params: { id: s.exercise.id } })}
                />
              </View>
            ))}
          </ListGroup>
        </View>
      )}
      <Button label="Share progress" variant="secondary" onPress={() => router.push('/share')} style={styles.share} />
    </AppScreen>
  );
}

function MeasureRow({ summary }: { summary: MeasureSummary }) {
  const styles = useStyles();
  const { first, latest } = summary;
  const delta = first && latest && first.date !== latest.date ? latest.value - first.value : null;
  return (
    <View style={styles.measure} accessible accessibilityLabel={`${summary.label}: ${latest ? `${latest.value} ${summary.unit}` : 'not logged'}`}>
      <Text variant="bodyMedium" style={styles.flex}>
        {summary.label}
      </Text>
      <Text variant="bodyMedium" tabular>
        {latest ? `${latest.value} ${summary.unit}` : '—'}
      </Text>
      <Text variant="caption" color="muted" tabular style={styles.delta}>
        {delta !== null ? signed(delta, summary.unit) : ''}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: t.spacing.md },
  checkpoints: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: t.spacing.xxs },
  checkpoint: { alignItems: 'center', gap: t.spacing.xs },
  cpDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: t.colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  cpDone: { backgroundColor: t.colors.accent, borderColor: t.colors.accent },
  cpNow: { borderColor: t.colors.accent, borderWidth: 2 },
  measure: { flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingHorizontal: t.spacing.md, gap: t.spacing.sm },
  delta: { width: 72, textAlign: 'right' },
  photos: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  photoIcon: { width: 44, height: 44, borderRadius: t.radius.md, backgroundColor: t.colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', gap: t.spacing.sm },
  strength: { marginTop: t.spacing.sm },
  hint: { marginTop: t.spacing.sm },
  share: { marginTop: t.spacing['2xl'] },
}));
