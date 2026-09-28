import type {
  Habit,
  NotificationPreferences,
  Profile,
  ProgressPhoto,
  WorkoutSession,
  WorkoutTemplate,
} from '@/domain';

import type { AppData, SyncEntity } from '@/store/types';

export type Row = Record<string, unknown>;

const toSnake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const toCamel = (key: string) => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

/** Mechanical camelCase → snake_case mapping for flat entities. */
export function toRow(record: object, userId: string, omit: string[] = []): Row {
  const row: Row = { user_id: userId };
  for (const [k, v] of Object.entries(record)) {
    if (omit.includes(k)) continue;
    row[toSnake(k)] = v;
  }
  return row;
}

export function fromRow<T>(row: Row, omit: string[] = ['user_id']): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (omit.includes(k)) continue;
    // Postgres numeric comes back as string from PostgREST in some configurations.
    out[toCamel(k)] = v;
  }
  return out as T;
}

const num = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

// ---------- Special shapes ----------

export function profileToRow(p: Profile, userId: string): Row {
  return { user_id: userId, name: p.name, height_cm: p.heightCm, unit_system: p.unitSystem, created_at: p.createdAt, updated_at: p.updatedAt };
}

export function profileFromRow(r: Row): Profile {
  return {
    id: String(r.user_id),
    name: String(r.name),
    heightCm: num(r.height_cm),
    unitSystem: 'metric',
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export function prefsToRow(p: NotificationPreferences, userId: string): Row {
  return {
    user_id: userId,
    water_enabled: p.water.enabled,
    water_start_min: p.water.start,
    water_end_min: p.water.end,
    water_per_day: p.water.perDay,
    workout_enabled: p.workout.enabled,
    workout_time_min: p.workout.time,
    habit_enabled: p.habit.enabled,
    habit_time_min: p.habit.time,
    journey_enabled: p.journey.enabled,
    journey_time_min: p.journey.time,
    rest_enabled: p.rest.enabled,
    updated_at: p.updatedAt,
  };
}

export function prefsFromRow(r: Row): NotificationPreferences {
  return {
    water: { enabled: !!r.water_enabled, start: Number(r.water_start_min), end: Number(r.water_end_min), perDay: Number(r.water_per_day) },
    workout: { enabled: !!r.workout_enabled, time: Number(r.workout_time_min) },
    habit: { enabled: !!r.habit_enabled, time: Number(r.habit_time_min) },
    journey: { enabled: !!r.journey_enabled, time: Number(r.journey_time_min) },
    rest: { enabled: !!r.rest_enabled },
    updatedAt: String(r.updated_at),
  };
}

export interface TemplateRows {
  template: Row;
  exercises: Row[];
}

export function templateToRows(t: WorkoutTemplate, userId: string): TemplateRows {
  return {
    template: toRow(t, userId, ['exercises']),
    exercises: t.exercises.map((e, position) => ({
      id: e.id,
      user_id: userId,
      template_id: t.id,
      exercise_id: e.exerciseId,
      position,
      target_sets: e.targetSets,
      target_reps: e.targetReps,
      rest_seconds: e.restSeconds,
    })),
  };
}

export function templateFromRows(t: Row, exercises: Row[]): WorkoutTemplate {
  return {
    ...fromRow<Omit<WorkoutTemplate, 'exercises'>>(t),
    exercises: exercises
      .filter((e) => e.template_id === t.id)
      .sort((a, b) => Number(a.position) - Number(b.position))
      .map((e) => ({
        id: String(e.id),
        exerciseId: String(e.exercise_id),
        targetSets: Number(e.target_sets),
        targetReps: Number(e.target_reps),
        restSeconds: num(e.rest_seconds),
      })),
  };
}

export interface SessionRows {
  session: Row;
  exercises: Row[];
  sets: Row[];
}

export function sessionToRows(s: WorkoutSession, userId: string): SessionRows {
  const exercises: Row[] = [];
  const sets: Row[] = [];
  s.exercises.forEach((e, position) => {
    exercises.push({
      id: e.id,
      user_id: userId,
      session_id: s.id,
      exercise_id: e.exerciseId,
      position,
      target_sets: e.targetSets,
      target_reps: e.targetReps,
      completed_at: e.completedAt,
    });
    e.sets.forEach((set, setPosition) => {
      sets.push({
        id: set.id,
        user_id: userId,
        session_exercise_id: e.id,
        position: setPosition,
        weight_kg: set.weightKg,
        reps: set.reps,
        completed_at: set.completedAt,
      });
    });
  });
  return { session: toRow(s, userId, ['exercises']), exercises, sets };
}

export function sessionFromRows(s: Row, exercises: Row[], sets: Row[]): WorkoutSession {
  return {
    ...fromRow<Omit<WorkoutSession, 'exercises'>>(s),
    exercises: exercises
      .filter((e) => e.session_id === s.id)
      .sort((a, b) => Number(a.position) - Number(b.position))
      .map((e) => ({
        id: String(e.id),
        exerciseId: String(e.exercise_id),
        targetSets: Number(e.target_sets),
        targetReps: num(e.target_reps),
        completedAt: (e.completed_at as string | null) ?? null,
        sets: sets
          .filter((x) => x.session_exercise_id === e.id)
          .sort((a, b) => Number(a.position) - Number(b.position))
          .map((x) => ({
            id: String(x.id),
            weightKg: num(x.weight_kg),
            reps: num(x.reps),
            completedAt: (x.completed_at as string | null) ?? null,
          })),
      })),
  };
}

export function photoToRow(p: ProgressPhoto, userId: string): Row {
  // localUri is device-specific and never leaves the device.
  return toRow(p, userId, ['localUri']);
}

export function habitFromRow(r: Row): Habit {
  const h = fromRow<Habit>(r);
  return { ...h, target: num(r.target) };
}

/** Numeric columns that PostgREST may return as strings. */
export const NUMERIC_FIELDS: Partial<Record<SyncEntity, string[]>> = {
  protein_logs: ['grams'],
  habit_logs: ['value'],
  body_measurements: ['weightKg', 'waistCm', 'chestCm', 'leftArmCm', 'rightArmCm', 'bodyFatPct'],
};

export function coerceNumbers<T extends object>(entity: SyncEntity, record: T): T {
  const fields = NUMERIC_FIELDS[entity];
  if (!fields) return record;
  const out = { ...record } as Record<string, unknown>;
  for (const f of fields) if (out[f] !== null && out[f] !== undefined) out[f] = Number(out[f]);
  return out as T;
}

export type RemoteSnapshot = Partial<Pick<AppData,
  'profile' | 'journey' | 'habits' | 'habitLogs' | 'proteinLogs' | 'waterLogs' | 'dailyLogs' | 'activityLogs' |
  'templates' | 'sessions' | 'measurements' | 'photos' | 'notificationPrefs'>>;
