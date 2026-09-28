import { weekday } from './dates';
import type { Habit, HabitLog, ISODate, RoutineStep } from './types';

/** Routine tags active on a date, e.g. ["BHA NIGHT"]. */
export function activeRoutineTags(habit: Habit, date: ISODate): string[] {
  const wd = weekday(date);
  return habit.routineTags.filter((t) => t.weekdays.includes(wd)).map((t) => t.tag);
}

/** Steps shown on a date: untagged steps plus steps whose tag is active. */
export function applicableSteps(habit: Habit, date: ISODate): RoutineStep[] {
  const tags = activeRoutineTags(habit, date);
  return habit.routineSteps.filter((s) => s.tag === null || tags.includes(s.tag));
}

export function habitLogFor(logs: HabitLog[], habitId: string, date: ISODate): HabitLog | undefined {
  return logs.find((l) => l.habitId === habitId && l.date === date);
}

export function isHabitDone(habit: Habit, log: HabitLog | undefined): boolean {
  if (!log) return false;
  if (habit.kind === 'boolean') return log.value >= 1;
  return log.value >= (habit.target ?? 1);
}

export function habitValueLabel(habit: Habit, log: HabitLog | undefined): string {
  const value = log?.value ?? 0;
  if (habit.kind === 'boolean') return value >= 1 ? 'Done' : 'Not done';
  const unit = habit.kind === 'duration' ? 'min' : (habit.unit ?? '');
  const fmt = (n: number) => n.toLocaleString('en-US');
  return `${fmt(value)} / ${fmt(habit.target ?? 0)}${unit ? ` ${unit}` : ''}`;
}
