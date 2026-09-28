import type { NotificationPreferences } from '@/domain';

import type { AppData, Settings } from './types';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  hapticsEnabled: true,
  restTimerEnabled: true,
  restTimerSeconds: 90,
  seenMilestones: [],
};

export function defaultNotificationPrefs(now: string): NotificationPreferences {
  return {
    water: { enabled: true, start: 9 * 60, end: 20 * 60, perDay: 3 },
    workout: { enabled: true, time: 8 * 60 },
    habit: { enabled: true, time: 21 * 60 },
    journey: { enabled: true, time: 7 * 60 + 30 },
    rest: { enabled: true },
    updatedAt: now,
  };
}

export function emptyData(now: string): AppData {
  return {
    profile: null,
    journey: null,
    habits: [],
    habitLogs: [],
    proteinLogs: [],
    waterLogs: [],
    dailyLogs: [],
    activityLogs: [],
    templates: [],
    sessions: [],
    measurements: [],
    photos: [],
    notificationPrefs: defaultNotificationPrefs(now),
    settings: DEFAULT_SETTINGS,
    account: null,
    outbox: [],
    lastSyncedAt: null,
  };
}
