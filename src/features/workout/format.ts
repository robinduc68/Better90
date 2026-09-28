import { formatKg, type WorkoutSet } from '@/domain';

/** "12 / 12 / 10" */
export function formatRepsList(sets: Pick<WorkoutSet, 'reps'>[]): string {
  return sets.map((s) => s.reps ?? '—').join(' / ');
}

/** "35 kg × 12 / 12 / 10", or per-set weights when they differ. */
export function formatSetList(sets: Pick<WorkoutSet, 'weightKg' | 'reps'>[]): string {
  if (sets.length === 0) return '—';
  const weights = new Set(sets.map((s) => s.weightKg));
  if (weights.size === 1) {
    const w = sets[0]!.weightKg;
    return w === null || w === 0 ? `${formatRepsList(sets)} reps` : `${formatKg(w)} × ${formatRepsList(sets)}`;
  }
  return sets.map((s) => `${formatKg(s.weightKg, false)}×${s.reps ?? '—'}`).join('  ');
}
