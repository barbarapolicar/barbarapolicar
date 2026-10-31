/**
 * Week planner: a small rules engine.
 *
 * 1. For each day, list the session kinds that are allowed (time window, office/home day,
 *    4P timetable, Wednesday ballet, singing/blocked/sick/travel days, knee caution...).
 * 2. Search every combination that respects "never two hard days in a row" (incl. Sun → Mon).
 * 3. Score combinations against the phase targets, prefer runs on home days, and penalise
 *    repeating last week's layout. A seeded jitter adds variety between weeks.
 * 4. Fill in details (run distance, hike destination, gym workout, class times...).
 */
import {
  CLASS_SLOTS,
  DESTINATIONS,
  FLAT_ROUTES,
  GYM_WORKOUTS,
  PAMELA_REIF_NOTE,
  RUN_LEVELS,
  RUN_TYPES,
  TRIGLAV,
  destination,
  hikePoolFor,
  packKgFor,
  slotFor,
} from './data';
import { addDays, DAY_LONG, month } from './dates';
import type {
  DayIdx,
  GymWorkout,
  Intensity,
  PhaseId,
  PlannedSession,
  SessionKind,
  TravelOption,
  WeekConfig,
} from './types';

export interface DayRestriction {
  off?: string; // reason the day is unavailable
  lightOnly?: boolean; // e.g. first days back after illness
  travel?: TravelOption;
}

export interface PlanInput {
  config: WeekConfig;
  phase: PhaseId;
  isEasy: boolean;
  bootcampAllowed: boolean;
  kneeCaution: boolean;
  prevSundayHard: boolean;
  prevSignature?: string;
  prevPilatesDay?: DayIdx;
  /** Days already fixed (past, done, skipped). They are kept as-is and count toward targets. */
  locked: Partial<Record<DayIdx, PlannedSession>>;
  restrictions: Partial<Record<DayIdx, DayRestriction>>;
  /** Ballet that week was hard (effort ≥ 7) or the knee was sore → Thursday light only. */
  balletHard?: boolean;
  /** Ballet skipped in advance and Wednesday freed for training. */
  wednesdayFree?: boolean;
  goalDate: string;
  runLevel: number;
  lastHikeDest?: string;
  weekNumber: number; // used for rotation + seed
  seed?: number;
}

export const HARD_KINDS: SessionKind[] = ['run', 'hike', 'bodypump', 'bootcamp', 'gym', 'gymPilates', 'triglav'];
const LEG_STRENGTH: SessionKind[] = ['bodypump', 'bootcamp', 'gym', 'gymPilates'];

export function intensityOf(kind: SessionKind): Intensity {
  if (HARD_KINDS.includes(kind)) return 'H';
  if (kind === 'ballet') return 'M';
  if (kind === 'pilates' || kind === 'walk' || kind === 'gymLight') return 'L';
  return 'none';
}

export function isHard(s: Pick<PlannedSession, 'kind' | 'status'> | SessionKind): boolean {
  if (typeof s === 'string') return HARD_KINDS.includes(s);
  return s.status !== 'skipped' && HARD_KINDS.includes(s.kind);
}

/** How many sessions a kind counts as toward the weekly target (ballet and walks don't count; gym + Pilates counts as 2). */
function sessionWeight(kind: SessionKind): number {
  if (kind === 'gymPilates') return 2;
  return ['pilates', 'bodypump', 'bootcamp', 'gym', 'gymLight', 'run', 'hike'].includes(kind) ? 1 : 0;
}

export function placeOf(config: WeekConfig, day: DayIdx): 'office' | 'home' {
  if (day >= 5) return 'home';
  return config.homeDays.includes(day) ? 'home' : 'office';
}

/** Allowed kinds for a day, before the week-level search. */
export function dayOptions(input: PlanInput, day: DayIdx): SessionKind[] {
  const { config } = input;
  const date = addDays(config.weekStart, day);
  if (date === input.goalDate) return ['triglav'];
  const r = input.restrictions[day];
  if (r?.off) return ['off'];
  if (config.singingDay === day) return ['off'];
  if (config.blocked.includes(day)) return ['off'];
  const wedFree = input.wednesdayFree ?? (config.balletSkipped && config.wednesdayFree);
  if (day === 2 && !wedFree) return ['ballet'];

  const office = placeOf(config, day) === 'office';
  const weekend = day >= 5;
  let opts: SessionKind[] = ['rest'];

  if (r?.travel) {
    if (r.travel === 'running') opts.push('run', 'walk');
    if (r.travel === 'mountains') opts.push('hike', 'walk');
    return r.lightOnly ? opts.filter((k) => !isHard(k)) : opts;
  }

  if (weekend) opts.push('walk', 'run', 'hike');
  else {
    opts.push('run');
    if (office) {
      opts.push('gym', 'gymLight');
      if (CLASS_SLOTS.some((c) => c.kind === 'pilates' && c.day === day)) opts.push('pilates', 'gymPilates');
      if (CLASS_SLOTS.some((c) => c.kind === 'bodypump' && c.day === day)) opts.push('bodypump');
      if (input.bootcampAllowed && CLASS_SLOTS.some((c) => c.kind === 'bootcamp' && c.day === day)) opts.push('bootcamp');
    }
  }

  if (input.kneeCaution) opts = opts.filter((k) => k !== 'bootcamp' && k !== 'gym');
  if (input.phase === 1) opts = opts.filter((k) => k !== 'gymLight');
  if (r?.lightOnly || (day === 3 && input.balletHard)) opts = opts.filter((k) => !isHard(k));
  return opts;
}

interface Targets {
  strength: number;
  extraStrength: number; // allowed extra strength sessions with a small bonus
  pilates: number;
  run: number;
  hike: number;
  bootcamp: number;
  maxSessions: number;
  maxRuns: number;
}

export function targetsFor(input: PlanInput): Targets {
  const { phase, isEasy, bootcampAllowed, kneeCaution } = input;
  const weekEnd = addDays(input.config.weekStart, 6);
  const triglavWeek = input.goalDate >= input.config.weekStart && input.goalDate <= weekEnd;
  let t: Targets;
  if (triglavWeek) t = { strength: 0, extraStrength: 0, pilates: 1, run: 1, hike: 0, bootcamp: 0, maxSessions: 2, maxRuns: 1 };
  else if (phase === 1) {
    t = isEasy
      ? { strength: 1, extraStrength: 0, pilates: 1, run: 1, hike: 0, bootcamp: 0, maxSessions: 3, maxRuns: 1 }
      : { strength: 1, extraStrength: 0, pilates: 1, run: 2, hike: 0, bootcamp: 0, maxSessions: 4, maxRuns: 2 };
    // In Phase 1 a hike can stand in for the second run (every other week).
    if (!isEasy && input.weekNumber % 2 === 0) {
      t.run = 1;
      t.hike = 1;
    }
    if (bootcampAllowed && !isEasy) {
      t.bootcamp = 1;
      t.strength = 2;
      t.run = Math.max(1, t.run - 1); // Boot Camp replaces one run in Phase 1
      t.hike = 0;
    }
  } else if (phase === 4) {
    t = { strength: 1, extraStrength: 0, pilates: 1, run: 1, hike: 1, bootcamp: 0, maxSessions: 3, maxRuns: 1 };
  } else {
    t = isEasy
      ? { strength: 1, extraStrength: 0, pilates: 1, run: 1, hike: 0, bootcamp: 0, maxSessions: 3, maxRuns: 1 }
      : { strength: 1, extraStrength: 1, pilates: 1, run: 1, hike: 1, bootcamp: bootcampAllowed ? 1 : 0, maxSessions: 5, maxRuns: 2 };
  }
  if (kneeCaution) {
    t.bootcamp = 0;
    t.extraStrength = 0;
    t.maxRuns = 1;
    t.run = Math.min(t.run, 1);
  }
  return t;
}

/** Deterministic pseudo-random number in [0, 1) from a string. */
function hashRand(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

export function signatureOf(kinds: SessionKind[]): string {
  return kinds.map((k) => (k === 'off' ? 'rest' : k)).join(',');
}

function scoreWeek(kinds: SessionKind[], input: PlanInput, t: Targets): number {
  // Skipped days don't count, except when replaced by an own mountain day.
  const lockedSkipped = (d: number) => {
    const l = input.locked[d as DayIdx];
    return l?.status === 'skipped' && l.skipReason !== 'mountains';
  };
  const active = kinds.filter((_, d) => !lockedSkipped(d));
  const c = (k: SessionKind) => active.filter((x) => x === k).length;
  const strength = c('bodypump') + c('bootcamp') + c('gym') + c('gymPilates');
  const pilates = c('pilates') + c('gymPilates');
  const runs = c('run');
  const hikes = c('hike');
  const sessions = active.reduce((n, k) => n + sessionWeight(k), 0);

  let score = 0;
  score += 10 * Math.min(strength, t.strength);
  if (strength > t.strength) {
    const extra = strength - t.strength;
    score += extra <= t.extraStrength ? 2 * extra : -6 * extra;
  }
  score += 6 * Math.min(pilates, t.pilates) - 4 * Math.max(0, pilates - t.pilates);
  score += 7 * Math.min(runs, t.run) - 5 * Math.max(0, runs - t.run);
  if (runs > t.maxRuns) score -= 30;
  const hikeWeight = input.phase >= 2 ? 12 : 9;
  score += hikeWeight * Math.min(hikes, t.hike) - 8 * Math.max(0, hikes - Math.max(t.hike, 0));
  if (hikes > 1) score -= 30;
  if (t.bootcamp > 0) score += c('bootcamp') > 0 ? 12 : 0;
  else score -= 20 * c('bootcamp');
  score -= 15 * Math.max(0, sessions - t.maxSessions);
  score -= 2 * c('gymLight'); // only when it helps
  score -= 3 * c('walk'); // walks only when nothing else fits (light-only / travel days)

  kinds.forEach((k, d) => {
    const place = placeOf(input.config, d as DayIdx);
    if (k === 'run') score += place === 'home' ? 2 : -1;
    if ((k === 'pilates' || k === 'gymPilates') && input.prevPilatesDay !== undefined && d !== input.prevPilatesDay) score += 1;
  });

  const sig = signatureOf(kinds);
  if (input.prevSignature && sig === input.prevSignature) score -= 25;
  score += hashRand(`${input.config.weekStart}|${input.seed ?? 0}|${sig}`) * 3;
  return score;
}

/** Find the best combination of kinds for the week. */
export function chooseKinds(input: PlanInput): SessionKind[] {
  const t = targetsFor(input);
  const options: SessionKind[][] = ([0, 1, 2, 3, 4, 5, 6] as DayIdx[]).map((d) => {
    const locked = input.locked[d];
    return locked ? [locked.kind] : dayOptions(input, d);
  });

  let best: SessionKind[] = options.map((o) => o[0]);
  let bestScore = -Infinity;
  const cur: SessionKind[] = [];

  const hardAt = (d: number, k: SessionKind) => {
    const locked = input.locked[d as DayIdx];
    if (locked) return isHard(locked);
    return isHard(k);
  };

  const dfs = (d: number) => {
    if (d === 7) {
      const s = scoreWeek(cur, input, t);
      if (s > bestScore) {
        bestScore = s;
        best = [...cur];
      }
      return;
    }
    for (const k of options[d]) {
      const hard = hardAt(d, k);
      const prevHard = d === 0 ? input.prevSundayHard : hardAt(d - 1, cur[d - 1]);
      // Never two hard days in a row; locked days are facts, so they may break the rule.
      if (hard && prevHard && !input.locked[d as DayIdx]) continue;
      cur[d] = k;
      dfs(d + 1);
    }
  };
  dfs(0);
  return best;
}

export interface DetailContext {
  input: PlanInput;
  kinds: SessionKind[];
}

function uid(prefix: string, date: string, kind: string): string {
  return `${prefix}-${date}-${kind}`;
}

const OFF_TITLE: Record<string, string> = {
  singing: 'Singing lesson: no workout',
  blocked: 'Unavailable: no workout',
};

/** Build the full PlannedSession list from chosen kinds. */
export function buildSessions(input: PlanInput, kinds: SessionKind[]): PlannedSession[] {
  const { config } = input;
  const runIdxs = kinds.map((k, d) => (k === 'run' && !input.locked[d as DayIdx] ? d : -1)).filter((d) => d >= 0);
  const pool = hikePoolFor(config.weekStart);
  let gymRot = input.weekNumber % 2; // alternate G1 / G2 between weeks

  return kinds.map((kind, i) => {
    const day = i as DayIdx;
    const locked = input.locked[day];
    if (locked) return locked;
    const date = addDays(config.weekStart, day);
    const place = placeOf(config, day);
    const base: PlannedSession = {
      id: uid('s', date, kind),
      date,
      day,
      kind,
      title: '',
      details: [],
      intensity: intensityOf(kind),
      place,
      status: 'planned',
    };

    switch (kind) {
      case 'off': {
        const r = input.restrictions[day];
        const reason = r?.off ?? (config.singingDay === day ? 'singing' : 'blocked');
        base.offReason = reason;
        base.title = OFF_TITLE[reason] ?? `${reason[0].toUpperCase()}${reason.slice(1)}: no workout`;
        break;
      }
      case 'rest':
        base.title = 'Rest day';
        break;
      case 'ballet':
        base.title = 'Adult ballet';
        base.time = '17:30–18:30';
        base.details = ['BTC Ljubljana', 'Counts in the weekly load (medium). Check in effort + knee afterwards.'];
        if (config.balletSkipped) {
          base.status = 'skipped';
          base.skipReason = 'other';
          base.title = 'Ballet skipped this week';
        }
        break;
      case 'pilates': {
        const s = slotFor('pilates', day)!;
        base.title = 'Pilates (4P)';
        base.time = `${s.start}–${s.end}`;
        base.details = ['4P Fitnes klub, Stegne 11 (10 min walk from the office)', 'Core + stability. Light day.'];
        break;
      }
      case 'bodypump': {
        const s = slotFor('bodypump', day)!;
        base.title = 'BodyPump (4P)';
        base.time = `${s.start}–${s.end}`;
        base.details = ['Main strength class for climbing and controlled descents.'];
        if (input.phase === 1 || input.kneeCaution) base.details.push('Go light on squat and lunge tracks.');
        break;
      }
      case 'bootcamp': {
        const s = slotFor('bootcamp', day)!;
        base.title = 'Boot Camp (4P)';
        base.time = `${s.start}–${s.end}`;
        base.details = ['Tell the instructor about your knee.', 'Use the low-impact options (step instead of jump).'];
        break;
      }
      case 'gym':
      case 'gymLight':
      case 'gymPilates': {
        const w: GymWorkout = kind === 'gymLight' || input.kneeCaution ? 'G3' : gymRot++ % 2 === 0 ? 'G1' : 'G2';
        base.gymWorkout = w;
        const g = GYM_WORKOUTS[w];
        if (kind === 'gymPilates') {
          base.title = `Gym + Pilates (4P)`;
          base.time = '16:00–18:00';
          base.details = [`16:00 ${g.name}`, ...g.items, '17:00 Pilates'];
        } else {
          base.title = `Gym: ${g.name}`;
          base.time = '16:00–17:00';
          base.details = [...g.items];
        }
        break;
      }
      case 'run': {
        const order = runIdxs.indexOf(i);
        const nRuns = runIdxs.length;
        let km: number;
        if (input.phase === 1) {
          const lvl = RUN_LEVELS[Math.min(Math.max(input.runLevel, 0), RUN_LEVELS.length - 1)];
          km = nRuns >= 2 ? lvl[Math.min(order, 1)] : day >= 5 ? lvl[1] : lvl[0];
        } else if (input.phase === 4 || input.isEasy) km = 3;
        else km = [4, 5, 3.5, 4.5, 5][(input.weekNumber + order) % 5];
        if (input.kneeCaution) km = Math.min(km, 3);
        km = Math.min(km, 5);
        const isLongest = order === nRuns - 1 && nRuns > 1;
        const type = isLongest ? 'Longer' : RUN_TYPES[(input.weekNumber + order) % RUN_TYPES.length];
        base.runKm = km;
        base.runType = type;
        base.title = `Run ${km} km · ${type.split(' (')[0]}`;
        base.time = day >= 5 ? 'Any time' : place === 'home' ? '16:00' : '~17:30 (after the drive home)';
        base.details = [
          'Outside, flat route. Distance only: cover it however feels right.',
          `Route idea: ${FLAT_ROUTES[(input.weekNumber + i) % FLAT_ROUTES.length]}`,
        ];
        if (type.startsWith('Finish')) base.details.push('Last km a bit faster.');
        if (month(date) >= 10 || month(date) <= 3) base.details.push('Dark after 16:00: headlamp + reflective vest.');
        break;
      }
      case 'hike': {
        let candidates = pool.filter((id) => id !== input.lastHikeDest);
        if (candidates.length === 0) candidates = pool;
        let destId = candidates[input.weekNumber % candidates.length];
        if (input.isEasy || input.kneeCaution) {
          destId = [...pool].sort((a, b) => (destination(a)?.gainM ?? 0) - (destination(b)?.gainM ?? 0))[0];
        }
        const dest = destination(destId) ?? DESTINATIONS[0];
        base.hikeDestId = dest.id;
        base.targetGainM = dest.gainM;
        base.packKg = packKgFor(date, dest.id);
        base.title = `Hike: ${dest.name}`;
        base.time = 'Start ~08:00';
        base.details = [
          `From ${dest.start} (~${dest.driveMin} min drive) · ~${dest.gainM} m climb`,
          `Pack: ~${base.packKg} kg`,
          'Trekking poles for the descent. Descent is never timed.',
        ];
        if (dest.note) base.details.push(dest.note);
        if (month(date) >= 11 || month(date) <= 3) base.details.push('Snow or ice: microspikes + poles.');
        if (dest.gainM >= 900) base.details.push('Long hike: drink every ~25 min, small snack every ~50 min.');
        break;
      }
      case 'walk':
        base.title = 'Easy walk 30–45 min';
        base.details = ['Light day. Optional.'];
        break;
      case 'triglav':
        base.title = 'TRIGLAV 🏔️';
        base.time = 'Start 05:00–05:30';
        base.details = [
          `${TRIGLAV.start} → ${TRIGLAV.summit}`,
          `Target: ${TRIGLAV.targetHours} h up (~${TRIGLAV.targetMPerHour} m/h)`,
          'Set a turnaround time with the forecast. Descent easy, poles, untimed.',
        ];
        break;
    }
    return base;
  });
}

/** If the week has no strength session, suggest the optional Pamela Reif video on a free home weekday. */
export function addOptionalVideo(sessions: PlannedSession[]): PlannedSession[] {
  const hasStrength = sessions.some((s) => LEG_STRENGTH.includes(s.kind) && s.status !== 'skipped');
  if (hasStrength) return sessions;
  const idx = sessions.findIndex((s) => s.kind === 'rest' && s.place === 'home' && s.day < 5 && s.status === 'planned');
  if (idx < 0) return sessions;
  return sessions.map((s, i) =>
    i === idx ? { ...s, optionalVideo: true, details: [...s.details, PAMELA_REIF_NOTE] } : s,
  );
}

export function planWeekSessions(input: PlanInput): PlannedSession[] {
  const kinds = chooseKinds(input);
  return addOptionalVideo(buildSessions(input, kinds));
}

export function sessionCount(sessions: PlannedSession[]): number {
  return sessions.filter((s) => s.status !== 'skipped').reduce((n, s) => n + sessionWeight(s.kind), 0);
}

export function describeDay(day: DayIdx): string {
  return DAY_LONG[day];
}
