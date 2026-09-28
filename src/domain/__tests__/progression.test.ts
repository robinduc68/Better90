import { analyzeExercise, strengthGain, suggestionFor, summarizeSession, topSet } from '../progression';
import { buildSessionExercise, exerciseVolume, lastPerformance, plannedWorkoutFor } from '../workout';
import { exercise, id, session } from './fixtures';

describe('volume', () => {
  it('sums weight × reps over completed sets only', () => {
    const ex = exercise('lat', [
      [35, 12],
      [35, 10],
      [35, 8, false],
    ]);
    expect(exerciseVolume(ex)).toBe(35 * 12 + 35 * 10);
  });
});

describe('suggestionFor', () => {
  it('suggests a small increase only when every target set is reached at one weight', () => {
    const hit = exercise('lat', [
      [35, 12],
      [35, 12],
      [35, 12],
    ], 12);
    expect(suggestionFor(hit, 'cable')).toMatchObject({ kind: 'increase_weight', nextWeightKg: 37.5 });
    expect(suggestionFor(hit, 'dumbbell')).toMatchObject({ nextWeightKg: 37 });

    const missed = exercise('lat', [
      [35, 12],
      [35, 11],
      [35, 10],
    ], 12);
    expect(suggestionFor(missed, 'cable')).toBeNull();
  });
});

describe('analyzeExercise', () => {
  const s1 = session('2026-09-01', [exercise('lat', [[30, 12], [30, 12], [30, 10]], 12)]);
  const s2 = session('2026-09-08', [exercise('lat', [[32.5, 12], [32.5, 11], [32.5, 10]], 12)]);

  it('reports last session, best weight and a weight PR with delta', () => {
    const current = exercise('lat', [[35, 12], [35, 10]], 12);
    const insight = analyzeExercise([s1, s2], current, 'current', 'cable');
    expect(insight.previousDate).toBe('2026-09-08');
    expect(insight.previousSets.map((s) => s.reps)).toEqual([12, 11, 10]);
    expect(insight.previousBestWeight).toBe(32.5);
    expect(insight.isWeightPR).toBe(true);
    expect(insight.weightDeltaKg).toBe(2.5);
  });

  it('detects a rep PR at the same weight', () => {
    const current = exercise('lat', [[32.5, 13]], 12);
    const insight = analyzeExercise([s1, s2], current, 'current', 'cable');
    expect(insight.isWeightPR).toBe(false);
    expect(insight.isRepPR).toBe(true);
  });

  it('never changes the input session', () => {
    const current = exercise('lat', [[30, 12]], 12);
    const snapshot = JSON.stringify(current);
    analyzeExercise([s1, s2], current, 'current', 'cable');
    expect(JSON.stringify(current)).toBe(snapshot);
  });
});

describe('prefill', () => {
  it('prefills weight and reps from the last performance', () => {
    const past = session('2026-09-01', [exercise('lat', [[35, 12], [35, 12], [35, 10]])]);
    const ex = buildSessionExercise('lat', 3, 12, [past], id);
    expect(ex.sets.map((s) => [s.weightKg, s.reps])).toEqual([
      [35, 12],
      [35, 12],
      [35, 10],
    ]);
    expect(ex.sets.every((s) => s.completedAt === null)).toBe(true);
  });

  it('falls back to target reps with no history', () => {
    const ex = buildSessionExercise('new', 2, 10, [], id);
    expect(ex.sets.map((s) => [s.weightKg, s.reps])).toEqual([
      [null, 10],
      [null, 10],
    ]);
  });

  it('ignores active sessions when looking up the last performance', () => {
    const active = session('2026-09-09', [exercise('lat', [[50, 5]])], { status: 'active' });
    expect(lastPerformance([active], 'lat')).toBeNull();
  });
});

describe('summaries', () => {
  it('compares volume with the previous session of the same template and lists PRs', () => {
    const prev = session('2026-09-01', [exercise('lat', [[30, 10], [30, 10]])]);
    const now = session('2026-09-08', [exercise('lat', [[32.5, 10], [32.5, 10]])]);
    const summary = summarizeSession(now, [prev, now], () => 'cable');
    expect(summary.volumeDeltaPct).toBeCloseTo(650 / 600 - 1);
    expect(summary.prs).toEqual([expect.objectContaining({ exerciseId: 'lat', kind: 'weight', deltaKg: 2.5 })]);
  });

  it('computes strength gain across sessions', () => {
    const a = session('2026-09-01', [exercise('bench', [[50, 8]])]);
    const b = session('2026-09-15', [exercise('bench', [[57.5, 8]])]);
    expect(strengthGain([a, b], 'bench')).toEqual({ first: 50, latest: 57.5, deltaKg: 7.5 });
    expect(topSet(b.exercises[0]!.sets)).toEqual({ weightKg: 57.5, reps: 8 });
  });
});

describe('plannedWorkoutFor', () => {
  const t = (tid: string, weekdays: number[]) => ({
    id: tid,
    name: tid,
    weekdays,
    exercises: [{ id: 'x', exerciseId: 'lat', targetSets: 3, targetReps: 10, restSeconds: null }],
    archivedAt: null,
    createdAt: '',
    updatedAt: '',
  });
  it('prefers the template scheduled on that weekday', () => {
    // 2026-09-07 is a Monday
    const p = plannedWorkoutFor([t('a', [2]), t('b', [1])], [], '2026-09-07');
    expect(p).toMatchObject({ scheduled: true, template: { id: 'b' } });
  });
  it('otherwise suggests the least recently done template, unscheduled', () => {
    const done = session('2026-09-01', [], { templateId: 'a' });
    const p = plannedWorkoutFor([t('a', []), t('b', [])], [done], '2026-09-07');
    expect(p).toMatchObject({ scheduled: false, template: { id: 'b' } });
  });
});
