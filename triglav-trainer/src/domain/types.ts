/** Day index within a week: 0 = Monday ... 6 = Sunday. */
export type DayIdx = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type SessionKind =
  | 'rest'
  | 'off' // unavailable: singing, blocked, sick, travel
  | 'ballet'
  | 'pilates'
  | 'bodypump'
  | 'bootcamp'
  | 'gym' // G1 / G2 leg + stairs session at 4P
  | 'gymLight' // G3 easy bike + core + mobility at 4P
  | 'gymPilates' // gym 16:00 then Pilates 17:00
  | 'run'
  | 'hike'
  | 'walk'
  | 'triglav';

export type Intensity = 'H' | 'M' | 'L' | 'none';
export type Place = 'office' | 'home';
export type SessionStatus = 'planned' | 'done' | 'skipped';
export type SkipReason = 'mountains' | 'busy' | 'tired' | 'sick' | 'weather' | 'other';
export type KneeRating = 'fine' | 'bit' | 'sore';
export type GymWorkout = 'G1' | 'G2' | 'G3';
export type PhaseId = 1 | 2 | 3 | 4;

export interface PlannedSession {
  id: string;
  date: string; // YYYY-MM-DD
  day: DayIdx;
  kind: SessionKind;
  title: string;
  time?: string;
  details: string[];
  intensity: Intensity;
  place: Place;
  status: SessionStatus;
  offReason?: string;
  skipReason?: SkipReason;
  runKm?: number;
  runType?: string;
  hikeDestId?: string;
  targetGainM?: number;
  packKg?: number;
  gymWorkout?: GymWorkout;
  /** Optional ≤15 min Pamela Reif video suggestion (never required). */
  optionalVideo?: boolean;
  logId?: string;
}

export interface WeekConfig {
  weekStart: string; // Monday, YYYY-MM-DD
  singingDay: DayIdx | null;
  homeDays: DayIdx[];
  blocked: DayIdx[];
}

export interface WeekPlan {
  weekStart: string;
  config: WeekConfig;
  sessions: PlannedSession[]; // exactly 7, Mon..Sun
  phase: PhaseId;
  isEasy: boolean;
  bootcampWeek: boolean;
  kneeCaution: boolean;
  signature: string;
  runLevel: number;
  generatedAt: string;
}

export interface LogEntry {
  id: string;
  date: string;
  kind: SessionKind;
  title: string;
  durationMin: number;
  effort: number; // 1..10
  knee: KneeRating;
  note?: string;
  distanceKm?: number;
  elevationGainM?: number;
  ascentMin?: number;
  mPerHour?: number;
  packKg?: number;
  energy?: 'good' | 'dipped' | 'ranOut';
  ateDrank?: string;
  destinationId?: string;
  indoor?: boolean;
  plannedId?: string;
  manual?: boolean;
  load: number;
}

export type BootcampStatus = 'notStarted' | 'trial' | 'paused' | 'kept' | 'dropped';

export interface Progress {
  bootcamp: {
    status: BootcampStatus;
    soreCount: number;
    skipNext: boolean;
    askedKeep: boolean;
  };
}

export type TravelOption = 'nothing' | 'running' | 'mountains';

export interface ModePeriod {
  id: string;
  type: 'sick' | 'travel';
  start: string;
  end: string | null; // null = still active (sick mode)
  travelOption?: TravelOption;
}

export interface Settings {
  homeDaysMode: 'fixed' | 'weekly';
  fixedHomeDays: DayIdx[];
  goalDate: string;
  passsportUrl: string;
  fuelReminders: boolean;
  batterySaver: boolean;
}

export interface AppState {
  version: 1;
  settings: Settings;
  weeks: Record<string, WeekPlan>;
  log: LogEntry[];
  progress: Progress;
  modes: ModePeriod[];
}
