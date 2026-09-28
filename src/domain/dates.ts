import type { ClockTime, ISODate } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISODate(now);
}

/** Parses `YYYY-MM-DD` as a local date at noon (avoids DST edge cases). */
export function fromISODate(date: ISODate): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

export function addDays(date: ISODate, days: number): ISODate {
  const d = fromISODate(date);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Whole calendar days from `a` to `b` (b − a). */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((fromISODate(b).getTime() - fromISODate(a).getTime()) / 86_400_000);
}

export function weekday(date: ISODate): number {
  return fromISODate(date).getDay();
}

export function dateRange(start: ISODate, endInclusive: ISODate): ISODate[] {
  const out: ISODate[] = [];
  for (let d = start; d <= endInclusive; d = addDays(d, 1)) out.push(d);
  return out;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_SHORT = WEEKDAYS;
export const WEEKDAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** "Sep 15" */
export function formatShortDate(date: ISODate): string {
  const d = fromISODate(date);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** "Mon, Sep 15" */
export function formatDayDate(date: ISODate): string {
  const d = fromISODate(date);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function formatClock(time: ClockTime): string {
  const h = Math.floor(time / 60) % 24;
  const m = time % 60;
  return `${pad(h)}:${pad(m)}`;
}

export function minutesOfDay(d: Date): ClockTime {
  return d.getHours() * 60 + d.getMinutes();
}

/** Builds a Date for `date` at a clock time. */
export function atClock(date: ISODate, time: ClockTime): Date {
  const d = fromISODate(date);
  d.setHours(Math.floor(time / 60), time % 60, 0, 0);
  return d;
}

export function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 5) return 'Good evening';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
