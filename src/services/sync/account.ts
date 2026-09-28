import { getRemote } from '@/repositories';
import { getSupabase } from '@/services/supabase/client';
import { deleteAllLocalPhotos } from '@/services/photos';
import { cancelAllPlanned } from '@/services/notifications';
import { useActiveWorkoutStore, useAppStore } from '@/store';

import { mergeSnapshot } from './merge';
import { flushOutbox } from './syncEngine';
import { useSyncStatus } from './syncStatus';

export type AuthMode = 'sign_in' | 'sign_up';

export interface AuthResult {
  ok: boolean;
  message?: string;
  needsConfirmation?: boolean;
}

/**
 * Signs in (or up), restores any backed-up data, merges it with what is on
 * this device, then uploads everything local. Nothing on the device is lost.
 */
export async function authenticate(mode: AuthMode, email: string, password: string): Promise<AuthResult> {
  const db = getSupabase();
  const remote = getRemote();
  if (!db || !remote) return { ok: false, message: 'Cloud backup is not configured in this build.' };

  const res =
    mode === 'sign_in'
      ? await db.auth.signInWithPassword({ email, password })
      : await db.auth.signUp({ email, password });
  if (res.error) return { ok: false, message: res.error.message };
  const user = res.data.user;
  if (!user) return { ok: false, message: 'Could not sign in. Try again.' };
  if (!res.data.session) return { ok: true, needsConfirmation: true, message: 'Check your email to confirm your account, then sign in.' };

  await attachAccount(user.id, user.email ?? email);
  return { ok: true };
}

export async function attachAccount(userId: string, email: string | null) {
  const store = useAppStore.getState();
  store.setAccount({ userId, email });
  const remote = getRemote();
  if (!remote) return;
  try {
    const snapshot = await remote.pullAll(userId);
    const state = useAppStore.getState();
    useAppStore.setState(mergeSnapshot(state, snapshot));
  } catch (e) {
    useSyncStatus.getState().set({ status: 'error', lastError: e instanceof Error ? e.message : 'Restore failed' });
  }
  useAppStore.getState().enqueueAll();
  await flushOutbox(true);
}

/** Restores the account attached to a persisted Supabase session on launch. */
export async function restoreSession() {
  const db = getSupabase();
  if (!db) return;
  const { data } = await db.auth.getSession();
  const user = data.session?.user;
  const account = useAppStore.getState().account;
  if (user && !account) await attachAccount(user.id, user.email ?? null);
  if (!user && account) useAppStore.getState().setAccount(null);
}

/** Signs out. Local data stays on the device. */
export async function signOut() {
  await getSupabase()?.auth.signOut();
  useAppStore.getState().setAccount(null);
  useSyncStatus.getState().set({ status: 'local', lastError: null });
}

/** Erases everything on this device: data, private photos, scheduled reminders. */
export async function eraseLocalData() {
  await cancelAllPlanned();
  deleteAllLocalPhotos();
  useActiveWorkoutStore.getState().discard();
  useAppStore.getState().resetAll();
}

/** Permanently deletes the cloud account and all backed-up data, then erases the device. */
export async function deleteAccount(): Promise<AuthResult> {
  const remote = getRemote();
  if (!remote || !useAppStore.getState().account) return { ok: false, message: 'No cloud account is connected.' };
  try {
    await remote.deleteAccount();
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Could not delete the account. Try again when online.' };
  }
  await getSupabase()?.auth.signOut().catch(() => undefined);
  await eraseLocalData();
  return { ok: true };
}
