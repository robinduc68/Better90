import { router } from 'expo-router';
import { Cloud, HardDrive, Image, Lock } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { AppHeader, AppScreen, Button, Card, ConfirmSheet, makeStyles, SectionHeader, Text, useTheme } from '@/design-system';
import { isSupabaseConfigured } from '@/lib/env';
import { eraseLocalData } from '@/services/sync';
import { useAppStore } from '@/store';

export function DataScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const account = useAppStore((s) => s.account);
  const [confirm, setConfirm] = useState(false);

  const points = [
    { icon: HardDrive, title: 'On this device first', body: 'Everything you log is saved locally and works offline.' },
    { icon: Image, title: 'Photos are private', body: 'Stored in the app sandbox — not your camera roll. Backups go to a private bucket only you can read, viewed through short-lived links.' },
    {
      icon: Cloud,
      title: 'Backup is optional',
      body: isSupabaseConfigured ? 'Sign in to back up. Data is protected so only your account can access it.' : 'This build is local-only.',
    },
    { icon: Lock, title: 'Minimal analytics', body: 'Only anonymous usage events like "workout completed". Never body metrics, photos or names.' },
  ];

  return (
    <AppScreen header={<AppHeader title="Privacy & data" />}>
      <View style={styles.points}>
        {points.map((p) => (
          <View key={p.title} style={styles.point}>
            <View style={styles.icon}>
              <p.icon size={18} color={colors.textSecondary} />
            </View>
            <View style={styles.flex}>
              <Text variant="bodyMedium">{p.title}</Text>
              <Text variant="small" color="secondary">
                {p.body}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <SectionHeader title="Manage" />
      <Card style={styles.card}>
        <Text variant="bodyMedium">Erase this device</Text>
        <Text variant="small" color="secondary">
          Removes your journey, logs and photos from this phone.{account ? ' Your cloud backup is not affected.' : ''}
        </Text>
        <Button label="Erase device data" variant="danger" size="md" onPress={() => setConfirm(true)} style={styles.button} />
      </Card>
      {account ? (
        <Card style={styles.card}>
          <Text variant="bodyMedium">Delete account</Text>
          <Text variant="small" color="secondary">
            Permanently delete your cloud account and all backed-up data.
          </Text>
          <Button label="Go to account" variant="secondary" size="md" onPress={() => router.push('/profile/account')} style={styles.button} />
        </Card>
      ) : null}

      <ConfirmSheet
        visible={confirm}
        title="Erase all data on this device?"
        message="Your journey, workouts, measurements and photos will be removed from this phone. This can't be undone."
        confirmLabel="Erase"
        destructive
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          setConfirm(false);
          await eraseLocalData();
          router.replace('/onboarding');
        }}
      />
    </AppScreen>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  points: { gap: t.spacing.lg, marginTop: t.spacing.sm },
  point: { flexDirection: 'row', gap: t.spacing.md },
  icon: { width: 36, height: 36, borderRadius: t.radius.md, backgroundColor: t.colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  card: { gap: t.spacing.xs, marginBottom: t.spacing.sm },
  button: { alignSelf: 'flex-start', marginTop: t.spacing.xs },
}));
