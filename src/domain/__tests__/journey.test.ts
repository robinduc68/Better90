import { addDays, diffDays } from '../dates';
import { formatLiters } from '../format';
import { activeCheckpoint, checkpointsFor, journeyProgress, milestonesFor, weekRange } from '../journey';
import { journey } from './fixtures';

describe('journey progress', () => {
  it('computes day number, fraction and remaining days', () => {
    const p = journeyProgress(journey(), addDays('2026-09-01', 22));
    expect(p).toMatchObject({ dayNumber: 23, totalDays: 90, daysRemaining: 67 });
    expect(Math.round(p.fraction * 100)).toBe(26);
  });

  it('clamps before start and after end', () => {
    expect(journeyProgress(journey(), '2026-08-20').dayNumber).toBe(1);
    const after = journeyProgress(journey({ durationDays: 30 }), '2026-12-01');
    expect(after).toMatchObject({ dayNumber: 30, isFinished: true });
  });

  it('filters milestones and checkpoints by duration', () => {
    expect(milestonesFor(30)).toEqual([7, 15, 30]);
    expect(checkpointsFor(60)).toEqual([1, 15, 30, 45, 60]);
    expect(activeCheckpoint(90, 16)).toBe(15);
    expect(activeCheckpoint(90, 20)).toBeNull();
  });

  it('builds 7-day journey weeks and a short last week', () => {
    expect(weekRange(journey(), 1)).toEqual({ start: '2026-09-01', end: '2026-09-07' });
    const last = weekRange(journey(), 13);
    expect(diffDays(last.start, last.end)).toBe(5); // days 85–90
  });
});

describe('format', () => {
  it('formats liters compactly', () => {
    expect(formatLiters(1750)).toBe('1.75');
    expect(formatLiters(2000)).toBe('2.0');
    expect(formatLiters(2500)).toBe('2.5');
  });
});
