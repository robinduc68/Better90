import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { PlannedNotification } from '@/domain';

const PLAN_PREFIX = 'l90:plan:';
const REST_KIND = 'rest';
const supported = Platform.OS !== 'web';

let configured = false;

/** Call once at startup. */
export function configureNotifications() {
  if (!supported || configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async (n) => {
      // The in-app rest timer already alerts with haptics while foregrounded.
      const isRest = n.request.content.data?.kind === REST_KIND;
      return { shouldShowBanner: !isRest, shouldShowList: !isRest, shouldPlaySound: false, shouldSetBadge: false };
    },
  });
  if (Platform.OS === 'android') {
    void Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    void Notifications.setNotificationChannelAsync('rest-timer', {
      name: 'Rest timer',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
    });
  }
}

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export async function getPermission(): Promise<PermissionState> {
  if (!supported) return 'unsupported';
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
}

export async function requestPermission(): Promise<PermissionState> {
  if (!supported) return 'unsupported';
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return 'granted';
  if (!current.canAskAgain) return 'denied';
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted' ? 'granted' : 'denied';
}

/** Replaces all planned reminders with `plan`. Rest-timer notifications are untouched. */
export async function applySchedule(plan: PlannedNotification[]): Promise<void> {
  if (!supported) return;
  if ((await getPermission()) !== 'granted') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(PLAN_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
  for (const item of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${PLAN_PREFIX}${item.id}`,
      content: { title: item.title, body: item.body, data: { kind: item.category } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: item.at, channelId: 'reminders' },
    });
  }
}

export async function cancelAllPlanned(): Promise<void> {
  if (!supported) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(PLAN_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/** Local notification for when rest ends while the app is backgrounded. */
export async function scheduleRestEnd(seconds: number, exerciseName: string | null): Promise<string | null> {
  if (!supported || seconds < 1) return null;
  if ((await getPermission()) !== 'granted') return null;
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Rest complete',
      body: exerciseName ? `Next set: ${exerciseName}.` : 'Ready for your next set.',
      data: { kind: REST_KIND },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.round(seconds), channelId: 'rest-timer' },
  });
}

export async function cancelNotification(id: string | null | undefined): Promise<void> {
  if (!supported || !id) return;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
}
