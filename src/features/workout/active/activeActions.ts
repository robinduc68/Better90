import { Keyboard } from 'react-native';

import { getExercise } from '@/data/exercises';
import { analytics } from '@/services/analytics';
import { haptics } from '@/services/haptics';
import { cancelNotification, scheduleRestEnd } from '@/services/notifications';
import { useActiveWorkoutStore, useAppStore } from '@/store';

/** One tap: completes the set, gives a light haptic, and starts the rest timer if enabled. */
export async function toggleSetComplete(exerciseItemId: string, setId: string) {
  Keyboard.dismiss();
  const store = useActiveWorkoutStore.getState();
  const completed = store.toggleSet(exerciseItemId, setId);
  if (!completed) return;
  haptics.tick();

  const session = useActiveWorkoutStore.getState().session;
  const item = session?.exercises.find((e) => e.id === exerciseItemId);
  if (item?.completedAt) analytics.track('exercise_completed', { set_count: item.sets.length });

  const { settings, notificationPrefs, templates } = useAppStore.getState();
  if (!settings.restTimerEnabled) return;
  const templateRest = session?.templateId
    ? templates.find((t) => t.id === session.templateId)?.exercises.find((e) => e.exerciseId === item?.exerciseId)?.restSeconds
    : null;
  const duration = templateRest ?? settings.restTimerSeconds;

  await cancelNotification(useActiveWorkoutStore.getState().rest?.notificationId);
  const nextName = nextExerciseName(exerciseItemId);
  const notificationId = notificationPrefs.rest.enabled ? await scheduleRestEnd(duration, nextName).catch(() => null) : null;
  useActiveWorkoutStore.getState().startRest(duration, item?.exerciseId ?? null, notificationId);
}

function nextExerciseName(currentItemId: string): string | null {
  const session = useActiveWorkoutStore.getState().session;
  if (!session) return null;
  const current = session.exercises.find((e) => e.id === currentItemId);
  const target = current && current.sets.some((s) => !s.completedAt) ? current : session.exercises.find((e) => e.sets.some((s) => !s.completedAt));
  return target ? (getExercise(target.exerciseId)?.name ?? null) : null;
}

export async function extendRest(seconds: number) {
  const { rest } = useActiveWorkoutStore.getState();
  if (!rest) return;
  await cancelNotification(rest.notificationId);
  const remaining = Math.max(0, (rest.endsAt - Date.now()) / 1000) + seconds;
  const { notificationPrefs } = useAppStore.getState();
  const id = notificationPrefs.rest.enabled ? await scheduleRestEnd(remaining, null).catch(() => null) : null;
  useActiveWorkoutStore.getState().extendRest(seconds, id);
}

export async function skipRest() {
  const { rest } = useActiveWorkoutStore.getState();
  await cancelNotification(rest?.notificationId);
  useActiveWorkoutStore.getState().clearRest();
}
