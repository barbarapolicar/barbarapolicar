import type { DayIdx, GymWorkout, PhaseId } from './types';

/** Radovljica: home base for runs and the start of every drive. */
export const HOME_COORDS = { lat: 46.3444, lon: 14.1744, elevation: 490 };

export const PROGRAM_START = '2026-11-02';
export const DEFAULT_GOAL_DATE = '2027-06-27';
export const BOOTCAMP_TRIAL_START = '2026-11-30'; // week 5
export const BOOTCAMP_TRIAL_END = '2026-12-27'; // end of week 8

export interface Phase {
  id: PhaseId;
  name: string;
  start: string;
  end: string;
  focus: string;
}

export const PHASES: Phase[] = [
  { id: 1, name: 'Base', start: '2026-11-02', end: '2026-12-27', focus: 'Build the habit: Pilates, BodyPump, runs 2 → 5 km, Sv. Peter. Boot Camp trial from week 5.' },
  { id: 2, name: 'Build', start: '2026-12-28', end: '2027-03-28', focus: 'Climbing strength: gym stairs + legs, Kofce and Roblek, hikes up to ~1,000 m.' },
  { id: 3, name: 'Mountain', start: '2027-03-29', end: '2027-06-13', focus: 'Long climbing days: Begunjščica, Golica, Stol. Pack weight up to the full Triglav pack.' },
  { id: 4, name: 'Taper', start: '2027-06-14', end: '2027-06-27', focus: 'Less volume, fresh legs, then Triglav.' },
];

export function phaseFor(date: string): Phase {
  if (date < PHASES[0].start) return PHASES[0];
  return PHASES.find((p) => date >= p.start && date <= p.end) ?? PHASES[PHASES.length - 1];
}

/** 4P Fitnes klub Ljubljana timetable: only the classes that fit the rules (finish by 18:00, knee-friendly or trial). */
export interface ClassSlot {
  kind: 'pilates' | 'bodypump' | 'bootcamp';
  name: string;
  day: DayIdx;
  start: string;
  end: string;
}

export const CLASS_SLOTS: ClassSlot[] = [
  { kind: 'bootcamp', name: 'Boot Camp', day: 0, start: '17:00', end: '18:00' },
  { kind: 'pilates', name: 'Pilates', day: 1, start: '17:00', end: '18:00' },
  { kind: 'pilates', name: 'Pilates', day: 3, start: '17:00', end: '18:00' },
  { kind: 'bodypump', name: 'BodyPump', day: 4, start: '17:00', end: '18:00' },
];

export function slotFor(kind: ClassSlot['kind'], day: DayIdx): ClassSlot | undefined {
  return CLASS_SLOTS.find((c) => c.kind === kind && c.day === day);
}

export const GYM_WORKOUTS: Record<GymWorkout, { name: string; items: string[] }> = {
  G1: { name: 'G1 · Stairs + legs', items: ['Stair machine 20–30 min', 'Leg press 3×12', 'Step-ups 3×10 each leg'] },
  G2: {
    name: 'G2 · Incline + control',
    items: ['Incline treadmill 20–30 min', 'Slow step-downs 3×8 each leg (knee control for descents)', 'Glute bridges + hamstring curls 3×12'],
  },
  G3: { name: 'G3 · Easy bike + core', items: ['Exercise bike 25 min, easy', 'Core circuit 10 min', 'Mobility 5–10 min'] },
};

export interface Destination {
  id: string;
  name: string;
  start: string;
  gainM: number;
  driveMin: number;
  /** Months (1-12) in which the app suggests it. */
  months: number[];
  ridge: boolean;
  lat: number;
  lon: number;
  summitElevation: number;
  note?: string;
}

export const DESTINATIONS: Destination[] = [
  { id: 'svpeter', name: 'Sv. Peter nad Begunjami', start: 'Begunje', gainM: 430, driveMin: 10, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], ridge: false, lat: 46.388, lon: 14.209, summitElevation: 1025, note: 'Benchmark hill: one ascent, timed.' },
  { id: 'kofce', name: 'Kofce', start: 'Podljubelj', gainM: 600, driveMin: 25, months: [1, 2, 3, 4, 5, 10, 11, 12], ridge: false, lat: 46.43, lon: 14.29, summitElevation: 1488 },
  { id: 'roblek', name: 'Roblek', start: 'Begunje / Draga', gainM: 1000, driveMin: 15, months: [1, 2, 3, 4, 5, 6, 10, 11, 12], ridge: false, lat: 46.413, lon: 14.226, summitElevation: 1676, note: 'Can be icy after snowfall: microspikes + poles.' },
  { id: 'golica', name: 'Golica', start: 'Planina pod Golico', gainM: 900, driveMin: 25, months: [4, 5, 6], ridge: true, lat: 46.488, lon: 14.054, summitElevation: 1835, note: 'Spring only (upper slopes avalanche-prone in winter).' },
  { id: 'begunjscica', name: 'Begunjščica', start: 'Draga', gainM: 1400, driveMin: 15, months: [4, 5, 6], ridge: true, lat: 46.42, lon: 14.23, summitElevation: 2060, note: 'Only once spring conditions are OK.' },
  { id: 'stol', name: 'Stol', start: 'Završnica', gainM: 1500, driveMin: 25, months: [5, 6], ridge: true, lat: 46.434, lon: 14.175, summitElevation: 2236, note: 'Triglav rehearsal: full pack, target ≥ 280 m/h.' },
];

export function destination(id: string | undefined): Destination | undefined {
  return DESTINATIONS.find((d) => d.id === id);
}

/** Which destinations the plan picks from on a given date (the hike progression from the design doc). */
export function hikePoolFor(date: string): string[] {
  const m = Number(date.slice(5, 7));
  if (date >= '2027-06-14' && date <= '2027-06-27') return ['roblek', 'svpeter']; // taper
  if (m === 11 || m === 12) return ['svpeter'];
  if (m === 1) return ['kofce', 'roblek', 'svpeter'];
  if (m === 2 || m === 3) return ['roblek', 'kofce', 'svpeter'];
  if (m === 4) return ['begunjscica', 'golica', 'roblek'];
  if (m === 5 || m === 6) return ['stol', 'begunjscica', 'golica'];
  return ['svpeter', 'roblek'];
}

/** Target backpack weight on hikes by month. */
export function packKgFor(date: string, destId?: string): number {
  const m = Number(date.slice(5, 7));
  if (destId === 'stol' && (m === 5 || m === 6)) return 7.5;
  if (m === 3) return 5;
  if (m === 4 || m === 5 || m === 6) return 6.5;
  return 3.5;
}

/** Phase 1 run progression (distance only), by level 0..7 = programme week 1..8. */
export const RUN_LEVELS: [number, number][] = [
  [2, 2.5],
  [2.5, 2.5],
  [2.5, 3],
  [2, 2.5],
  [3, 3.5],
  [3, 4],
  [3.5, 4.5],
  [3.5, 5],
];

export const RUN_TYPES = ['Easy', 'Finish strong (last km a bit faster)', 'New flat route'] as const;

export const FLAT_ROUTES = [
  'Radovljica → Lesce and back',
  'Along the Sava below Radovljica',
  'Radovljica old town loop + Lesce fields',
  'Lesce → Hraše field roads',
];

export const PAMELA_REIF_NOTE = 'Optional: a Pamela Reif video, max 15 min (no-jump, e.g. legs or abs). Skip it freely.';

export const TRIGLAV = {
  start: 'Rudno polje (Pokljuka), ~1,350 m',
  summit: 'Triglav, 2,864 m',
  gainM: 1500,
  targetHours: 5.5,
  targetMPerHour: 280,
};

export const CHECKLISTS: Record<'run' | 'winterHike' | 'summerHike' | 'triglav', string[]> = {
  run: ['Headlamp (dark after 16:00 in winter)', 'Reflective vest', 'Layers + gloves'],
  winterHike: ['Microspikes', 'Trekking poles', 'Warm layers', 'Thermos', 'Headlamp', 'Power bank'],
  summerHike: ['Water', 'Sun protection', 'Rain jacket', 'Snacks', 'Trekking poles'],
  triglav: ['Ferrata set', 'Helmet', 'Gloves', 'Layers', 'Headlamp', 'Power bank', 'First aid', 'Documents', 'Food + water per fuelling plan', 'Trekking poles for the descent'],
};
