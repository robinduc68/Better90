import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

export const persistStorage = createJSONStorage(() => AsyncStorage);

export const STORAGE_KEYS = {
  data: 'level90.data.v1',
  activeWorkout: 'level90.active-workout.v1',
} as const;
