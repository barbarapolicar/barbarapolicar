import type { DayIdx } from './types';

/** All dates are local calendar dates as 'YYYY-MM-DD' strings. */

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0); // noon avoids DST edge cases
}

export function todayISO(now: Date = new Date()): string {
  return toISO(now);
}

export function addDays(s: string, n: number): string {
  const d = parseISO(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

/** 0 = Monday ... 6 = Sunday */
export function dayIdx(s: string): DayIdx {
  const js = parseISO(s).getDay(); // 0 = Sunday
  return ((js + 6) % 7) as DayIdx;
}

export function weekStartOf(s: string): string {
  return addDays(s, -dayIdx(s));
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86400000);
}

export function month(s: string): number {
  return Number(s.slice(5, 7));
}

export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export const DAY_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export function formatDate(s: string): string {
  const d = parseISO(s);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${DAY_SHORT[dayIdx(s)]} ${d.getDate()} ${months[d.getMonth()]}`;
}

export function inRange(s: string, start: string, end: string | null): boolean {
  return s >= start && (end === null || s <= end);
}
