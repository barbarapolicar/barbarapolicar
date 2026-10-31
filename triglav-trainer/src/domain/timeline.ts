/**
 * Daily timeline: when is the user busy? Used for calendar event times and for fitting
 * the two German study blocks around workouts, the commute and ballet.
 *
 * Times are minutes since midnight.
 */
import { destination } from './data';
import type { PlannedSession, Place } from './types';

export interface Interval {
  start: number;
  end: number;
  label: string;
  /** Part of the planned session itself (goes to the calendar), vs travel/commute. */
  kind: 'session' | 'travel' | 'external';
}

export const COMMUTE_MIN = 45;
export const WALK_4P_MIN = 10;
export const OFFICE_TO_BTC_MIN = 20;
export const WORK_END_OFFICE = 16 * 60 + 30; // 16:30
export const GERMAN_START_HOME = 15 * 60; // 15:00
export const GERMAN_START_WEEKEND = 9 * 60;
export const GERMAN_LAST_END = 20 * 60 + 30; // 20:30
export const BLOCK_MIN = 30;
export const BUFFER_MIN = 10;

export const hm = (h: number, m = 0) => h * 60 + m;

export function fmt(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export type DayType = 'office' | 'home' | 'weekend';

export function dayTypeOf(s: Pick<PlannedSession, 'day' | 'place'>): DayType {
  if (s.day >= 5) return 'weekend';
  return s.place === 'office' ? 'office' : 'home';
}

export function hikeDurationMin(gainM: number, paceMPerHour: number, driveMin: number): number {
  const ascent = (gainM / Math.max(paceMPerHour, 150)) * 60;
  const descent = (gainM / 500) * 60;
  return Math.round(ascent + descent + 45 + 2 * driveMin);
}

/**
 * Busy intervals for a day, derived from the planned session.
 * Office days include the commute home; ballet includes travel.
 */
export function dayTimeline(session: PlannedSession, hikePace = 300): Interval[] {
  const out: Interval[] = [];
  const type = dayTypeOf(session);
  const active = session.status !== 'skipped';
  const k = session.kind;

  if (type === 'office') {
    let leaveLj = WORK_END_OFFICE;
    if (active && (k === 'pilates' || k === 'bodypump' || k === 'bootcamp')) {
      out.push({ start: hm(17) - WALK_4P_MIN, end: hm(17), label: 'Walk to 4P', kind: 'travel' });
      out.push({ start: hm(17), end: hm(18), label: session.title, kind: 'session' });
      out.push({ start: hm(18), end: hm(18) + WALK_4P_MIN, label: 'Walk back', kind: 'travel' });
      leaveLj = hm(18) + WALK_4P_MIN;
    } else if (active && k === 'gymPilates') {
      out.push({ start: hm(16) - WALK_4P_MIN, end: hm(16), label: 'Walk to 4P', kind: 'travel' });
      out.push({ start: hm(16), end: hm(18), label: session.title, kind: 'session' });
      out.push({ start: hm(18), end: hm(18) + WALK_4P_MIN, label: 'Walk back', kind: 'travel' });
      leaveLj = hm(18) + WALK_4P_MIN;
    } else if (active && (k === 'gym' || k === 'gymLight')) {
      out.push({ start: hm(16) - WALK_4P_MIN, end: hm(16), label: 'Walk to 4P', kind: 'travel' });
      out.push({ start: hm(16), end: hm(17), label: session.title, kind: 'session' });
      out.push({ start: hm(17), end: hm(17) + WALK_4P_MIN, label: 'Walk back', kind: 'travel' });
      leaveLj = hm(17) + WALK_4P_MIN;
    } else if (active && k === 'ballet') {
      out.push({ start: hm(17, 30) - OFFICE_TO_BTC_MIN, end: hm(17, 30), label: 'To BTC', kind: 'travel' });
      out.push({ start: hm(17, 30), end: hm(18, 30), label: 'Ballet (BTC)', kind: 'session' });
      leaveLj = hm(18, 30);
    }
    const home = leaveLj + COMMUTE_MIN;
    out.push({ start: leaveLj, end: home, label: 'Drive home', kind: 'travel' });
    if (active && (k === 'run' || k === 'walk')) {
      out.push({ start: home + 15, end: home + 15 + 45, label: session.title, kind: 'session' });
    }
    return out;
  }

  if (!active) return out;

  if (type === 'home') {
    if (k === 'ballet') {
      out.push({ start: hm(17, 30) - COMMUTE_MIN, end: hm(17, 30), label: 'Drive to BTC', kind: 'travel' });
      out.push({ start: hm(17, 30), end: hm(18, 30), label: 'Ballet (BTC)', kind: 'session' });
      out.push({ start: hm(18, 30), end: hm(18, 30) + COMMUTE_MIN, label: 'Drive home', kind: 'travel' });
    } else if (k === 'run' || k === 'walk') {
      out.push({ start: hm(16), end: hm(16, 45), label: session.title, kind: 'session' });
    }
    return out;
  }

  // weekend
  if (k === 'hike') {
    const dest = destination(session.hikeDestId);
    const dur = hikeDurationMin(session.targetGainM ?? dest?.gainM ?? 500, hikePace, dest?.driveMin ?? 20);
    out.push({ start: hm(8), end: hm(8) + dur, label: session.title, kind: 'session' });
  } else if (k === 'run') {
    out.push({ start: hm(10), end: hm(10, 45), label: session.title, kind: 'session' });
  } else if (k === 'walk') {
    out.push({ start: hm(11), end: hm(11, 45), label: session.title, kind: 'session' });
  } else if (k === 'triglav') {
    out.push({ start: hm(3, 30), end: hm(19), label: session.title, kind: 'session' });
  }
  return out;
}

export interface GermanBlock {
  index: 1 | 2;
  start: number;
  end: number;
  title: string;
}

export interface GermanPlan {
  blocks: GermanBlock[];
  warning?: string;
}

function windowStart(type: DayType): number {
  if (type === 'office') return WORK_END_OFFICE;
  if (type === 'home') return GERMAN_START_HOME;
  return GERMAN_START_WEEKEND;
}

/** Free gaps inside [from, to] given busy intervals (with buffer around sessions/external events). */
export function freeGaps(busy: Interval[], from: number, to: number): [number, number][] {
  const padded = busy
    .map((b) => ({
      start: b.kind === 'travel' ? b.start : b.start - BUFFER_MIN,
      end: b.kind === 'travel' ? b.end : b.end + BUFFER_MIN,
    }))
    .sort((a, b) => a.start - b.start);
  const gaps: [number, number][] = [];
  let cur = from;
  for (const b of padded) {
    if (b.end <= cur) continue;
    if (b.start > cur) gaps.push([cur, Math.min(b.start, to)]);
    cur = Math.max(cur, b.end);
    if (cur >= to) break;
  }
  if (cur < to) gaps.push([cur, to]);
  return gaps.filter(([a, b]) => b - a > 0);
}

const roundUp5 = (m: number) => Math.ceil(m / 5) * 5;

/**
 * Two 30-min German blocks: block 1 textbook, block 2 Duolingo (≥ 5 min) + review.
 * Prefers ~60+ min between blocks; falls back to back-to-back with a 10 min break.
 */
export function planGerman(session: PlannedSession, external: Interval[] = [], hikePace = 300): GermanPlan {
  const type = dayTypeOf(session);
  const busy = [...dayTimeline(session, hikePace), ...external];
  const gaps = freeGaps(busy, windowStart(type), GERMAN_LAST_END);

  const slots: number[] = []; // candidate start times
  for (const [a, b] of gaps) {
    for (let t = roundUp5(a); t + BLOCK_MIN <= b; t += 5) slots.push(t);
  }
  if (slots.length === 0) {
    return { blocks: [], warning: 'No free 30-min slot before 20:30 today. Skip German or move something.' };
  }
  const first = slots[0];
  const fits = (t: number) => gaps.some(([a, b]) => t >= a && t + BLOCK_MIN <= b);
  const spaced = slots.find((t) => t >= first + BLOCK_MIN + 60 && fits(t));
  const close = slots.find((t) => t >= first + BLOCK_MIN + BUFFER_MIN && fits(t));
  const second = spaced ?? close;

  const blocks: GermanBlock[] = [{ index: 1, start: first, end: first + BLOCK_MIN, title: 'German: textbook' }];
  if (second !== undefined) {
    blocks.push({ index: 2, start: second, end: second + BLOCK_MIN, title: 'German: Duolingo + review' });
    return { blocks };
  }
  blocks[0].title = 'German: textbook + Duolingo (5 min)';
  return { blocks, warning: 'Only one 30-min block fits today.' };
}

/** Calendar start/end for a session (null when the session has no fixed time). */
export function sessionEventTimes(session: PlannedSession, hikePace = 300): { start: number; end: number } | null {
  const s = dayTimeline(session, hikePace).find((i) => i.kind === 'session');
  return s ? { start: s.start, end: s.end } : null;
}

export function placeLabel(p: Place): string {
  return p === 'office' ? 'Office day (Ljubljana)' : 'Home day (Radovljica)';
}
