import type { BodyMeasurement, ProgressPhoto } from '@/domain';
import { nowISO } from '@/lib/now';

import { upsertById, type GetState, type SetState } from './common';

export interface BodyActions {
  /** One measurement entry per date; saving again on the same date updates it. */
  saveMeasurement: (m: Omit<BodyMeasurement, 'updatedAt'>) => void;
  deleteMeasurement: (id: string) => void;
  /** Returns photos replaced by this one (same day + pose) so callers can remove their files. */
  addPhoto: (photo: ProgressPhoto) => ProgressPhoto[];
  updatePhoto: (id: string, patch: Partial<Pick<ProgressPhoto, 'storagePath' | 'localUri'>>) => void;
  deletePhoto: (id: string) => void;
}

export function createBodyActions(set: SetState, get: GetState): BodyActions {
  return {
    saveMeasurement: (m) => {
      const existing = get().measurements.find((x) => x.date === m.date);
      const next: BodyMeasurement = { ...m, id: existing?.id ?? m.id, updatedAt: nowISO() };
      set((s) => ({ measurements: upsertById(s.measurements, next).sort((a, b) => a.date.localeCompare(b.date)) }));
      get().enqueue('body_measurements', next.id);
    },
    deleteMeasurement: (id) => {
      set((s) => ({ measurements: s.measurements.filter((m) => m.id !== id) }));
      get().enqueue('body_measurements', id, 'delete');
    },
    addPhoto: (photo) => {
      // One photo per checkpoint day and pose: a retake replaces the previous one.
      const replaced = get().photos.filter((p) => p.dayNumber === photo.dayNumber && p.pose === photo.pose);
      set((s) => ({ photos: [...s.photos.filter((p) => !replaced.includes(p)), photo] }));
      replaced.forEach((p) => get().enqueue('progress_photos', p.id, 'delete'));
      get().enqueue('progress_photos', photo.id);
      return replaced;
    },
    updatePhoto: (id, patch) => {
      set((s) => ({ photos: s.photos.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
      get().enqueue('progress_photos', id);
    },
    deletePhoto: (id) => {
      set((s) => ({ photos: s.photos.filter((p) => p.id !== id) }));
      get().enqueue('progress_photos', id, 'delete');
    },
  };
}
