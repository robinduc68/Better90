import { router } from 'expo-router';
import {
  Bell,
  CalendarDays,
  Cloud,
  Droplet,
  Dumbbell,
  FlaskConical,
  Info,
  ListChecks,
  Moon,
  Ruler,
  Shield,
  Target,
  Timer,
  Vibrate,
} from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import {
  AppScreen,
  Divider,
  ListGroup,
  ListRow,
  makeStyles,
  SectionHeader,
  SegmentedControl,
  Switch,
  Text,
  toast,
  type ThemePreference,
} from '@/design-system';
import { formatDayDate, formatDuration, formatLiters, journeyProgress } from '@/domain';
import { loadDemoData } from '@/data/seed/loadDemo';
import { useTodayDate } from '@/hooks';
import { demoToolsEnabled, isSupabaseConfigured } from '@/lib/env';
import { useSyncStatus } from '@/services/sync';
import { useAppStore } from '@/store';

import { TargetSheet, type TargetConfig } from './TargetSheet';

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

export function ProfileScreen() {
  const styles = useStyles();
  const today = useTodayDate();
  const profile = useAppStore((s) => s.profile);
  const journey = useAppStore((s) => s.journey);
  const settings = useAppStore((s) => s.settings);
  const account = useAppStore((s) => s.account);
  const habits = useAppStore((s) => s.habits.filter((h) => !h.archivedAt).length);
  const updateJourney = useAppStore((s) => s.updateJourney);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const syncStatus = useSyncStatus((s) => s.status);
  const [target, setTarget] = useState<TargetConfig | null>(null);

  if (!journey || !profile) return null;
  const progress = journeyProgress(journey, today);

  const accountValue = !isSupabaseConfigured ? 'On this device' : account ? (syncStatus === 'error' ? 'Sync paused' : 'Backed up') : 'Not signed in';

  return (
    <AppScreen>
      <View style={styles.header}>
        <Text variant="h1" accessibilityRole="header">
          {profile.name}
        </Text>
        <Text variant="small" color="muted" tabular>
          Day {progress.dayNumber} of {journey.durationDays} · started {formatDayDate(journey.startDate)}
        </Text>
      </View>

      <SectionHeader title="Account" />
      <ListGroup>
        <ListRow icon={Cloud} title="Cloud backup" value={accountValue} onPress={() => router.push('/profile/account')} />
      </ListGroup>

      <SectionHeader title="Journey" />
      <ListGroup>
        <ListRow icon={CalendarDays} title="Journey" value={`Day ${progress.dayNumber} / ${journey.durationDays}`} onPress={() => router.push('/(tabs)/journey')} />
        <Divider inset={60} />
        <ListRow
          icon={Dumbbell}
          title="Gym days per week"
          value={String(journey.gymDaysPerWeek)}
          onPress={() => setTarget({ title: 'Gym days per week', value: journey.gymDaysPerWeek, step: 1, min: 0, max: 7, onSave: (v) => updateJourney({ gymDaysPerWeek: v }) })}
        />
      </ListGroup>

      <SectionHeader title="Targets" />
      <ListGroup>
        <ListRow
          icon={Target}
          title="Protein target"
          value={`${journey.proteinTargetG} g`}
          onPress={() => setTarget({ title: 'Protein target', value: journey.proteinTargetG, step: 5, min: 40, max: 300, unit: 'g', onSave: (v) => updateJourney({ proteinTargetG: v }) })}
        />
        <Divider inset={60} />
        <ListRow
          icon={Droplet}
          title="Water target"
          value={`${formatLiters(journey.waterTargetMl)} L`}
          onPress={() =>
            setTarget({ title: 'Water target', value: journey.waterTargetMl, step: 250, min: 1000, max: 5000, unit: 'L', format: formatLiters, onSave: (v) => updateJourney({ waterTargetMl: v }) })
          }
        />
        <Divider inset={60} />
        <ListRow
          icon={Moon}
          title="Sleep target"
          value={formatDuration(journey.sleepTargetMin)}
          onPress={() =>
            setTarget({ title: 'Sleep target', value: journey.sleepTargetMin, step: 15, min: 300, max: 600, format: formatDuration, onSave: (v) => updateJourney({ sleepTargetMin: v }) })
          }
        />
        <Divider inset={60} />
        <ListRow icon={ListChecks} title="Habits & routines" value={String(habits)} onPress={() => router.push('/profile/habits')} />
      </ListGroup>

      <SectionHeader title="Notifications" />
      <ListGroup>
        <ListRow icon={Bell} title="Reminders" subtitle="Water, workout, evening check-in, journey" onPress={() => router.push('/profile/notifications')} />
      </ListGroup>

      <SectionHeader title="Workout" />
      <ListGroup>
        <ListRow
          icon={Timer}
          title="Default rest"
          value={settings.restTimerEnabled ? `${settings.restTimerSeconds}s` : 'Off'}
          trailing={<Switch value={settings.restTimerEnabled} onValueChange={(v) => updateSettings({ restTimerEnabled: v })} accessibilityLabel="Rest timer" />}
        />
        <Divider inset={60} />
        <ListRow
          icon={Vibrate}
          title="Haptics"
          trailing={<Switch value={settings.hapticsEnabled} onValueChange={(v) => updateSettings({ hapticsEnabled: v })} accessibilityLabel="Haptics" />}
        />
        <Divider inset={60} />
        <ListRow icon={Ruler} title="Units" value="Metric" subtitle="Imperial units are coming later." disabled />
      </ListGroup>

      <SectionHeader title="Appearance" />
      <SegmentedControl options={THEMES} value={settings.theme} onChange={(v) => updateSettings({ theme: v })} accessibilityLabel="Appearance" />

      <SectionHeader title="Privacy & data" />
      <ListGroup>
        <ListRow icon={Shield} title="Privacy & data" subtitle="Where your data lives, erase or delete" onPress={() => router.push('/profile/data')} />
      </ListGroup>

      {demoToolsEnabled ? (
        <>
          <SectionHeader title="Developer" />
          <ListGroup>
            <ListRow
              icon={FlaskConical}
              title="Load demo journey"
              subtitle="Replaces local data with the Day 23 demo"
              onPress={() => {
                loadDemoData();
                toast.show('Demo data loaded');
              }}
            />
          </ListGroup>
        </>
      ) : null}

      <SectionHeader title="About" />
      <ListGroup>
        <ListRow icon={Info} title="Level90" value="1.0.0" />
      </ListGroup>
      <Text variant="caption" color="muted" style={styles.disclaimer}>
        Level90 is a personal tracking tool. Suggestions are simple rules, not medical, nutrition or coaching advice.
      </Text>

      <TargetSheet config={target} onClose={() => setTarget(null)} />
    </AppScreen>
  );
}

const useStyles = makeStyles((t) => ({
  header: { paddingTop: t.spacing.md, gap: t.spacing.xxs },
  disclaimer: { marginTop: t.spacing.md },
}));
