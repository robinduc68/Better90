import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { useAppStore } from '@/store';

/**
 * Haptics are reserved for meaningful moments: set/habit completed,
 * workout start/finish, timer finished, milestones. Not every tap.
 */
function enabled() {
  return Platform.OS !== 'web' && useAppStore.getState().settings.hapticsEnabled;
}

const safe = (fn: () => Promise<void>) => {
  if (!enabled()) return;
  fn().catch(() => undefined);
};

export const haptics = {
  /** Set completed, habit checked. */
  tick: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Workout started. */
  medium: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  /** Workout completed, milestone reached. */
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Rest timer finished. */
  alert: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  selection: () => safe(() => Haptics.selectionAsync()),
};
