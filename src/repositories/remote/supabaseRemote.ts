import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  ActivityLog,
  BodyMeasurement,
  DailyLog,
  HabitLog,
  Meal,
  Journey,
  ProgressPhoto,
  ProteinLog,
  WaterLog,
  WorkoutSession,
  WorkoutTemplate,
} from '@/domain';
import type { SyncEntity } from '@/store/types';

import {
  coerceNumbers,
  fromRow,
  habitFromRow,
  mealFromRows,
  mealToRows,
  photoToRow,
  prefsFromRow,
  prefsToRow,
  profileFromRow,
  profileToRow,
  sessionFromRows,
  sessionToRows,
  templateFromRows,
  templateToRows,
  toRow,
  type RemoteSnapshot,
  type Row,
} from './mappers';
import type { PhotoBucket, RemoteRepository } from './RemoteRepository';

const PHOTO_BUCKET: PhotoBucket = 'progress-photos';

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export function createSupabaseRemote(db: SupabaseClient): RemoteRepository {
  const upsertRows = async (table: string, rows: Row[], onConflict = 'id') => {
    if (rows.length === 0) return;
    check(await db.from(table).upsert(rows, { onConflict }));
  };

  /** Removes child rows that no longer exist locally (e.g. a deleted set). */
  const pruneChildren = async (table: string, parentColumn: string, parentIds: string[], keepIds: string[]) => {
    if (parentIds.length === 0) return;
    let q = db.from(table).delete().in(parentColumn, parentIds);
    if (keepIds.length > 0) q = q.not('id', 'in', `(${keepIds.join(',')})`);
    check(await q);
  };

  return {
    async upsert(entity: SyncEntity, records: object[], userId: string) {
      switch (entity) {
        case 'profiles':
          return upsertRows('profiles', records.map((r) => profileToRow(r as never, userId)), 'user_id');
        case 'notification_preferences':
          return upsertRows('notification_preferences', records.map((r) => prefsToRow(r as never, userId)), 'user_id');
        case 'workout_templates': {
          const mapped = (records as WorkoutTemplate[]).map((t) => templateToRows(t, userId));
          await upsertRows('workout_templates', mapped.map((m) => m.template));
          const children = mapped.flatMap((m) => m.exercises);
          await pruneChildren('workout_template_exercises', 'template_id', mapped.map((m) => String(m.template.id)), children.map((c) => String(c.id)));
          return upsertRows('workout_template_exercises', children);
        }
        case 'workout_sessions': {
          const mapped = (records as WorkoutSession[]).map((s) => sessionToRows(s, userId));
          await upsertRows('workout_sessions', mapped.map((m) => m.session));
          const exercises = mapped.flatMap((m) => m.exercises);
          const sets = mapped.flatMap((m) => m.sets);
          await pruneChildren('workout_session_exercises', 'session_id', mapped.map((m) => String(m.session.id)), exercises.map((e) => String(e.id)));
          await upsertRows('workout_session_exercises', exercises);
          await pruneChildren('workout_sets', 'session_exercise_id', exercises.map((e) => String(e.id)), sets.map((s) => String(s.id)));
          return upsertRows('workout_sets', sets);
        }
        case 'meals': {
          const mapped = (records as Meal[]).map((m) => mealToRows(m, userId));
          await upsertRows('meals', mapped.map((m) => m.meal));
          const items = mapped.flatMap((m) => m.items);
          await pruneChildren('meal_items', 'meal_id', mapped.map((m) => String(m.meal.id)), items.map((i) => String(i.id)));
          return upsertRows('meal_items', items);
        }
        case 'progress_photos':
          return upsertRows('progress_photos', (records as ProgressPhoto[]).filter((p) => p.storagePath).map((p) => photoToRow(p, userId)));
        default:
          return upsertRows(entity, records.map((r) => toRow(r, userId)));
      }
    },

    async remove(entity, ids, userId) {
      if (ids.length === 0) return;
      if (entity === 'profiles' || entity === 'notification_preferences') {
        check(await db.from(entity).delete().eq('user_id', userId));
        return;
      }
      check(await db.from(entity).delete().in('id', ids));
    },

    async pullAll(userId) {
      const all = async (table: string) => check(await db.from(table).select('*').eq('user_id', userId)) as Row[];
      const [
        profiles, journeys, habits, habitLogs, protein, water, daily, activity,
        templates, templateExercises, sessions, sessionExercises, sets, measurements, photos, prefs, meals, mealItems,
      ] = await Promise.all([
        all('profiles'), all('journeys'), all('user_habits'), all('habit_logs'), all('protein_logs'), all('water_logs'),
        all('daily_logs'), all('activity_logs'), all('workout_templates'), all('workout_template_exercises'),
        all('workout_sessions'), all('workout_session_exercises'), all('workout_sets'), all('body_measurements'),
        all('progress_photos'), all('notification_preferences'), all('meals'), all('meal_items'),
      ]);
      const activeJourney = journeys.find((j) => j.status === 'active') ?? journeys[0];
      const snapshot: RemoteSnapshot = {
        profile: profiles[0] ? profileFromRow(profiles[0]) : null,
        journey: activeJourney ? fromRow<Journey>(activeJourney) : null,
        habits: habits.map(habitFromRow),
        habitLogs: habitLogs.map((r) => coerceNumbers('habit_logs', fromRow<HabitLog>(r))),
        proteinLogs: protein.map((r) => coerceNumbers('protein_logs', fromRow<ProteinLog>(r))),
        meals: meals.map((m) => mealFromRows(m, mealItems)),
        waterLogs: water.map((r) => fromRow<WaterLog>(r)),
        dailyLogs: daily.map((r) => fromRow<DailyLog>(r)),
        activityLogs: activity.map((r) => fromRow<ActivityLog>(r)),
        templates: templates.map((t) => templateFromRows(t, templateExercises)),
        sessions: sessions.map((s) => sessionFromRows(s, sessionExercises, sets)),
        measurements: measurements.map((r) => coerceNumbers('body_measurements', fromRow<BodyMeasurement>(r))),
        photos: photos.map((r) => ({ ...fromRow<ProgressPhoto>(r), localUri: null })),
      };
      if (prefs[0]) snapshot.notificationPrefs = prefsFromRow(prefs[0]);
      return snapshot;
    },

    async uploadPhoto(path, bytes, contentType, bucket: PhotoBucket = PHOTO_BUCKET) {
      check(await db.storage.from(bucket).upload(path, bytes, { contentType, upsert: true }));
    },

    async signedPhotoUrl(path, expiresInSec, bucket: PhotoBucket = PHOTO_BUCKET) {
      const data = check(await db.storage.from(bucket).createSignedUrl(path, expiresInSec));
      if (!data?.signedUrl) throw new Error('Could not create a signed URL');
      return data.signedUrl;
    },

    async removePhotos(paths, bucket: PhotoBucket = PHOTO_BUCKET) {
      if (paths.length === 0) return;
      check(await db.storage.from(bucket).remove(paths));
    },

    async deleteAccount() {
      const { error } = await db.functions.invoke('delete-account', { method: 'POST' });
      if (error) throw new Error(error.message);
    },
  };
}
