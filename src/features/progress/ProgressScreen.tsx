import { router } from 'expo-router';
import { Camera, ChevronRight, Dumbbell, Plus, Ruler, Scale, TrendingUp } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import {
  AppScreen,
  Button,
  Card,
  Chip,
  EmptyState,
  IconBadge,
  IconButton,
  LineChart,
  makeStyles,
  PressableScale,
  SectionHeader,
  SegmentedControl,
  Text,
  useTheme,
} from '@/design-system';
import { formatKg, formatShortDate, formatVolume, type PhotoPose } from '@/domain';
import { useTodayDate } from '@/hooks';
import { useAppStore } from '@/store';

import { CheckpointTimeline } from './components/CheckpointTimeline';
import { PrivatePhoto } from './components/PrivatePhoto';
import { ProgressMetric } from './components/ProgressMetric';
import { StrengthRow } from './components/StrengthRow';
import { useProgressModel, type MeasureKey, type MeasureSummary } from './useProgressModel';

/** Describes change without judging it: +0.5 kg is not "good" or "bad". */
function signed(v: number, unit: string) {
  const r = Math.round(v * 10) / 10;
  if (r === 0) return `±0 ${unit}`;
  return `${r > 0 ? '+' : '−'}${Math.abs(r)} ${unit}`;
}

const BODY: { key: MeasureKey; label: string }[] = [
  { key: 'waistCm', label: 'Waist' },
  { key: 'chestCm', label: 'Chest' },
  { key: 'leftArmCm', label: 'Left arm' },
  { key: 'rightArmCm', label: 'Right arm' },
];

const POSES: { value: PhotoPose; label: string }[] = [
  { value: 'front', label: 'Front' },
  { value: 'side', label: 'Side' },
  { value: 'back', label: 'Back' },
];

export function ProgressScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const today = useTodayDate();
  const model = useProgressModel(today);
  const photos = useAppStore((s) => s.photos);
  const [pose, setPose] = useState<PhotoPose>('front');
  const posePhotos = useMemo(() => photos.filter((p) => p.pose === pose).sort((a, b) => a.dayNumber - b.dayNumber), [photos, pose]);
  if (!model) return null;

  const weight = model.measures.weightKg;
  const sinceDay = (m: MeasureSummary) => (m.first && model.journey.startDate <= m.first.date ? 'since Day 1' : m.first ? `since ${formatShortDate(m.first.date)}` : null);
  const strength = model.strength.filter((s) => s.gain.latest > 0);
  const firstPhoto = posePhotos[0];
  const lastPhoto = posePhotos.length > 1 ? posePhotos[posePhotos.length - 1] : undefined;

  return (
    <AppScreen>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text variant="h1" accessibilityRole="header">
            Your progress
          </Text>
          <Text variant="label" color="accent" style={styles.day}>
            Day {model.progress.dayNumber} / {model.progress.totalDays}
          </Text>
        </View>
        <IconButton icon={Plus} variant="surface" onPress={() => router.push('/progress/measurement')} accessibilityLabel="Add measurement" />
      </View>

      <Card variant="elevated" style={styles.weight}>
        <View style={styles.row}>
          <IconBadge icon={Scale} tone="neutral" size="sm" />
          <Text variant="label" color="muted" style={styles.flex}>
            Body weight
          </Text>
          {weight.first && weight.latest && weight.points.length >= 2 ? <Chip label={signed(weight.latest.value - weight.first.value, 'kg')} tone="neutral" /> : null}
        </View>
        {weight.points.length >= 2 && weight.first && weight.latest ? (
          <>
            <Text variant="metricL" style={styles.weightValue} tabular>
              {formatKg(weight.first.value, false)} → {formatKg(weight.latest.value)}
            </Text>
            <LineChart
              points={weight.points.map((p) => ({ id: p.date, label: formatShortDate(p.date), value: p.value }))}
              formatValue={(v) => formatKg(v)}
              height={120}
              accessibilityLabel={`Weight from ${formatKg(weight.first.value)} to ${formatKg(weight.latest.value)}`}
            />
          </>
        ) : (
          <EmptyState
            title={weight.latest ? `${formatKg(weight.latest.value)} · ${formatShortDate(weight.latest.date)}` : 'No weigh-ins yet'}
            message="No need to weigh in daily. Log at checkpoints to see the trend."
            actionLabel="Add measurement"
            onAction={() => router.push('/progress/measurement')}
          />
        )}
      </Card>

      <SectionHeader title="Checkpoints" />
      <Card padding="md">
        <CheckpointTimeline checkpoints={model.checkpoints} />
      </Card>

      <SectionHeader title="Body" actionLabel="Log" onAction={() => router.push('/progress/measurement')} />
      <View style={styles.grid}>
        {BODY.map((b) => {
          const m = model.measures[b.key];
          const delta = m.first && m.latest && m.first.date !== m.latest.date ? signed(m.latest.value - m.first.value, m.unit) : null;
          return <ProgressMetric key={b.key} icon={Ruler} label={b.label} value={m.latest ? String(m.latest.value) : null} unit={m.unit} delta={delta} since={delta ? sinceDay(m) : null} />;
        })}
      </View>

      <SectionHeader title="Getting stronger" />
      <View style={styles.stats}>
        <StatPill icon={Dumbbell} value={String(model.workoutsCompleted)} label="workouts" />
        <StatPill icon={TrendingUp} value={formatVolume(model.totalVolume)} label="total volume" />
      </View>
      {strength.length === 0 ? (
        <Text variant="small" color="muted" style={styles.hint}>
          Log an exercise twice to see strength changes here.
        </Text>
      ) : (
        <Card padding="none" style={styles.strength}>
          {strength.slice(0, 5).map((s, i) => (
            <View key={s.exercise.id} style={i > 0 && styles.divider}>
              <StrengthRow
                name={s.exercise.name}
                first={s.gain.first}
                latest={s.gain.latest}
                series={s.series}
                onPress={() => router.push({ pathname: '/workout/exercise/[id]', params: { id: s.exercise.id } })}
              />
            </View>
          ))}
        </Card>
      )}

      <SectionHeader title="Progress photos" actionLabel={photos.length ? 'All photos' : undefined} onAction={() => router.push('/progress/photos')} />
      {photos.length === 0 ? (
        <Card padding="md" onPress={() => router.push('/progress/photos')} style={styles.photoCta} accessibilityHint="Opens private progress photos">
          <IconBadge icon={Camera} tone="neutral" />
          <View style={styles.flex}>
            <Text variant="bodyMedium">Add your Day {model.progress.dayNumber} photos</Text>
            <Text variant="caption" color="muted">
              Private to you. Front, side and back.
            </Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </Card>
      ) : (
        <Card padding="md" style={styles.photos}>
          <SegmentedControl options={POSES} value={pose} onChange={setPose} accessibilityLabel="Pose" />
          {firstPhoto ? (
            <PressableScale onPress={() => router.push(lastPhoto ? '/progress/compare' : '/progress/photos')} style={styles.pair} accessibilityLabel={lastPhoto ? `Compare day ${firstPhoto.dayNumber} and day ${lastPhoto.dayNumber}` : 'Open photos'}>
              {[firstPhoto, lastPhoto].map((p, i) =>
                p ? (
                  <View key={p.id} style={styles.photoCol}>
                    <PrivatePhoto photo={p} style={styles.photo} />
                    <Text variant="label" color="secondary" align="center">
                      Day {p.dayNumber}
                    </Text>
                  </View>
                ) : (
                  <View key={`empty-${i}`} style={styles.photoCol}>
                    <View style={[styles.photo, styles.photoEmpty]}>
                      <Plus size={20} color={colors.textMuted} />
                    </View>
                    <Text variant="label" color="muted" align="center">
                      Next checkpoint
                    </Text>
                  </View>
                ),
              )}
            </PressableScale>
          ) : (
            <Text variant="small" color="muted">
              No {pose} photos yet.
            </Text>
          )}
        </Card>
      )}

      <Button label="Share progress" variant="secondary" onPress={() => router.push('/share')} style={styles.share} />
    </AppScreen>
  );
}

function StatPill({ icon, value, label }: { icon: typeof Dumbbell; value: string; label: string }) {
  const styles = useStyles();
  return (
    <View style={styles.pill}>
      <IconBadge icon={icon} tone="brand" size="sm" />
      <View>
        <Text variant="metricS">{value}</Text>
        <Text variant="caption" color="muted">
          {label}
        </Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: t.spacing.md, marginBottom: t.spacing.lg },
  day: { marginTop: t.spacing.xxs },
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
  weight: { gap: t.spacing.sm },
  weightValue: { marginTop: t.spacing.xxs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
  stats: { flexDirection: 'row', gap: t.spacing.sm },
  pill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, padding: t.spacing.sm, borderRadius: t.radius.lg, backgroundColor: t.colors.surfaceSecondary },
  strength: { marginTop: t.spacing.sm },
  divider: { borderTopWidth: 1, borderTopColor: t.colors.border },
  hint: { marginTop: t.spacing.sm },
  photoCta: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  photos: { gap: t.spacing.md },
  pair: { flexDirection: 'row', gap: t.spacing.sm },
  photoCol: { flex: 1, gap: t.spacing.xs },
  photo: { width: '100%', aspectRatio: 3 / 4, borderRadius: t.radius.lg },
  photoEmpty: { backgroundColor: t.colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  share: { marginTop: t.spacing['2xl'] },
}));
