import { Download, Share2 } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { AppHeader, AppScreen, Button, makeStyles, SectionHeader, Switch, Text, toast } from '@/design-system';
import { taskList } from '@/features/today/taskDetail';
import { useDayModel } from '@/features/today/useDayModel';
import { useTodayDate } from '@/hooks';
import { analytics } from '@/services/analytics';
import { captureShareCard, saveToPhotos, shareImage, shareSupported } from '@/services/share';
import { useAppStore } from '@/store';

import { DailyShareCard, type DailyShareOptions } from './DailyShareCard';

/** Preview first; nothing leaves the device until Save or Share is tapped. */
export function ShareTodayScreen() {
  const styles = useStyles();
  const { width: screenWidth } = useWindowDimensions();
  const today = useTodayDate();
  const model = useDayModel(today, today);
  const journey = useAppStore((s) => s.journey);
  const [options, setOptions] = useState<DailyShareOptions>({ showRemaining: true, showAmounts: true });
  const [busy, setBusy] = useState<'save' | 'share' | null>(null);
  const ref = useRef<View>(null);
  if (!model || !journey) return null;

  const tasks = taskList(model, journey);
  const previewWidth = Math.min(screenWidth - 96, 300);

  const run = async (kind: 'save' | 'share') => {
    setBusy(kind);
    try {
      const uri = await captureShareCard(ref);
      analytics.track('share_card_created', { action: kind, kind: 'daily', show_remaining: options.showRemaining, show_amounts: options.showAmounts });
      if (kind === 'save') {
        const res = await saveToPhotos(uri);
        toast.show(res === 'saved' ? 'Saved to Photos' : res === 'denied' ? 'Photo library access is off. Enable it in Settings.' : 'Saving is available in the app.');
      } else if (!(await shareImage(uri))) toast.show('Sharing is not available on this device.');
    } catch {
      toast.show("Couldn't create the image. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const toggle = (key: keyof DailyShareOptions, label: string, hint: string) => (
    <View style={styles.option}>
      <View style={styles.flex}>
        <Text variant="bodyMedium">{label}</Text>
        <Text variant="caption" color="muted">
          {hint}
        </Text>
      </View>
      <Switch value={options[key]} onValueChange={(v) => setOptions((o) => ({ ...o, [key]: v }))} accessibilityLabel={label} />
    </View>
  );

  return (
    <AppScreen
      header={<AppHeader title="Share today" subtitle="Preview · 9:16" leading="close" />}
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
        <View style={styles.frame}>
          <DailyShareCard ref={ref} dayNumber={model.progress.dayNumber} totalDays={model.progress.totalDays} score={model.score.score} tasks={tasks} options={options} width={previewWidth} />
        </View>
      </View>
      <SectionHeader title="Show on card" />
      <View style={styles.options}>
        {toggle('showRemaining', 'Remaining tasks', 'Show what’s still open today')}
        {toggle('showAmounts', 'Amounts', 'e.g. 108 / 130g, 45 / 60 min')}
      </View>
    </AppScreen>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  preview: { alignItems: 'center', paddingVertical: t.spacing.md },
  frame: { borderRadius: t.radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: t.colors.borderStrong },
  options: { backgroundColor: t.colors.surface, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.border, paddingHorizontal: t.spacing.md },
  option: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minHeight: 60 },
  actions: { flexDirection: 'row', gap: t.spacing.xs },
}));
