import { router } from 'expo-router';
import { Camera, Images, Lock, Plus, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import {
  AppHeader,
  AppScreen,
  BottomSheet,
  Button,
  ConfirmSheet,
  FilterChip,
  ListRow,
  makeStyles,
  PressableScale,
  SectionHeader,
  Text,
  useTheme,
} from '@/design-system';
import { activeCheckpoint, checkpointsFor, journeyProgress, type PhotoPose, type ProgressPhoto } from '@/domain';
import { useTodayDate } from '@/hooks';
import { useAppStore } from '@/store';

import { PrivatePhoto } from './components/PrivatePhoto';
import { addProgressPhoto, removeProgressPhoto } from './photoActions';

const POSES: { key: PhotoPose; label: string }[] = [
  { key: 'front', label: 'Front' },
  { key: 'side', label: 'Side' },
  { key: 'back', label: 'Back' },
];

export function PhotosScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const today = useTodayDate();
  const journey = useAppStore((s) => s.journey);
  const photos = useAppStore((s) => s.photos);
  const currentDay = journey ? journeyProgress(journey, today).dayNumber : 1;
  const defaultDay = journey ? (activeCheckpoint(journey.durationDays, currentDay) ?? currentDay) : 1;

  const days = useMemo(() => {
    const set = new Set<number>(photos.map((p) => p.dayNumber));
    set.add(defaultDay);
    if (journey) checkpointsFor(journey.durationDays).filter((d) => d <= currentDay).forEach((d) => set.add(d));
    return [...set].sort((a, b) => a - b);
  }, [photos, defaultDay, journey, currentDay]);

  const [day, setDay] = useState(defaultDay);
  const [picker, setPicker] = useState<PhotoPose | null>(null);
  const [viewing, setViewing] = useState<ProgressPhoto | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const photoDays = [...new Set(photos.map((p) => p.dayNumber))];

  const photoFor = (pose: PhotoPose) => photos.find((p) => p.dayNumber === day && p.pose === pose);

  return (
    <AppScreen header={<AppHeader title="Progress photos" />}>
      <View style={styles.privacy}>
        <Lock size={14} color={colors.textMuted} />
        <Text variant="caption" color="muted" style={styles.flex}>
          Private by default. Stored in the app, never in your camera roll or on a public link.
        </Text>
      </View>

      <SectionHeader title="Day" />
      <View style={styles.days}>
        {days.map((d) => (
          <FilterChip key={d} label={`Day ${d}`} selected={d === day} onPress={() => setDay(d)} />
        ))}
      </View>

      <View style={styles.grid}>
        {POSES.map((pose) => {
          const photo = photoFor(pose.key);
          return (
            <View key={pose.key} style={styles.slotWrap}>
              <PressableScale
                onPress={() => (photo ? setViewing(photo) : setPicker(pose.key))}
                style={styles.slot}
                accessibilityLabel={photo ? `View ${pose.label} photo, day ${day}` : `Add ${pose.label} photo for day ${day}`}
              >
                {photo ? (
                  <PrivatePhoto photo={photo} style={styles.photo} />
                ) : (
                  <View style={styles.empty}>
                    <Plus size={22} color={colors.textMuted} />
                  </View>
                )}
              </PressableScale>
              <Text variant="caption" color="secondary" align="center">
                {pose.label}
              </Text>
            </View>
          );
        })}
      </View>

      <Button
        label="Compare"
        icon={Images}
        variant="secondary"
        disabled={photoDays.length < 2}
        onPress={() => router.push('/progress/compare')}
        style={styles.compare}
      />
      {photoDays.length < 2 ? (
        <Text variant="caption" color="muted" align="center" style={styles.compareHint}>
          Add photos on two different days to compare, e.g. Day 1 vs Day 30.
        </Text>
      ) : null}

      <BottomSheet visible={!!picker} onClose={() => setPicker(null)} title={`${POSES.find((p) => p.key === picker)?.label ?? ''} · Day ${day}`}>
        <ListRow
          icon={Camera}
          title="Take photo"
          onPress={async () => {
            const pose = picker;
            setPicker(null);
            if (pose) await addProgressPhoto('camera', pose, day);
          }}
        />
        <ListRow
          icon={Images}
          title="Choose from library"
          onPress={async () => {
            const pose = picker;
            setPicker(null);
            if (pose) await addProgressPhoto('library', pose, day);
          }}
        />
      </BottomSheet>

      <BottomSheet visible={!!viewing && !confirmDelete} onClose={() => setViewing(null)} title={viewing ? `${viewing.pose[0]!.toUpperCase()}${viewing.pose.slice(1)} · Day ${viewing.dayNumber}` : undefined}>
        {viewing ? (
          <View style={styles.viewer}>
            <PrivatePhoto photo={viewing} style={styles.viewerPhoto} />
            <View style={styles.viewerActions}>
              <Button
                label="Retake"
                variant="secondary"
                size="md"
                style={styles.flex}
                onPress={() => {
                  const pose = viewing.pose;
                  setViewing(null);
                  setPicker(pose);
                }}
              />
              <Button label="Delete" variant="danger" size="md" icon={Trash2} onPress={() => setConfirmDelete(true)} />
            </View>
          </View>
        ) : null}
      </BottomSheet>
      <ConfirmSheet
        visible={confirmDelete}
        title="Delete this photo?"
        message="It will be removed from this device and your private backup."
        confirmLabel="Delete photo"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (viewing) removeProgressPhoto(viewing.id);
          setConfirmDelete(false);
          setViewing(null);
        }}
      />
    </AppScreen>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  privacy: { flexDirection: 'row', gap: t.spacing.xs, alignItems: 'flex-start', padding: t.spacing.sm, borderRadius: t.radius.md, backgroundColor: t.colors.surfaceSecondary },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs },
  grid: { flexDirection: 'row', gap: t.spacing.sm, marginTop: t.spacing.xl },
  slotWrap: { flex: 1, gap: t.spacing.xs },
  slot: { aspectRatio: 3 / 4, borderRadius: t.radius.lg, overflow: 'hidden', backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border },
  photo: { width: '100%', height: '100%' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  compare: { marginTop: t.spacing['2xl'] },
  compareHint: { marginTop: t.spacing.sm },
  viewer: { gap: t.spacing.md },
  viewerPhoto: { width: '100%', aspectRatio: 3 / 4, borderRadius: t.radius.lg },
  viewerActions: { flexDirection: 'row', gap: t.spacing.xs },
}));
