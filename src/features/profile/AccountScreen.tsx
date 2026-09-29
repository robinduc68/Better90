import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { AppHeader, AppScreen, Button, Card, ConfirmSheet, EmptyState, ErrorState, makeStyles, SegmentedControl, Text, TextField, toast } from '@/design-system';
import { isSupabaseConfigured } from '@/lib/env';
import { authenticate, deleteAccount, flushOutbox, signOut, useSyncStatus, type AuthMode } from '@/services/sync';
import { useAppStore } from '@/store';

const schema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
});
type Values = z.infer<typeof schema>;

function relative(iso: string | null) {
  if (!iso) return 'Not yet';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  return h < 24 ? `${h} h ago` : new Date(iso).toLocaleDateString();
}

export function AccountScreen() {
  const styles = useStyles();
  const account = useAppStore((s) => s.account);
  const pending = useAppStore((s) => s.outbox.length);
  const lastSyncedAt = useAppStore((s) => s.lastSyncedAt);
  const sync = useSyncStatus();
  const [mode, setMode] = useState<AuthMode>('sign_in');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  if (!isSupabaseConfigured) {
    return (
      <AppScreen header={<AppHeader title="Cloud backup" />}>
        <EmptyState
          title="Backup isn't set up in this build"
          message="Everything is saved on this device and works offline. Cloud backup turns on when the app is built with a Level90 server connection."
        />
      </AppScreen>
    );
  }

  const submit = form.handleSubmit(async (v) => {
    setBusy(true);
    setError(null);
    const res = await authenticate(mode, v.email.trim(), v.password);
    setBusy(false);
    if (!res.ok) return setError(res.message ?? 'Something went wrong. Try again.');
    if (res.needsConfirmation) return setError(res.message ?? 'Check your email to confirm.');
    toast.show('Signed in. Your journey is backed up.');
  });

  if (!account) {
    return (
      <AppScreen keyboardAware header={<AppHeader title="Cloud backup" />} footer={<Button label={mode === 'sign_in' ? 'Sign in' : 'Create account'} loading={busy} onPress={submit} />}>
        <Text variant="body" color="secondary" style={styles.intro}>
          Back up your journey and restore it on a new phone. Your data stays on this device too.
        </Text>
        <SegmentedControl
          options={[
            { value: 'sign_in', label: 'Sign in' },
            { value: 'sign_up', label: 'Create account' },
          ]}
          value={mode}
          onChange={setMode}
        />
        <View style={styles.form}>
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <TextField label="Email" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" error={fieldState.error?.message} />
            )}
          />
          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <TextField
                label="Password"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                secureTextEntry
                autoComplete={mode === 'sign_in' ? 'current-password' : 'new-password'}
                textContentType={mode === 'sign_in' ? 'password' : 'newPassword'}
                error={fieldState.error?.message}
                onSubmitEditing={submit}
              />
            )}
          />
          {error ? <ErrorState title="Couldn't sign in" message={error} /> : null}
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen header={<AppHeader title="Cloud backup" />}>
      <Card style={styles.card}>
        <Text variant="label" color="muted">
          Signed in
        </Text>
        <Text variant="bodySemibold">{account.email ?? 'Account'}</Text>
        <View style={styles.statusRow}>
          <Text variant="small" color="secondary" style={styles.flex}>
            Last backup
          </Text>
          <Text variant="smallMedium" tabular>
            {relative(lastSyncedAt)}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text variant="small" color="secondary" style={styles.flex}>
            Waiting to sync
          </Text>
          <Text variant="smallMedium" tabular>
            {pending === 0 ? 'Nothing' : `${pending} ${pending === 1 ? 'change' : 'changes'}`}
          </Text>
        </View>
      </Card>
      {sync.status === 'offline' ? (
        <Text variant="small" color="muted" style={styles.note}>
          You’re offline. Changes are saved on this device and will sync automatically.
        </Text>
      ) : null}
      {sync.status === 'error' && sync.lastError ? (
        <View style={styles.note}>
          <ErrorState title="Backup paused" message={`Your data is safe on this device. We'll retry automatically. (${sync.lastError})`} onRetry={() => void flushOutbox(true)} retryLabel="Retry now" />
        </View>
      ) : null}
      <View style={styles.actions}>
        <Button label="Sync now" variant="secondary" loading={sync.status === 'syncing'} onPress={() => void flushOutbox(true)} />
        <Button
          label="Sign out"
          variant="ghost"
          size="md"
          onPress={async () => {
            await signOut();
            toast.show('Signed out. Your data stays on this device.');
          }}
        />
        <Button label="Delete account" variant="danger" size="md" onPress={() => setConfirmDelete(true)} />
      </View>
      <ConfirmSheet
        visible={confirmDelete}
        title="Delete your account?"
        message="This permanently deletes your cloud account, backed-up data and private photos, and erases this device. It can't be undone."
        confirmLabel="Delete everything"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          setConfirmDelete(false);
          const res = await deleteAccount();
          if (!res.ok) toast.show(res.message ?? "Couldn't delete the account. Try again when online.");
          else router.replace('/onboarding');
        }}
      />
    </AppScreen>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  intro: { marginBottom: t.spacing.lg },
  form: { gap: t.spacing.md, marginTop: t.spacing.lg },
  card: { gap: t.spacing.xs },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: t.spacing.xs },
  note: { marginTop: t.spacing.md },
  actions: { marginTop: t.spacing.xl, gap: t.spacing.xs },
}));
