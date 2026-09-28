import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Linking, Platform, View } from 'react-native';

import { AppHeader, AppScreen, Button, Card, makeStyles, SectionHeader, Stepper, Switch, Text } from '@/design-system';
import { formatClock, waterTimes } from '@/domain';
import { rescheduleReminders } from '@/features/notifications/useReminderScheduler';
import { getPermission, requestPermission } from '@/services/notifications';
import { useAppStore } from '@/store';

export function NotificationsScreen() {
  const styles = useStyles();
  const prefs = useAppStore((s) => s.notificationPrefs);
  const update = useAppStore((s) => s.updateNotificationPrefs);
  const qc = useQueryClient();
  const permission = useQuery({ queryKey: ['notification-permission'], queryFn: getPermission });

  const set = (patch: Parameters<typeof update>[0]) => {
    update(patch);
    rescheduleReminders(300);
  };

  const times = waterTimes(prefs.water.start, prefs.water.end, prefs.water.perDay);

  return (
    <AppScreen header={<AppHeader title="Reminders" />}>
      {permission.data === 'denied' || permission.data === 'undetermined' ? (
        <Card variant="flat" style={styles.permission}>
          <Text variant="bodyMedium">Notifications are off for Level90</Text>
          <Text variant="small" color="secondary">
            Your choices below are saved, but nothing will be delivered until notifications are allowed.
          </Text>
          <Button
            label={permission.data === 'denied' ? 'Open settings' : 'Allow notifications'}
            size="md"
            variant="secondary"
            onPress={async () => {
              if (permission.data === 'denied') await Linking.openSettings();
              else await requestPermission();
              await qc.invalidateQueries({ queryKey: ['notification-permission'] });
              rescheduleReminders(300);
            }}
          />
        </Card>
      ) : null}
      {permission.data === 'unsupported' ? (
        <Text variant="small" color="muted">
          Reminders are available in the iOS and Android apps.
        </Text>
      ) : null}

      <SectionHeader title="Water" />
      <Card style={styles.card}>
        <Row title="Water reminders" subtitle="Skipped once today's target is reached." value={prefs.water.enabled} onChange={(v) => set({ water: { ...prefs.water, enabled: v } })} />
        {prefs.water.enabled ? (
          <View style={styles.controls}>
            <Label text="Reminders per day" />
            <Stepper label="Reminders per day" value={prefs.water.perDay} onChange={(v) => set({ water: { ...prefs.water, perDay: v } })} step={1} min={1} max={8} />
            <Label text="From" />
            <Stepper
              label="Start time"
              value={prefs.water.start}
              onChange={(v) => set({ water: { ...prefs.water, start: v } })}
              step={30}
              min={5 * 60}
              max={prefs.water.end - 60}
              format={formatClock}
            />
            <Label text="Until" />
            <Stepper
              label="End time"
              value={prefs.water.end}
              onChange={(v) => set({ water: { ...prefs.water, end: v } })}
              step={30}
              min={prefs.water.start + 60}
              max={23 * 60}
              format={formatClock}
            />
            <Text variant="caption" color="muted" tabular>
              At {times.map(formatClock).join(', ')}
            </Text>
          </View>
        ) : null}
      </Card>

      <SectionHeader title="Workout" />
      <Card style={styles.card}>
        <Row title="Planned workout" subtitle="Only on days a workout is scheduled." value={prefs.workout.enabled} onChange={(v) => set({ workout: { ...prefs.workout, enabled: v } })} />
        {prefs.workout.enabled ? (
          <Stepper label="Workout reminder time" value={prefs.workout.time} onChange={(v) => set({ workout: { ...prefs.workout, time: v } })} step={30} min={5 * 60} max={22 * 60} format={formatClock} />
        ) : null}
        <Row title="Rest timer alerts" subtitle="When rest ends while the app is in the background." value={prefs.rest.enabled} onChange={(v) => set({ rest: { enabled: v } })} />
      </Card>

      <SectionHeader title="Habits" />
      <Card style={styles.card}>
        <Row title="Evening check-in" subtitle="Only if something is still open, e.g. night routine." value={prefs.habit.enabled} onChange={(v) => set({ habit: { ...prefs.habit, enabled: v } })} />
        {prefs.habit.enabled ? (
          <Stepper label="Evening check-in time" value={prefs.habit.time} onChange={(v) => set({ habit: { ...prefs.habit, time: v } })} step={30} min={17 * 60} max={23 * 60 + 30} format={formatClock} />
        ) : null}
      </Card>

      <SectionHeader title="Journey" />
      <Card style={styles.card}>
        <Row title="Daily start" subtitle={'"Day 24 is ready."'} value={prefs.journey.enabled} onChange={(v) => set({ journey: { ...prefs.journey, enabled: v } })} />
        {prefs.journey.enabled ? (
          <Stepper label="Journey reminder time" value={prefs.journey.time} onChange={(v) => set({ journey: { ...prefs.journey, time: v } })} step={30} min={5 * 60} max={12 * 60} format={formatClock} />
        ) : null}
      </Card>
      <Text variant="caption" color="muted" style={styles.footnote}>
        Level90 never sends streak warnings or guilt reminders.{Platform.OS === 'web' ? '' : ' Reminders are scheduled on this device.'}
      </Text>
    </AppScreen>
  );
}

function Row({ title, subtitle, value, onChange }: { title: string; subtitle: string; value: boolean; onChange: (v: boolean) => void }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <View style={styles.flex}>
        <Text variant="bodyMedium">{title}</Text>
        <Text variant="caption" color="muted">
          {subtitle}
        </Text>
      </View>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={title} />
    </View>
  );
}

function Label({ text }: { text: string }) {
  return (
    <Text variant="label" color="muted">
      {text}
    </Text>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  permission: { gap: t.spacing.xs, marginTop: t.spacing.sm },
  card: { gap: t.spacing.md },
  controls: { gap: t.spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  footnote: { marginTop: t.spacing.lg },
}));
