import { Download, Share2 } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { AppHeader, AppScreen, Button, makeStyles, SectionHeader, Switch, Text, toast } from '@/design-system';
import { useTodayDate } from '@/hooks';
import { analytics } from '@/services/analytics';
import { captureShareCard, saveToPhotos, shareImage, shareSupported } from '@/services/share';

import { DEFAULT_SHARE_OPTIONS, ShareCard, type ShareOptions } from './ShareCard';
import { useShareStats } from './useShareStats';

type Option = { key: keyof ShareOptions; label: string; hint?: string; available: boolean; private?: boolean };

export function ShareScreen() {
  const styles = useStyles();
  const { width: screenWidth } = useWindowDimensions();
  const today = useTodayDate();
  const stats = useShareStats(today);
  const [options, setOptions] = useState<ShareOptions>(DEFAULT_SHARE_OPTIONS);
  const [busy, setBusy] = useState<'save' | 'share' | null>(null);
  const cardRef = useRef<View>(null);
  if (!stats) return null;

  const previewWidth = Math.min(screenWidth - 96, 300);
  const list: Option[] = [
    { key: 'journeyDay', label: 'Journey day', available: true },
    { key: 'consistency', label: 'Consistency', available: true },
    { key: 'workouts', label: 'Workout count', available: true },
    { key: 'strength', label: 'Strength PR', hint: stats.bestLift ? `${stats.bestLift.name} +${stats.bestLift.deltaKg} kg` : 'Needs two sessions of a lift', available: !!stats.bestLift },
    { key: 'weight', label: 'Weight change', hint: 'Private — off by default', available: stats.weightDeltaKg !== null, private: true },
    { key: 'waist', label: 'Waist change', hint: 'Private — off by default', available: stats.waistDeltaCm !== null, private: true },
    { key: 'photo', label: 'Progress photo', hint: stats.latestPhoto ? `Front, day ${stats.latestPhoto.dayNumber}` : 'Add a front photo first', available: !!stats.latestPhoto, private: true },
  ];

  const run = async (kind: 'save' | 'share') => {
    setBusy(kind);
    try {
      const uri = await captureShareCard(cardRef);
      analytics.track('share_card_created', {
        action: kind,
        journey_day: options.journeyDay,
        consistency: options.consistency,
        workouts: options.workouts,
        strength: options.strength && !!stats.bestLift,
        body_metrics: options.weight || options.waist,
        photo: options.photo && !!stats.latestPhoto,
      });
      if (kind === 'save') {
        const res = await saveToPhotos(uri);
        toast.show(res === 'saved' ? 'Saved to Photos' : res === 'denied' ? 'Photo library access is off. Enable it in Settings.' : 'Saving is available in the app.');
      } else {
        const ok = await shareImage(uri);
        if (!ok) toast.show('Sharing is not available on this device.');
      }
    } catch {
      toast.show("Couldn't create the image. Try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <AppScreen
      header={<AppHeader title="Share card" subtitle="9:16 · Stories" leading="close" />}
      footer={
        shareSupported ? (
          <View style={styles.actions}>
            <Button label="Save" icon={Download} variant="secondary" loading={busy === 'save'} disabled={!!busy} onPress={() => void run('save')} style={styles.flex} />
            <Button label="Share" icon={Share2} loading={busy === 'share'} disabled={!!busy} onPress={() => void run('share')} style={styles.flex} />
          </View>
        ) : (
          <Text variant="small" color="muted" align="center">
            Saving and sharing images is available in the iOS and Android app.
          </Text>
        )
      }
    >
      <View style={styles.preview}>
        <View style={styles.previewShadow}>
          <ShareCard ref={cardRef} stats={stats} options={options} width={previewWidth} />
        </View>
      </View>

      <SectionHeader title="Show on card" />
      <Text variant="caption" color="muted" style={styles.note}>
        You choose what appears. Nothing private is included unless you turn it on.
      </Text>
      <View style={styles.options}>
        {list.map((o) => (
          <View key={o.key} style={styles.option}>
            <View style={styles.flex}>
              <Text variant="bodyMedium" color={o.available ? 'primary' : 'disabled'}>
                {o.label}
              </Text>
              {o.hint ? (
                <Text variant="caption" color={o.private && o.available ? 'warning' : 'muted'}>
                  {o.hint}
                </Text>
              ) : null}
            </View>
            <Switch
              value={o.available && options[o.key]}
              disabled={!o.available}
              onValueChange={(v) => setOptions((s) => ({ ...s, [o.key]: v }))}
              accessibilityLabel={`Show ${o.label}`}
            />
          </View>
        ))}
      </View>
    </AppScreen>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  preview: { alignItems: 'center', paddingVertical: t.spacing.md },
  previewShadow: { borderRadius: t.radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: t.colors.borderStrong },
  note: { marginTop: -t.spacing.xs, marginBottom: t.spacing.sm },
  options: { backgroundColor: t.colors.surface, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.border, paddingHorizontal: t.spacing.md },
  option: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minHeight: 60, borderBottomWidth: 1, borderBottomColor: t.colors.border },
  actions: { flexDirection: 'row', gap: t.spacing.xs },
}));
