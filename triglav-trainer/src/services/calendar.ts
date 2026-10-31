/**
 * iPhone calendar sync (works with a Google calendar added to the iPhone, which then syncs to
 * Google Calendar). Uses the expo-calendar legacy API, which is available in Expo Go.
 */
import * as Calendar from 'expo-calendar/legacy';
import { Platform } from 'react-native';
import { parseISO } from '../domain/dates';
import { planGerman, sessionEventTimes, type Interval } from '../domain/timeline';
import type { AppState, PlannedSession, WeekPlan } from '../domain/types';

export const calendarSupported = Platform.OS === 'ios' || Platform.OS === 'android';

export interface CalendarInfo {
  id: string;
  title: string;
  source: string;
}

export async function ensurePermission(): Promise<boolean> {
  if (!calendarSupported) return false;
  const cur = await Calendar.getCalendarPermissionsAsync();
  if (cur.granted) return true;
  const req = await Calendar.requestCalendarPermissionsAsync();
  return req.granted;
}

export async function writableCalendars(): Promise<CalendarInfo[]> {
  if (!(await ensurePermission())) return [];
  const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  return cals
    .filter((c) => c.allowsModifications)
    .map((c) => ({ id: c.id, title: c.title, source: c.source?.name ?? '' }));
}

function at(date: string, minutes: number): Date {
  const d = parseISO(date);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d;
}

export interface PendingEvent {
  key: string;
  calendar: 'training' | 'german';
  title: string;
  date: string;
  start: number;
  end: number;
  notes?: string;
  location?: string;
}

/** Events the app would like to have in the calendar for this week. */
export function desiredEvents(state: AppState, week: WeekPlan, externalByDate: Record<string, Interval[]> = {}): PendingEvent[] {
  const out: PendingEvent[] = [];
  const pace = state.settings.hikePaceMPerHour;
  for (const s of week.sessions) {
    if (s.status !== 'skipped' && !['rest', 'off'].includes(s.kind)) {
      const t = sessionEventTimes(s, pace);
      if (t) {
        out.push({
          key: `session:${s.date}`,
          calendar: 'training',
          title: `🏔️ ${s.title}`,
          date: s.date,
          start: t.start,
          end: t.end,
          notes: s.details.join('\n'),
          location: locationOf(s),
        });
      }
    }
    if (state.settings.germanEnabled) {
      const g = planGerman(s, externalByDate[s.date] ?? [], pace);
      for (const b of g.blocks) {
        const status = b.index === 1 ? state.german[s.date]?.b1 : state.german[s.date]?.b2;
        if (status === 'skipped') continue;
        out.push({ key: `german:${s.date}:${b.index}`, calendar: 'german', title: `🇩🇪 ${b.title}`, date: s.date, start: b.start, end: b.end });
      }
    }
  }
  return out;
}

function locationOf(s: PlannedSession): string | undefined {
  if (['pilates', 'bodypump', 'bootcamp', 'gym', 'gymLight', 'gymPilates'].includes(s.kind)) return '4P Fitnes klub, Stegne 11, Ljubljana';
  if (s.kind === 'ballet') return 'BTC Ljubljana';
  return undefined;
}

/** Busy intervals from the user's calendars (excluding events this app created). */
export async function externalBusy(state: AppState, dates: string[]): Promise<Record<string, Interval[]>> {
  const out: Record<string, Interval[]> = {};
  if (!calendarSupported || dates.length === 0) return out;
  const perm = await Calendar.getCalendarPermissionsAsync();
  if (!perm.granted) return out;
  const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const own = new Set(Object.values(state.calendarEvents));
  const sorted = [...dates].sort();
  const events = await Calendar.getEventsAsync(
    cals.map((c) => c.id),
    at(sorted[0], 0),
    at(sorted[sorted.length - 1], 24 * 60 - 1),
  );
  for (const e of events) {
    if (own.has(e.id) || e.allDay) continue;
    const s = new Date(e.startDate);
    const en = new Date(e.endDate);
    const date = `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, '0')}-${String(s.getDate()).padStart(2, '0')}`;
    (out[date] ??= []).push({ start: s.getHours() * 60 + s.getMinutes(), end: en.getHours() * 60 + en.getMinutes(), label: e.title, kind: 'external' });
  }
  return out;
}

/**
 * Create / update / delete calendar events so the calendar matches the plan.
 * Returns the new key → eventId map.
 */
export async function syncEvents(
  state: AppState,
  weekStart: string,
  events: PendingEvent[],
): Promise<Record<string, string>> {
  const map = { ...state.calendarEvents };
  const { trainingCalendarId, germanCalendarId } = state.settings;
  const wanted = new Set(events.map((e) => e.key));

  // delete events of this week that are no longer wanted
  const weekDates = new Set(state.weeks[weekStart]?.sessions.map((s) => s.date) ?? []);
  for (const [key, id] of Object.entries(map)) {
    const date = key.split(':')[1];
    if (weekDates.has(date) && !wanted.has(key)) {
      try {
        await Calendar.deleteEventAsync(id);
      } catch {
        // already deleted by the user
      }
      delete map[key];
    }
  }

  for (const e of events) {
    const calId = e.calendar === 'training' ? trainingCalendarId : germanCalendarId ?? trainingCalendarId;
    if (!calId) continue;
    const details = {
      title: e.title,
      startDate: at(e.date, e.start),
      endDate: at(e.date, e.end),
      notes: e.notes,
      location: e.location,
      timeZone: 'Europe/Ljubljana',
    };
    const existing = map[e.key];
    if (existing) {
      try {
        await Calendar.updateEventAsync(existing, details);
        continue;
      } catch {
        delete map[e.key]; // fall through and recreate
      }
    }
    map[e.key] = await Calendar.createEventAsync(calId, details);
  }
  return map;
}
