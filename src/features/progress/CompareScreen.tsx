import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { AppHeader, AppScreen, EmptyState, FilterChip, makeStyles, SegmentedControl, Text } from '@/design-system';
import type { PhotoPose } from '@/domain';
import { useAppStore } from '@/store';

import { CompareSlider } from './components/CompareSlider';
import { PrivatePhoto } from './components/PrivatePhoto';

const POSES: { value: PhotoPose; label: string }[] = [
  { value: 'front', label: 'Front' },
  { value: 'side', label: 'Side' },
  { value: 'back', label: 'Back' },
];

export function CompareScreen() {
  const styles = useStyles();
  const photos = useAppStore((s) => s.photos);
  const [pose, setPose] = useState<PhotoPose>('front');
  const [mode, setMode] = useState<'side' | 'slider'>('side');
  const days = useMemo(() => [...new Set(photos.filter((p) => p.pose === pose).map((p) => p.dayNumber))].sort((a, b) => a - b), [photos, pose]);
  const [fromDay, setFromDay] = useState<number | null>(null);
  const [toDay, setToDay] = useState<number | null>(null);
  const a = fromDay ?? days[0] ?? null;
  const b = toDay ?? days[days.length - 1] ?? null;
  const before = photos.find((p) => p.pose === pose && p.dayNumber === a);
  const after = photos.find((p) => p.pose === pose && p.dayNumber === b);

  return (
    <AppScreen header={<AppHeader title="Compare" subtitle={a && b ? `Day ${a} vs Day ${b}` : undefined} />}>
      <SegmentedControl options={POSES} value={pose} onChange={(p) => { setPose(p); setFromDay(null); setToDay(null); }} accessibilityLabel="Pose" />
      {days.length < 2 || !before || !after ? (
        <EmptyState title="Not enough photos" message={`Add ${pose} photos on two different days to compare.`} />
      ) : (
        <>
          <View style={styles.pickers}>
            <DayPicker label="From" days={days.filter((d) => d < (b ?? Infinity))} value={a} onChange={setFromDay} />
            <DayPicker label="To" days={days.filter((d) => d > (a ?? -Infinity))} value={b} onChange={setToDay} />
          </View>
          <SegmentedControl
            options={[
              { value: 'side', label: 'Side by side' },
              { value: 'slider', label: 'Slider' },
            ]}
            value={mode}
            onChange={setMode}
            accessibilityLabel="Comparison mode"
          />
          <View style={styles.stage}>
            {mode === 'side' ? (
              <View style={styles.side}>
                {[before, after].map((p) => (
                  <View key={p.id} style={styles.sideItem}>
                    <PrivatePhoto photo={p} style={styles.sidePhoto} />
                    <Text variant="label" color="secondary" align="center">
                      Day {p.dayNumber}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <CompareSlider before={before} after={after} />
            )}
          </View>
        </>
      )}
    </AppScreen>
  );
}

function DayPicker({ label, days, value, onChange }: { label: string; days: number[]; value: number | null; onChange: (d: number) => void }) {
  const styles = useStyles();
  return (
    <View style={styles.picker}>
      <Text variant="label" color="muted">
        {label}
      </Text>
      <View style={styles.chips}>
        {days.map((d) => (
          <FilterChip key={d} label={`Day ${d}`} selected={d === value} onPress={() => onChange(d)} />
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  pickers: { gap: t.spacing.md, marginVertical: t.spacing.lg },
  picker: { gap: t.spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs },
  stage: { marginTop: t.spacing.lg },
  side: { flexDirection: 'row', gap: t.spacing.sm },
  sideItem: { flex: 1, gap: t.spacing.xs },
  sidePhoto: { width: '100%', aspectRatio: 3 / 4, borderRadius: t.radius.lg },
}));
