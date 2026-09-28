import { router } from 'expo-router';

import { buildSessionFromTemplate, todayISO, type WorkoutSession, type WorkoutTemplate } from '@/domain';
import { rescheduleReminders } from '@/features/notifications/useReminderScheduler';
import { newId } from '@/lib/id';
import { nowISO } from '@/lib/now';
import { analytics } from '@/services/analytics';
import { haptics } from '@/services/haptics';
import { cancelNotification } from '@/services/notifications';
import { useActiveWorkoutStore, useAppStore } from '@/store';

/** Starts a session from a template, prefilled from the last performance of each exercise. */
export function startWorkout(template: WorkoutTemplate) {
  const active = useActiveWorkoutStore.getState().session;
  if (active) {
    router.push('/workout/active');
    return;
  }
  const history = useAppStore.getState().sessions;
  const session = buildSessionFromTemplate(template, history, newId, new Date(), todayISO());
  useActiveWorkoutStore.getState().start(session);
  analytics.track('workout_started', { exercise_count: session.exercises.length, from_template: true });
  haptics.medium();
  router.push('/workout/active');
}

/** Starts an empty session the user builds as they go. */
export function startEmptyWorkout() {
  if (useActiveWorkoutStore.getState().session) {
    router.push('/workout/active');
    return;
  }
  const now = nowISO();
  const session: WorkoutSession = {
    id: newId(),
    templateId: null,
    name: 'Workout',
    date: todayISO(),
    startedAt: now,
    endedAt: null,
    status: 'active',
    exercises: [],
    updatedAt: now,
  };
  useActiveWorkoutStore.getState().start(session);
  analytics.track('workout_started', { exercise_count: 0, from_template: false });
  haptics.medium();
  router.push('/workout/active');
}

/**
 * Completes the active session. It is written to the persisted data store
 * first (and queued for sync), so nothing depends on the network.
 */
export function finishWorkout(): WorkoutSession | null {
  const { rest } = useActiveWorkoutStore.getState();
  void cancelNotification(rest?.notificationId);
  const finished = useActiveWorkoutStore.getState().finish();
  if (!finished) return null;
  useAppStore.getState().saveSession(finished);
  analytics.track('workout_completed', {
    exercise_count: finished.exercises.length,
    set_count: finished.exercises.reduce((n, e) => n + e.sets.filter((s) => s.completedAt).length, 0),
  });
  haptics.success();
  rescheduleReminders();
  return finished;
}

export function discardWorkout() {
  const { rest } = useActiveWorkoutStore.getState();
  void cancelNotification(rest?.notificationId);
  useActiveWorkoutStore.getState().discard();
}
