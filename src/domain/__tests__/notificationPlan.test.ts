import { planNotifications, waterTimes } from '../notificationPlan';
import type { NotificationPreferences } from '../types';
import { journey } from './fixtures';

const prefs: NotificationPreferences = {
  water: { enabled: true, start: 9 * 60, end: 20 * 60, perDay: 3 },
  workout: { enabled: true, time: 8 * 60 },
  habit: { enabled: true, time: 21 * 60 },
  journey: { enabled: true, time: 7 * 60 + 30 },
  rest: { enabled: true },
  updatedAt: '',
};

const today = { waterMl: 1200, score: 0.66, workoutCompletedToday: false, incompleteEveningHabits: ['Night skincare'] };

describe('waterTimes', () => {
  it('spreads reminders evenly across the window', () => {
    expect(waterTimes(540, 1200, 3)).toEqual([540, 870, 1200]);
    expect(waterTimes(540, 1200, 1)).toEqual([870]);
    expect(waterTimes(540, 1200, 0)).toEqual([]);
  });
});

describe('planNotifications', () => {
  const now = new Date(2026, 8, 5, 10, 0); // Sep 5, 10:00 local, day 5
  const plan = (overrides: Partial<Parameters<typeof planNotifications>[0]> = {}) =>
    planNotifications({ now, prefs, journey: journey(), today, scheduledWorkout: () => 'Back + Shoulders', daysAhead: 1, ...overrides });

  it('only schedules future reminders and uses calm copy with real totals', () => {
    const p = plan();
    expect(p.every((n) => n.at.getTime() > now.getTime())).toBe(true);
    const water = p.filter((n) => n.category === 'water');
    expect(water).toHaveLength(2); // 14:30 and 20:00 remain
    expect(water[0]!.body).toBe("You're at 1.2 / 2.5L today.");
    expect(p.find((n) => n.category === 'habit')?.title).toBe('Night skincare still open.');
    expect(p.some((n) => n.category === 'journey')).toBe(false); // 07:30 already passed
  });

  it('skips water reminders once today’s target is reached', () => {
    const p = plan({ today: { ...today, waterMl: 2600 } });
    expect(p.filter((n) => n.category === 'water')).toHaveLength(0);
  });

  it('respects disabled categories', () => {
    const p = plan({ prefs: { ...prefs, water: { ...prefs.water, enabled: false }, habit: { ...prefs.habit, enabled: false } } });
    expect(p.filter((n) => n.category === 'water' || n.category === 'habit')).toHaveLength(0);
  });

  it('includes the journey day and planned workout on following days', () => {
    const p = plan({ daysAhead: 2 });
    expect(p.find((n) => n.id === 'journey:2026-09-06')?.title).toBe('Day 6 is ready.');
    expect(p.find((n) => n.id === 'workout:2026-09-06')?.title).toBe('Workout planned today: Back + Shoulders.');
  });

  it('never schedules outside the journey', () => {
    const p = plan({ journey: journey({ startDate: '2026-06-01', durationDays: 90 }) });
    expect(p).toHaveLength(0);
  });
});
