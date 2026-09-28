import { useEffect } from 'react';
import { AppState } from 'react-native';

import { applySchedule, configureNotifications } from '@/services/notifications';
import { useAppStore } from '@/store';

import { buildReminderPlan } from './reminderPlan';

let timer: ReturnType<typeof setTimeout> | null = null;

/** Recomputes reminders soon after relevant changes (debounced). */
export function rescheduleReminders(delayMs = 1500) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void applySchedule(buildReminderPlan()).catch(() => undefined);
  }, delayMs);
}

/**
 * Keeps scheduled reminders in sync with today's progress, e.g. water
 * reminders stop once the target is reached and copy reflects current totals.
 */
export function useReminderScheduler() {
  useEffect(() => {
    configureNotifications();
    rescheduleReminders(500);
    const unsub = useAppStore.subscribe((s, prev) => {
      if (
        s.waterLogs !== prev.waterLogs ||
        s.habitLogs !== prev.habitLogs ||
        s.proteinLogs !== prev.proteinLogs ||
        s.sessions !== prev.sessions ||
        s.templates !== prev.templates ||
        s.notificationPrefs !== prev.notificationPrefs ||
        s.journey !== prev.journey
      ) {
        rescheduleReminders();
      }
    });
    const sub = AppState.addEventListener('change', (state) => state === 'active' && rescheduleReminders(300));
    return () => {
      unsub();
      sub.remove();
    };
  }, []);
}
