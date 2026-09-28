/**
 * Core domain entities. Field names mirror the PostgreSQL columns (camelCase ↔ snake_case)
 * so the sync layer can map them mechanically.
 */

/** Local calendar date, `YYYY-MM-DD`. */
export type ISODate = string;
/** ISO-8601 timestamp. */
export type ISODateTime = string;
export type ID = string;

export interface Timestamps {
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// ---------- Profile & journey ----------

export type UnitSystem = 'metric';

export interface Profile extends Timestamps {
  id: ID;
  name: string;
  heightCm: number | null;
  unitSystem: UnitSystem;
}

export type GoalKey = 'build_muscle' | 'lose_fat' | 'recomposition' | 'appearance' | 'discipline' | 'custom';
export type ActivityKey = 'football' | 'running' | 'cycling' | 'other';
export type JourneyDuration = 30 | 60 | 90;
export type JourneyStatus = 'active' | 'completed' | 'ended';

export interface Journey extends Timestamps {
  id: ID;
  startDate: ISODate;
  durationDays: JourneyDuration;
  goals: GoalKey[];
  customGoal: string | null;
  proteinTargetG: number;
  waterTargetMl: number;
  sleepTargetMin: number;
  gymDaysPerWeek: number;
  activities: ActivityKey[];
  status: JourneyStatus;
}

// ---------- Habits ----------

export type HabitKind = 'boolean' | 'duration' | 'count';
export type HabitCategory = 'skincare' | 'learning' | 'reading' | 'movement' | 'mind' | 'custom';
export type TimeOfDay = 'morning' | 'evening' | 'anytime';

export interface RoutineStep {
  id: ID;
  label: string;
  /** When set, the step only appears on nights where this tag is active (e.g. "BHA NIGHT"). */
  tag: string | null;
}

export interface RoutineTag {
  tag: string;
  /** 0 = Sunday … 6 = Saturday */
  weekdays: number[];
}

export interface Habit extends Timestamps {
  id: ID;
  /** Stable key for predefined habits (e.g. `morning_skincare`); null for custom ones. */
  templateKey: string | null;
  name: string;
  kind: HabitKind;
  /** Minutes for duration habits, count for count habits, null for boolean. */
  target: number | null;
  unit: string | null;
  category: HabitCategory;
  timeOfDay: TimeOfDay;
  routineSteps: RoutineStep[];
  routineTags: RoutineTag[];
  countsTowardScore: boolean;
  sortOrder: number;
  archivedAt: ISODateTime | null;
}

export interface HabitLog {
  id: ID;
  habitId: ID;
  date: ISODate;
  /** 1/0 for boolean habits, minutes or count otherwise. */
  value: number;
  stepsDone: ID[];
  updatedAt: ISODateTime;
}

// ---------- Nutrition & daily ----------

export interface ProteinLog {
  id: ID;
  date: ISODate;
  grams: number;
  loggedAt: ISODateTime;
}

export interface WaterLog {
  id: ID;
  date: ISODate;
  ml: number;
  loggedAt: ISODateTime;
}

export interface DailyLog {
  id: ID;
  date: ISODate;
  sleepMinutes: number | null;
  note: string | null;
  updatedAt: ISODateTime;
}

export interface ActivityLog {
  id: ID;
  date: ISODate;
  activity: ActivityKey;
  minutes: number;
  loggedAt: ISODateTime;
}

// ---------- Exercises & workouts ----------

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'abs'
  | 'glutes'
  | 'calves'
  | 'full_body';

export type Equipment = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'other';

/**
 * Exercise imagery supports bundled assets now and CDN URLs later.
 * `null` renders a designed placeholder.
 */
export type MediaSource = { kind: 'local'; asset: number } | { kind: 'remote'; uri: string };

export interface Exercise {
  id: ID;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: string[];
  equipment: Equipment;
  instructions: string[];
  image: MediaSource | null;
  animation: MediaSource | null;
  /** Bodyweight movements may be logged without weight. */
  isBodyweight: boolean;
}

export interface TemplateExercise {
  id: ID;
  exerciseId: ID;
  targetSets: number;
  targetReps: number;
  restSeconds: number | null;
}

export interface WorkoutTemplate extends Timestamps {
  id: ID;
  name: string;
  /** Planned weekdays (0 = Sunday). Empty = unscheduled / rotation. */
  weekdays: number[];
  exercises: TemplateExercise[];
  archivedAt: ISODateTime | null;
}

export interface WorkoutSet {
  id: ID;
  weightKg: number | null;
  reps: number | null;
  completedAt: ISODateTime | null;
}

export interface SessionExercise {
  id: ID;
  exerciseId: ID;
  targetSets: number;
  targetReps: number | null;
  completedAt: ISODateTime | null;
  sets: WorkoutSet[];
}

export type SessionStatus = 'active' | 'completed';

export interface WorkoutSession {
  id: ID;
  templateId: ID | null;
  name: string;
  date: ISODate;
  startedAt: ISODateTime;
  endedAt: ISODateTime | null;
  status: SessionStatus;
  exercises: SessionExercise[];
  updatedAt: ISODateTime;
}

// ---------- Body progress ----------

export interface BodyMeasurement {
  id: ID;
  date: ISODate;
  weightKg: number | null;
  waistCm: number | null;
  chestCm: number | null;
  leftArmCm: number | null;
  rightArmCm: number | null;
  bodyFatPct: number | null;
  updatedAt: ISODateTime;
}

export type PhotoPose = 'front' | 'side' | 'back';

export interface ProgressPhoto {
  id: ID;
  date: ISODate;
  dayNumber: number;
  pose: PhotoPose;
  /** Private file in the app sandbox. */
  localUri: string | null;
  /** Object path in the private storage bucket — never a public URL. */
  storagePath: string | null;
  createdAt: ISODateTime;
}

// ---------- Notifications ----------

/** Minutes since local midnight. */
export type ClockTime = number;

export interface NotificationPreferences {
  water: { enabled: boolean; start: ClockTime; end: ClockTime; perDay: number };
  workout: { enabled: boolean; time: ClockTime };
  habit: { enabled: boolean; time: ClockTime };
  journey: { enabled: boolean; time: ClockTime };
  rest: { enabled: boolean };
  updatedAt: ISODateTime;
}
