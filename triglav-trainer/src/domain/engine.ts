/**
 * App-level logic on top of the planner: builds plan inputs from history, re-plans after
 * skips and check-ins, and applies the adaptive rules (run progression, knee caution,
 * Boot Camp trial, ballet, sick/travel mode). All functions are pure: state in, state out.
 */
import {
  BOOTCAMP_TRIAL_END,
  BOOTCAMP_TRIAL_START,
  DEFAULT_GOAL_DATE,
  PROGRAM_START,
  RUN_LEVELS,
  phaseFor,
} from './data';
import { addDays, dayIdx, daysBetween, inRange, weekStartOf } from './dates';
import { isHard, planWeekSessions, sessionCount, signatureOf, type DayRestriction, type PlanInput } from './planner';
import type {
  AppState,
  DayIdx,
  LogEntry,
  ModePeriod,
  PlannedSession,
  SkipReason,
  TravelOption,
  WeekConfig,
  WeekPlan,
} from './types';

export function defaultState(): AppState {
  return {
    version: 1,
    settings: {
      homeDaysMode: 'weekly',
      fixedHomeDays: [],
      goalDate: DEFAULT_GOAL_DATE,
      passsportUrl: '',
      fuelReminders: true,
      batterySaver: false,
      germanEnabled: true,
      trainingCalendarId: null,
      germanCalendarId: null,
      hikePaceMPerHour: 300,
    },
    weeks: {},
    log: [],
    progress: { bootcamp: { status: 'notStarted', soreCount: 0, skipNext: false, askedKeep: false } },
    modes: [],
    german: {},
    calendarEvents: {},
  };
}

export function weekNumber(weekStart: string): number {
  return Math.max(1, Math.floor(daysBetween(PROGRAM_START, weekStart) / 7) + 1);
}

export function defaultWeekConfig(state: AppState, weekStart: string): WeekConfig {
  return {
    weekStart,
    singingDay: null,
    homeDays: state.settings.homeDaysMode === 'fixed' ? [...state.settings.fixedHomeDays] : [],
    blocked: [],
  };
}

function sortedWeeks(state: AppState): WeekPlan[] {
  return Object.values(state.weeks).sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

function logsBetween(state: AppState, start: string, end: string): LogEntry[] {
  return state.log.filter((l) => l.date >= start && l.date <= end);
}

/** Two "sore" knee check-ins in a row → caution. */
export function kneeCaution(state: AppState, before: string): boolean {
  const recent = state.log
    .filter((l) => l.date < before)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-2);
  return recent.length === 2 && recent.every((l) => l.knee === 'sore');
}

/** Phase 1 run level: advance when last week's runs were done without effort ≥ 8 or a sore knee. */
export function nextRunLevel(state: AppState, weekStart: string): number {
  const prevStart = addDays(weekStart, -7);
  const prev = state.weeks[prevStart];
  if (!prev) {
    const earlier = sortedWeeks(state).filter((w) => w.weekStart < weekStart).pop();
    return earlier ? earlier.runLevel : 0;
  }
  const prevLogs = logsBetween(state, prevStart, addDays(prevStart, 6));
  const runsPlanned = prev.sessions.filter((s) => s.kind === 'run');
  const runsDone = runsPlanned.filter((s) => s.status === 'done').length;
  const hard = prevLogs.some((l) => l.effort >= 8 || l.knee === 'sore');
  const sickLong = state.modes.some(
    (m) => m.type === 'sick' && daysBetween(m.start, m.end ?? addDays(weekStart, -1)) >= 7 && inRange(prevStart, addDays(m.start, -7), m.end),
  );
  if (runsPlanned.length > 0 && runsDone >= Math.min(runsPlanned.length, 1) && !hard && !sickLong) {
    return Math.min(prev.runLevel + 1, RUN_LEVELS.length - 1);
  }
  return prev.runLevel;
}

/** Every 4th week is easy; a naturally short week also counts as the easy week. */
function easyDue(state: AppState, weekStart: string): boolean {
  const prior = sortedWeeks(state).filter((w) => w.weekStart < weekStart);
  let sinceEasy = 0;
  for (let i = prior.length - 1; i >= 0; i--) {
    if (prior[i].isEasy) break;
    sinceEasy++;
  }
  if (prior.length === 0) return false;
  return sinceEasy >= 3;
}

function bootcampAllowedFor(state: AppState, weekStart: string, wk: number): boolean {
  if (weekStart < BOOTCAMP_TRIAL_START) return false;
  const b = state.progress.bootcamp;
  if (b.status === 'paused' || b.status === 'dropped' || b.skipNext) return false;
  if (b.status === 'kept') return true;
  // trial (or not started yet): about every other week
  return wk % 2 === 1;
}

export function restrictionsFor(state: AppState, weekStart: string): Partial<Record<DayIdx, DayRestriction>> {
  const out: Partial<Record<DayIdx, DayRestriction>> = {};
  for (let d = 0 as DayIdx; d < 7; d = (d + 1) as DayIdx) {
    const date = addDays(weekStart, d);
    for (const m of state.modes) {
      if (m.type === 'sick') {
        if (inRange(date, m.start, m.end)) out[d] = { off: 'sick' };
        else if (m.end && date > m.end && daysBetween(m.end, date) <= 2) out[d] = { ...out[d], lightOnly: true };
      } else if (m.type === 'travel' && inRange(date, m.start, m.end)) {
        out[d] = m.travelOption === 'nothing' ? { off: 'travel' } : { travel: m.travelOption };
      }
    }
  }
  return out;
}

function returnedFromIllnessThisWeek(state: AppState, weekStart: string): boolean {
  return state.modes.some((m) => m.type === 'sick' && m.end && m.end >= addDays(weekStart, -7) && m.end <= addDays(weekStart, 6));
}

export function buildPlanInput(
  state: AppState,
  config: WeekConfig,
  locked: Partial<Record<DayIdx, PlannedSession>> = {},
  overrides: Partial<PlanInput> = {},
): PlanInput {
  const weekStart = config.weekStart;
  const wk = weekNumber(weekStart);
  const prevWeek = state.weeks[addDays(weekStart, -7)];
  const prevSunday = prevWeek?.sessions[6];
  const lastHike = state.log
    .filter((l) => l.kind === 'hike' && l.date < weekStart && l.destinationId)
    .sort((a, b) => a.date.localeCompare(b.date))
    .pop();
  const existing = state.weeks[weekStart];
  const prevPilates = prevWeek?.sessions.find((s) => s.kind === 'pilates' || s.kind === 'gymPilates');
  const balletLog = state.log.find((l) => l.kind === 'ballet' && l.date === addDays(weekStart, 2));

  return {
    config,
    phase: phaseFor(weekStart).id,
    isEasy: existing?.isEasy ?? (easyDue(state, weekStart) || returnedFromIllnessThisWeek(state, weekStart)),
    bootcampAllowed: bootcampAllowedFor(state, weekStart, wk),
    kneeCaution: kneeCaution(state, weekStart),
    prevSundayHard: prevSunday ? isHard(prevSunday) : false,
    prevSignature: prevWeek?.signature,
    prevPilatesDay: prevPilates?.day,
    locked,
    restrictions: restrictionsFor(state, weekStart),
    balletHard: balletLog ? balletLog.effort >= 7 || balletLog.knee === 'sore' : false,
    goalDate: state.settings.goalDate,
    runLevel: existing?.runLevel ?? nextRunLevel(state, weekStart),
    lastHikeDest: lastHike?.destinationId,
    weekNumber: wk,
    ...overrides,
  };
}

/** Generate (or fully regenerate) a week. */
export function generateWeek(state: AppState, config: WeekConfig, today: string): AppState {
  const weekStart = config.weekStart;
  const existing = state.weeks[weekStart];
  const locked: Partial<Record<DayIdx, PlannedSession>> = {};
  if (existing) {
    existing.sessions.forEach((s) => {
      if (s.date < today || s.status !== 'planned') locked[s.day] = s;
    });
  } else {
    // A week set up mid-week: days already gone are not planned.
    for (let d = 0 as DayIdx; d < 7; d = (d + 1) as DayIdx) {
      const date = addDays(weekStart, d);
      if (date >= today) break;
      locked[d] = {
        id: `s-${date}-rest`, date, day: d, kind: 'rest', title: 'Before the plan started', details: [],
        intensity: 'none', place: d >= 5 || config.homeDays.includes(d) ? 'home' : 'office', status: 'planned',
      };
    }
  }
  const input = buildPlanInput(state, config, locked);
  let sessions = planWeekSessions(input);
  let isEasy = input.isEasy;
  if (!isEasy && !existing && sessionCount(sessions) <= 3 && input.phase !== 4) isEasy = true; // short week = easy week

  const bootcampWeek = sessions.some((s) => s.kind === 'bootcamp');
  let progress = state.progress;
  if (bootcampWeek && progress.bootcamp.status === 'notStarted') {
    progress = { ...progress, bootcamp: { ...progress.bootcamp, status: 'trial' } };
  }
  if (progress.bootcamp.skipNext && weekStart >= BOOTCAMP_TRIAL_START && !existing) {
    progress = { ...progress, bootcamp: { ...progress.bootcamp, skipNext: false } };
  }

  const plan: WeekPlan = {
    weekStart,
    config,
    sessions,
    phase: input.phase,
    isEasy,
    bootcampWeek,
    kneeCaution: input.kneeCaution,
    signature: signatureOf(sessions.map((s) => s.kind)),
    runLevel: input.runLevel,
    generatedAt: new Date().toISOString(),
  };
  return { ...state, progress, weeks: { ...state.weeks, [weekStart]: plan } };
}

/** Re-plan the rest of a week (from today), keeping past/done/skipped days. */
export function replanWeek(state: AppState, weekStart: string, today: string, config?: WeekConfig): AppState {
  const existing = state.weeks[weekStart];
  const cfg = config ?? existing?.config ?? defaultWeekConfig(state, weekStart);
  return generateWeek(state, cfg, today);
}

export function findSession(state: AppState, id: string): PlannedSession | undefined {
  for (const w of Object.values(state.weeks)) {
    const s = w.sessions.find((x) => x.id === id);
    if (s) return s;
  }
  return undefined;
}

function updateSession(state: AppState, id: string, patch: Partial<PlannedSession>): AppState {
  const weekStart = weekStartOf(findSession(state, id)?.date ?? '');
  const w = state.weeks[weekStart];
  if (!w) return state;
  const sessions = w.sessions.map((s) => (s.id === id ? { ...s, ...patch } : s));
  return { ...state, weeks: { ...state.weeks, [weekStart]: { ...w, sessions } } };
}

/** Skip a session; the rest of the week is re-planned so it can move to a free slot if the rules allow. */
export function skipSession(state: AppState, id: string, reason: SkipReason, today: string): AppState {
  const s = findSession(state, id);
  if (!s) return state;
  let next = updateSession(state, id, { status: 'skipped', skipReason: reason });
  return replanWeek(next, weekStartOf(s.date), today);
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Record a check-in (planned session done, or a manual entry such as an own mountain day). */
export function checkIn(state: AppState, entry: Omit<LogEntry, 'id' | 'load'>, today: string): AppState {
  const log: LogEntry = { ...entry, id: newId('log'), load: Math.round(entry.effort * entry.durationMin) };
  let next: AppState = { ...state, log: [...state.log, log] };
  const weekStart = weekStartOf(entry.date);

  if (entry.plannedId) {
    next = updateSession(next, entry.plannedId, { status: 'done', logId: log.id });
  } else if (entry.kind === 'hike') {
    // Own mountain day: replaces the planned hike (or run) of that week.
    const w = next.weeks[weekStart];
    const target =
      w?.sessions.find((s) => s.kind === 'hike' && s.status === 'planned') ??
      w?.sessions.find((s) => s.kind === 'run' && s.status === 'planned' && s.date >= entry.date);
    if (target) next = updateSession(next, target.id, { status: 'skipped', skipReason: 'mountains' });
    const sameDay = w?.sessions.find((s) => s.date === entry.date && s.status === 'planned');
    if (sameDay) next = updateSession(next, sameDay.id, { status: 'skipped', skipReason: 'mountains' });
  }

  // Boot Camp knee rule
  if (entry.kind === 'bootcamp') {
    const b = next.progress.bootcamp;
    if (entry.knee === 'sore') {
      const soreCount = b.soreCount + 1;
      next = {
        ...next,
        progress: { ...next.progress, bootcamp: { ...b, soreCount, skipNext: soreCount === 1, status: soreCount >= 2 ? 'paused' : b.status } },
      };
    }
  }

  // Update hiking pace estimate from tracked hikes
  if (entry.kind === 'hike' && entry.mPerHour && entry.mPerHour > 100) {
    const pace = Math.round(next.settings.hikePaceMPerHour * 0.6 + entry.mPerHour * 0.4);
    next = { ...next, settings: { ...next.settings, hikePaceMPerHour: pace } };
  }

  // Re-plan the rest of the week: ballet hard → light Thursday; a big mountain day → easy day after.
  if (next.weeks[weekStart]) {
    next = replanWeek(next, weekStart, today);
    if (entry.kind === 'hike' && (entry.elevationGainM ?? 0) >= 800) {
      const dayAfter = addDays(entry.date, 1);
      const w = next.weeks[weekStartOf(dayAfter)];
      const s = w?.sessions.find((x) => x.date === dayAfter && x.status === 'planned' && isHard(x));
      if (s) {
        next = updateSession(next, s.id, { status: 'skipped', skipReason: 'tired' });
        next = replanWeek(next, weekStartOf(dayAfter), today);
      }
    }
  }
  return next;
}

export function bootcampNeedsDecision(state: AppState, today: string): boolean {
  const b = state.progress.bootcamp;
  return today > BOOTCAMP_TRIAL_END && (b.status === 'trial' || b.status === 'paused') && !b.askedKeep;
}

export function decideBootcamp(state: AppState, keep: boolean): AppState {
  const b = state.progress.bootcamp;
  return { ...state, progress: { ...state.progress, bootcamp: { ...b, askedKeep: true, status: keep ? 'kept' : 'dropped', soreCount: 0 } } };
}

/** Sick / travel mode */
export function startSick(state: AppState, today: string): AppState {
  if (state.modes.some((m) => m.type === 'sick' && m.end === null)) return state;
  const mode: ModePeriod = { id: newId('mode'), type: 'sick', start: today, end: null };
  const next = { ...state, modes: [...state.modes, mode] };
  return replanWeek(next, weekStartOf(today), today);
}

export function endSick(state: AppState, today: string): AppState {
  const modes = state.modes.map((m) => (m.type === 'sick' && m.end === null ? { ...m, end: addDays(today, -1) } : m));
  let next = { ...state, modes };
  const ws = weekStartOf(today);
  if (next.weeks[ws]) next = { ...next, weeks: { ...next.weeks, [ws]: { ...next.weeks[ws], isEasy: true } } };
  next = replanWeek(next, ws, today);
  const nextWs = addDays(ws, 7);
  if (next.weeks[nextWs]) next = replanWeek(next, nextWs, today);
  return next;
}

export function addTravel(state: AppState, start: string, end: string, option: TravelOption, today: string): AppState {
  const mode: ModePeriod = { id: newId('mode'), type: 'travel', start, end, travelOption: option };
  let next = { ...state, modes: [...state.modes, mode] };
  for (let ws = weekStartOf(start); ws <= end; ws = addDays(ws, 7)) {
    if (next.weeks[ws]) next = replanWeek(next, ws, today);
  }
  return next;
}

export function removeMode(state: AppState, id: string, today: string): AppState {
  const m = state.modes.find((x) => x.id === id);
  let next = { ...state, modes: state.modes.filter((x) => x.id !== id) };
  if (m) {
    for (let ws = weekStartOf(m.start); ws <= (m.end ?? today); ws = addDays(ws, 7)) {
      if (next.weeks[ws]) next = replanWeek(next, ws, today);
    }
  }
  return next;
}

export function activeSick(state: AppState): ModePeriod | undefined {
  return state.modes.find((m) => m.type === 'sick' && m.end === null);
}

/** Weekly load = Σ effort × minutes. */
export function weeklyLoads(state: AppState, weeks = 8, today: string): { weekStart: string; load: number }[] {
  const out: { weekStart: string; load: number }[] = [];
  const cur = weekStartOf(today);
  for (let i = weeks - 1; i >= 0; i--) {
    const ws = addDays(cur, -7 * i);
    const load = logsBetween(state, ws, addDays(ws, 6)).reduce((a, l) => a + l.load, 0);
    out.push({ weekStart: ws, load });
  }
  return out;
}

export function loadJumpWarning(loads: { load: number }[]): boolean {
  if (loads.length < 2) return false;
  const [prev, cur] = loads.slice(-2);
  return prev.load > 0 && cur.load > prev.load * 1.3;
}

/** Streak: consecutive weeks (up to last week, plus this week if already ≥ 2) with ≥ 2 completed sessions. */
export function trainingStreak(state: AppState, today: string): number {
  const count = (ws: string) =>
    logsBetween(state, ws, addDays(ws, 6)).filter((l) => l.kind !== 'ballet' && l.kind !== 'walk').length;
  let ws = weekStartOf(today);
  let streak = count(ws) >= 2 ? 1 : 0;
  ws = addDays(ws, -7);
  while (count(ws) >= 2) {
    streak++;
    ws = addDays(ws, -7);
  }
  return streak;
}

export function germanStreak(state: AppState, today: string): number {
  const ok = (d: string) => {
    const g = state.german[d];
    return !!g && (g.b1 === 'done' || g.b2 === 'done');
  };
  let d = ok(today) ? today : addDays(today, -1);
  let n = 0;
  while (ok(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export function weekNeedsSetup(state: AppState, weekStart: string): boolean {
  return !state.weeks[weekStart];
}

/** Monday of the week the Sunday prompt should configure: next week on Sat/Sun, else the current one. */
export function promptWeekStart(state: AppState, today: string): string | null {
  const cur = weekStartOf(today);
  if (!state.weeks[cur]) return cur;
  const d = dayIdx(today);
  const next = addDays(cur, 7);
  if (d >= 5 && !state.weeks[next]) return next;
  return null;
}
