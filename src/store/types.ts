import type { ThemePreference } from '@/design-system';
import type {
  ActivityLog,
  BodyMeasurement,
  DailyLog,
  Habit,
  HabitLog,
  ID,
  Journey,
  Meal,
  NotificationPreferences,
  Profile,
  ProgressPhoto,
  ProteinLog,
  WaterLog,
  WorkoutSession,
  WorkoutTemplate,
} from '@/domain';

export type RestPreset = 60 | 90 | 120 | 180;

export interface Settings {
  theme: ThemePreference;
  hapticsEnabled: boolean;
  restTimerEnabled: boolean;
  restTimerSeconds: RestPreset;
  seenMilestones: number[];
}

/** Entities that sync to a remote table. Nested children are flattened by the remote adapter. */
export type SyncEntity =
  | 'profiles'
  | 'journeys'
  | 'user_habits'
  | 'habit_logs'
  | 'protein_logs'
  | 'meals'
  | 'water_logs'
  | 'daily_logs'
  | 'activity_logs'
  | 'workout_templates'
  | 'workout_sessions'
  | 'body_measurements'
  | 'progress_photos'
  | 'notification_preferences';

export interface OutboxItem {
  key: string;
  entity: SyncEntity;
  id: ID;
  op: 'upsert' | 'delete';
  queuedAt: string;
  attempts: number;
  lastError: string | null;
}

export interface Account {
  userId: string;
  email: string | null;
}

/** Persisted user data. Everything the app needs to work fully offline. */
export interface AppData {
  profile: Profile | null;
  journey: Journey | null;
  habits: Habit[];
  habitLogs: HabitLog[];
  proteinLogs: ProteinLog[];
  meals: Meal[];
  waterLogs: WaterLog[];
  dailyLogs: DailyLog[];
  activityLogs: ActivityLog[];
  templates: WorkoutTemplate[];
  sessions: WorkoutSession[];
  measurements: BodyMeasurement[];
  photos: ProgressPhoto[];
  notificationPrefs: NotificationPreferences;
  settings: Settings;
  account: Account | null;
  outbox: OutboxItem[];
  lastSyncedAt: string | null;
}
