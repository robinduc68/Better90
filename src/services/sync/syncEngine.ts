import NetInfo from '@react-native-community/netinfo';

import { getRemote } from '@/repositories';
import { readPhotoBytes } from '@/services/photos';
import { useAppStore, type AppState } from '@/store';
import type { OutboxItem, SyncEntity } from '@/store/types';

import { useSyncStatus } from './syncStatus';

/** Parents before children so foreign keys resolve. Deletes run in reverse. */
const ORDER: SyncEntity[] = [
  'profiles',
  'journeys',
  'user_habits',
  'habit_logs',
  'protein_logs',
  'meals',
  'water_logs',
  'daily_logs',
  'activity_logs',
  'workout_templates',
  'workout_sessions',
  'body_measurements',
  'progress_photos',
  'notification_preferences',
];

function resolve(state: AppState, entity: SyncEntity, id: string): object | null {
  switch (entity) {
    case 'profiles':
      return state.profile;
    case 'journeys':
      return state.journey?.id === id ? state.journey : null;
    case 'notification_preferences':
      return state.notificationPrefs;
    case 'user_habits':
      return state.habits.find((x) => x.id === id) ?? null;
    case 'habit_logs':
      return state.habitLogs.find((x) => x.id === id) ?? null;
    case 'protein_logs':
      return state.proteinLogs.find((x) => x.id === id) ?? null;
    case 'meals':
      return state.meals.find((x) => x.id === id) ?? null;
    case 'water_logs':
      return state.waterLogs.find((x) => x.id === id) ?? null;
    case 'daily_logs':
      return state.dailyLogs.find((x) => x.id === id) ?? null;
    case 'activity_logs':
      return state.activityLogs.find((x) => x.id === id) ?? null;
    case 'workout_templates':
      return state.templates.find((x) => x.id === id) ?? null;
    case 'workout_sessions':
      return state.sessions.find((x) => x.id === id) ?? null;
    case 'body_measurements':
      return state.measurements.find((x) => x.id === id) ?? null;
    case 'progress_photos':
      return state.photos.find((x) => x.id === id) ?? null;
  }
}

export const photoStoragePath = (userId: string, photoId: string) => `${userId}/${photoId}.jpg`;
export const mealPhotoStoragePath = photoStoragePath;

let running: Promise<void> | null = null;
let retryAt = 0;

function backoffMs(attempts: number) {
  return Math.min(5 * 60_000, 5_000 * 2 ** Math.min(attempts, 6));
}

/**
 * Pushes queued local changes to the backend. Safe to call often:
 * runs one flush at a time, skips when offline, backs off after errors.
 * Local data is never removed because a request failed.
 */
export function flushOutbox(force = false): Promise<void> {
  if (running) return running;
  running = doFlush(force).finally(() => {
    running = null;
  });
  return running;
}

async function doFlush(force: boolean) {
  const status = useSyncStatus.getState();
  const remote = getRemote();
  const initial = useAppStore.getState();
  if (!remote || !initial.account) {
    status.set({ status: 'local' });
    return;
  }
  if (!force && Date.now() < retryAt) return;

  const net = await NetInfo.fetch();
  if (net.isConnected === false) {
    status.set({ status: 'offline', online: false });
    return;
  }
  if (initial.outbox.length === 0) {
    status.set({ status: 'idle', lastError: null });
    return;
  }

  status.set({ status: 'syncing' });
  const userId = initial.account.userId;

  try {
    // 1) Upload photo binaries before their rows reference them.
    for (const item of initial.outbox.filter((o) => o.entity === 'progress_photos' && o.op === 'upsert')) {
      const photo = useAppStore.getState().photos.find((p) => p.id === item.id);
      if (photo && !photo.storagePath && photo.localUri) {
        const path = photoStoragePath(userId, photo.id);
        await remote.uploadPhoto(path, await readPhotoBytes(photo.localUri), 'image/jpeg');
        useAppStore.setState((s) => ({ photos: s.photos.map((p) => (p.id === photo.id ? { ...p, storagePath: path } : p)) }));
      }
    }

    for (const item of initial.outbox.filter((o) => o.entity === 'meals' && o.op === 'upsert')) {
      const meal = useAppStore.getState().meals.find((m) => m.id === item.id);
      if (meal && !meal.photoStoragePath && meal.photoUri) {
        const path = mealPhotoStoragePath(userId, meal.id);
        await remote.uploadPhoto(path, await readPhotoBytes(meal.photoUri), 'image/jpeg', 'meal-photos');
        useAppStore.setState((s) => ({ meals: s.meals.map((m) => (m.id === meal.id ? { ...m, photoStoragePath: path } : m)) }));
      }
    }

    const outbox = useAppStore.getState().outbox;
    const byEntity = (op: OutboxItem['op']) => {
      const groups = new Map<SyncEntity, OutboxItem[]>();
      for (const o of outbox) if (o.op === op) groups.set(o.entity, [...(groups.get(o.entity) ?? []), o]);
      return groups;
    };

    // 2) Deletes, children first.
    const deletes = byEntity('delete');
    for (const entity of [...ORDER].reverse()) {
      const items = deletes.get(entity);
      if (!items) continue;
      await runGroup(items, async () => {
        await remote.remove(entity, items.map((i) => i.id), userId);
        if (entity === 'progress_photos') await remote.removePhotos(items.map((i) => photoStoragePath(userId, i.id)));
        if (entity === 'meals') await remote.removePhotos(items.map((i) => mealPhotoStoragePath(userId, i.id)), 'meal-photos');
      });
    }

    // 3) Upserts, parents first. Records are read at flush time so the latest version is sent.
    const upserts = byEntity('upsert');
    for (const entity of ORDER) {
      const items = upserts.get(entity);
      if (!items) continue;
      const state = useAppStore.getState();
      const records = items.map((i) => resolve(state, entity, i.id)).filter((r): r is object => r !== null);
      await runGroup(items, () => remote.upsert(entity, records, userId));
    }

    retryAt = 0;
    const left = useAppStore.getState().outbox.length;
    status.set({ status: left > 0 ? 'syncing' : 'idle', lastError: null, online: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Sync failed';
    const maxAttempts = Math.max(0, ...useAppStore.getState().outbox.map((o) => o.attempts));
    retryAt = Date.now() + backoffMs(maxAttempts);
    status.set({ status: 'error', lastError: message });
  }
}

async function runGroup(items: OutboxItem[], fn: () => Promise<void>) {
  // Only acknowledge the exact versions we sent; newer edits re-queue with a new queuedAt.
  const sent = new Map(items.map((i) => [i.key, i.queuedAt]));
  try {
    await fn();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Request failed';
    items.forEach((i) => useAppStore.getState().markFailed(i.key, msg));
    throw e;
  }
  const current = useAppStore.getState().outbox;
  const done = current.filter((o) => sent.get(o.key) === o.queuedAt).map((o) => o.key);
  useAppStore.getState().markSynced(done, new Date().toISOString());
}
