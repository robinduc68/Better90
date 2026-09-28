import type { BodyMeasurement, Habit, Journey, NotificationPreferences, Profile } from '@/domain';
import { nowISO } from '@/lib/now';

import { emptyData } from '../defaults';
import type { AppData, Settings } from '../types';
import type { GetState, SetState } from './common';

export interface OnboardingResult {
  profile: Profile;
  journey: Journey;
  habits: Habit[];
  measurement: BodyMeasurement | null;
  notificationPrefs: NotificationPreferences;
}

export interface JourneyActions {
  completeOnboarding: (result: OnboardingResult) => void;
  updateProfile: (patch: Partial<Pick<Profile, 'name' | 'heightCm'>>) => void;
  updateJourney: (patch: Partial<Omit<Journey, 'id' | 'createdAt'>>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  updateNotificationPrefs: (patch: Partial<Omit<NotificationPreferences, 'updatedAt'>>) => void;
  markMilestoneSeen: (day: number) => void;
  /** Replaces all local data (demo seed or remote restore). */
  loadSnapshot: (data: Partial<AppData>) => void;
  /** Erases all local data on this device. */
  resetAll: () => void;
}

export function createJourneyActions(set: SetState, get: GetState): JourneyActions {
  return {
    completeOnboarding: ({ profile, journey, habits, measurement, notificationPrefs }) => {
      set({
        profile,
        journey,
        habits,
        measurements: measurement ? [measurement] : [],
        notificationPrefs,
      });
      const { enqueue } = get();
      enqueue('profiles', profile.id);
      enqueue('journeys', journey.id);
      habits.forEach((h) => enqueue('user_habits', h.id));
      if (measurement) enqueue('body_measurements', measurement.id);
      enqueue('notification_preferences', 'self');
    },
    updateProfile: (patch) => {
      const profile = get().profile;
      if (!profile) return;
      set({ profile: { ...profile, ...patch, updatedAt: nowISO() } });
      get().enqueue('profiles', profile.id);
    },
    updateJourney: (patch) => {
      const journey = get().journey;
      if (!journey) return;
      set({ journey: { ...journey, ...patch, updatedAt: nowISO() } });
      get().enqueue('journeys', journey.id);
    },
    updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    updateNotificationPrefs: (patch) => {
      set((s) => ({ notificationPrefs: { ...s.notificationPrefs, ...patch, updatedAt: nowISO() } }));
      get().enqueue('notification_preferences', 'self');
    },
    markMilestoneSeen: (day) =>
      set((s) =>
        s.settings.seenMilestones.includes(day) ? {} : { settings: { ...s.settings, seenMilestones: [...s.settings.seenMilestones, day] } },
      ),
    loadSnapshot: (data) => set({ ...emptyData(nowISO()), ...data }),
    resetAll: () => set({ ...emptyData(nowISO()) }),
  };
}
