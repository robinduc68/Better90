import type { RemoteSnapshot } from '@/repositories/remote/mappers';
import type { AppData } from '@/store/types';

type Stamped = { id: string; updatedAt?: string; loggedAt?: string; createdAt?: string; localUri?: string | null };

const stamp = (x: Stamped) => x.updatedAt ?? x.loggedAt ?? x.createdAt ?? '';

/** Union by id; on conflict the most recently updated copy wins. */
export function mergeById<T extends Stamped>(local: T[], remote: T[] | undefined): T[] {
  if (!remote || remote.length === 0) return local;
  const map = new Map<string, T>();
  for (const r of remote) map.set(r.id, r);
  for (const l of local) {
    const r = map.get(l.id);
    if (!r || stamp(l) >= stamp(r)) map.set(l.id, l);
    // Device-only fields (a photo's private file) survive a newer remote copy.
    else if (l.localUri) map.set(l.id, { ...r, localUri: l.localUri });
  }
  return [...map.values()];
}

function newer<T extends { updatedAt: string }>(local: T | null, remote: T | null | undefined): T | null {
  if (!remote) return local;
  if (!local) return remote;
  return local.updatedAt >= remote.updatedAt ? local : remote;
}

/** Combines device data with a remote snapshot after sign-in. Nothing local is discarded. */
export function mergeSnapshot(local: AppData, remote: RemoteSnapshot): Partial<AppData> {
  return {
    profile: newer(local.profile, remote.profile),
    journey: newer(local.journey, remote.journey),
    habits: mergeById(local.habits, remote.habits),
    habitLogs: mergeById(local.habitLogs, remote.habitLogs),
    proteinLogs: mergeById(local.proteinLogs, remote.proteinLogs),
    waterLogs: mergeById(local.waterLogs, remote.waterLogs),
    dailyLogs: mergeById(local.dailyLogs, remote.dailyLogs),
    activityLogs: mergeById(local.activityLogs, remote.activityLogs),
    templates: mergeById(local.templates, remote.templates),
    sessions: mergeById(local.sessions, remote.sessions),
    measurements: mergeById(local.measurements, remote.measurements),
    photos: mergeById(local.photos, remote.photos),
    notificationPrefs: newer(local.notificationPrefs, remote.notificationPrefs) ?? local.notificationPrefs,
  };
}
