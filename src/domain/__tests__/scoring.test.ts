import { computeStreaks, dayState, DEFAULT_SCORING, scoreDay, type DayInputs, type DayScore } from '../scoring';
import { habit } from './fixtures';

const base: DayInputs = {
  date: '2026-09-05',
  proteinG: 0,
  proteinTargetG: 130,
  waterMl: 0,
  waterTargetMl: 2500,
  sleepMinutes: null,
  sleepTargetMin: 450,
  habits: [],
  habitLogs: [],
  workoutPlanned: false,
  workoutProgress: 0,
  workoutCompleted: false,
};

const day = (date: string, score: number): DayScore => ({ date, score, items: [], doneCount: 0, totalCount: 0 });

describe('scoreDay', () => {
  it('gives partial credit instead of all-or-nothing', () => {
    const s = scoreDay({ ...base, proteinG: 65, waterMl: 2500, sleepMinutes: 450 });
    // protein 0.5, water 1, sleep 1 → 2.5 / 3
    expect(s.score).toBeCloseTo(2.5 / 3);
    expect(s.doneCount).toBe(2);
    expect(s.totalCount).toBe(3);
  });

  it('only includes the workout when planned or done, and weights it higher', () => {
    expect(scoreDay(base).items.some((i) => i.kind === 'workout')).toBe(false);
    const planned = scoreDay({ ...base, workoutPlanned: true, workoutCompleted: true });
    const w = planned.items.find((i) => i.kind === 'workout');
    expect(w?.done).toBe(true);
    expect(w?.weight).toBe(DEFAULT_SCORING.weights.workout);
  });

  it('counts sleep within tolerance as met', () => {
    const s = scoreDay({ ...base, sleepMinutes: 440 });
    expect(s.items.find((i) => i.kind === 'sleep')?.done).toBe(true);
  });

  it('scores duration habits proportionally and ignores habits created later', () => {
    const english = habit({ id: 'en', kind: 'duration', target: 60 });
    const future = habit({ id: 'fut', createdAt: '2026-09-10T00:00:00.000Z' });
    const s = scoreDay({
      ...base,
      proteinTargetG: 0,
      waterTargetMl: 0,
      sleepTargetMin: 0,
      habits: [english, future],
      habitLogs: [{ id: 'l', habitId: 'en', date: base.date, value: 45, stepsDone: [], updatedAt: '' }],
    });
    expect(s.items).toHaveLength(1);
    expect(s.score).toBeCloseTo(0.75);
  });
});

describe('dayState', () => {
  const bounds = { start: '2026-09-01', end: '2026-11-29' };
  it('classifies days without shaming labels', () => {
    expect(dayState('2026-09-02', '2026-09-10', 0.9, bounds)).toBe('completed');
    expect(dayState('2026-09-02', '2026-09-10', 0.5, bounds)).toBe('partial');
    expect(dayState('2026-09-02', '2026-09-10', 0.1, bounds)).toBe('missed');
    expect(dayState('2026-09-10', '2026-09-10', 0.1, bounds)).toBe('today');
    expect(dayState('2026-09-11', '2026-09-10', null, bounds)).toBe('future');
    expect(dayState('2026-08-31', '2026-09-10', null, bounds)).toBe('outside');
  });
});

describe('computeStreaks', () => {
  it('does not break the streak for an unfinished today', () => {
    const scores = [day('2026-09-01', 0.9), day('2026-09-02', 0.7), day('2026-09-03', 0.2)];
    const s = computeStreaks(scores, '2026-09-03');
    expect(s.current).toBe(2);
    expect(s.longest).toBe(2);
  });

  it('a day below the threshold resets the current streak but not the longest', () => {
    const scores = [day('2026-09-01', 0.9), day('2026-09-02', 0.9), day('2026-09-03', 0.9), day('2026-09-04', 0.3), day('2026-09-05', 0.8)];
    const s = computeStreaks(scores, '2026-09-05');
    expect(s.current).toBe(1);
    expect(s.longest).toBe(3);
    expect(s.showedUpDays).toBe(4);
  });

  it('a 70% day still counts toward the streak', () => {
    const s = computeStreaks([day('2026-09-01', 0.7)], '2026-09-01');
    expect(s.current).toBe(1);
  });

  it('consistency averages elapsed days, excluding an unfinished today', () => {
    const s = computeStreaks([day('2026-09-01', 1), day('2026-09-02', 0.5), day('2026-09-03', 0.1)], '2026-09-03');
    expect(s.consistency).toBeCloseTo(0.75);
  });
});
