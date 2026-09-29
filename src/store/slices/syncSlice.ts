import { nowISO } from '@/lib/now';

import type { Account, OutboxItem, SyncEntity } from '../types';
import type { GetState, SetState } from './common';

export interface SyncActions {
  /** Queues a record for remote sync. No-op while signed out (local-only mode). */
  enqueue: (entity: SyncEntity, id: string, op?: 'upsert' | 'delete') => void;
  /** Queues every local record — used right after sign-in. */
  enqueueAll: () => void;
  markSynced: (keys: string[], at: string) => void;
  markFailed: (key: string, error: string) => void;
  setAccount: (account: Account | null) => void;
}

export function createSyncActions(set: SetState, get: GetState): SyncActions {
  const put = (outbox: OutboxItem[], entity: SyncEntity, id: string, op: 'upsert' | 'delete'): OutboxItem[] => {
    const key = `${entity}:${id}`;
    const rest = outbox.filter((o) => o.key !== key);
    return [...rest, { key, entity, id, op, queuedAt: nowISO(), attempts: 0, lastError: null }];
  };

  return {
    enqueue: (entity, id, op = 'upsert') => {
      if (!get().account) return;
      set((s) => ({ outbox: put(s.outbox, entity, id, op) }));
    },
    enqueueAll: () => {
      const s = get();
      if (!s.account) return;
      let outbox = s.outbox;
      const add = (entity: SyncEntity, ids: string[]) => {
        for (const id of ids) outbox = put(outbox, entity, id, 'upsert');
      };
      if (s.profile) add('profiles', [s.profile.id]);
      if (s.journey) add('journeys', [s.journey.id]);
      add('user_habits', s.habits.map((h) => h.id));
      add('habit_logs', s.habitLogs.map((l) => l.id));
      add('protein_logs', s.proteinLogs.map((l) => l.id));
      add('meals', s.meals.map((m) => m.id));
      add('water_logs', s.waterLogs.map((l) => l.id));
      add('daily_logs', s.dailyLogs.map((l) => l.id));
      add('activity_logs', s.activityLogs.map((l) => l.id));
      add('workout_templates', s.templates.map((t) => t.id));
      add('workout_sessions', s.sessions.map((x) => x.id));
      add('body_measurements', s.measurements.map((m) => m.id));
      add('progress_photos', s.photos.map((p) => p.id));
      add('notification_preferences', ['self']);
      set({ outbox });
    },
    markSynced: (keys, at) =>
      set((s) => {
        const done = new Set(keys);
        return { outbox: s.outbox.filter((o) => !done.has(o.key)), lastSyncedAt: at };
      }),
    markFailed: (key, error) =>
      set((s) => ({
        outbox: s.outbox.map((o) => (o.key === key ? { ...o, attempts: o.attempts + 1, lastError: error } : o)),
      })),
    setAccount: (account) => set({ account, ...(account ? {} : { outbox: [] }) }),
  };
}
