import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { nowISO } from '@/lib/now';
import { persistStorage, STORAGE_KEYS } from '@/lib/storage';

import { DEFAULT_SETTINGS, emptyData } from './defaults';
import { createBodyActions, type BodyActions } from './slices/bodySlice';
import { createJourneyActions, type JourneyActions } from './slices/journeySlice';
import { createLogActions, type LogActions } from './slices/logSlice';
import { createMealActions, type MealActions } from './slices/mealSlice';
import { createSyncActions, type SyncActions } from './slices/syncSlice';
import { createWorkoutActions, type WorkoutActions } from './slices/workoutSlice';
import type { AppData } from './types';

export type AppState = AppData & JourneyActions & LogActions & MealActions & WorkoutActions & BodyActions & SyncActions;

/**
 * Local-first data store. The device copy is the source of truth for the UI;
 * the sync engine mirrors it to the backend when signed in and online.
 */
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...emptyData(nowISO()),
      ...createJourneyActions(set, get),
      ...createLogActions(set, get),
      ...createMealActions(set, get),
      ...createWorkoutActions(set, get),
      ...createBodyActions(set, get),
      ...createSyncActions(set, get),
    }),
    {
      name: STORAGE_KEYS.data,
      storage: persistStorage,
      version: 1,
      partialize: (s): AppData => ({
        profile: s.profile,
        journey: s.journey,
        habits: s.habits,
        habitLogs: s.habitLogs,
        proteinLogs: s.proteinLogs,
        meals: s.meals,
        waterLogs: s.waterLogs,
        dailyLogs: s.dailyLogs,
        activityLogs: s.activityLogs,
        templates: s.templates,
        sessions: s.sessions,
        measurements: s.measurements,
        photos: s.photos,
        notificationPrefs: s.notificationPrefs,
        settings: s.settings,
        account: s.account,
        outbox: s.outbox,
        lastSyncedAt: s.lastSyncedAt,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppData>;
        return { ...current, ...p, settings: { ...DEFAULT_SETTINGS, ...p.settings } };
      },
    },
  ),
);
