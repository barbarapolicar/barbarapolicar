/**
 * Daily weather check for outdoor runs and hikes.
 * Data: Open-Meteo hourly forecast (free, no key), at the exact location and altitude.
 */
import { HOME_COORDS, destination } from './data';
import type { PlannedSession } from './types';

export interface HourlyWeather {
  time: string[]; // ISO local 'YYYY-MM-DDTHH:00'
  temperature: number[];
  precipitation: number[]; // mm
  snowfall: number[]; // cm
  weatherCode: number[];
  gusts: number[]; // km/h
}

export type RunVerdict =
  | { kind: 'outside'; note?: string }
  | { kind: 'betterTime'; hour: number; note: string }
  | { kind: 'treadmill'; note: string }
  | { kind: 'move'; note: string };

export type HikeVerdict =
  | { kind: 'go'; notes: string[] }
  | { kind: 'earlyStart'; notes: string[] }
  | { kind: 'gear'; notes: string[] }
  | { kind: 'alternative'; notes: string[] }
  | { kind: 'move'; notes: string[] };

const THUNDER = (c: number) => c >= 95;
const FOG = (c: number) => c === 45 || c === 48;

export function forecastUrl(lat: number, lon: number, elevation?: number): string {
  const params = [
    `latitude=${lat}`,
    `longitude=${lon}`,
    elevation !== undefined ? `elevation=${elevation}` : '',
    'hourly=temperature_2m,precipitation,snowfall,weather_code,wind_gusts_10m',
    'past_days=2',
    'forecast_days=7',
    'timezone=Europe%2FLjubljana',
  ].filter(Boolean);
  return `https://api.open-meteo.com/v1/forecast?${params.join('&')}`;
}

export async function fetchHourly(lat: number, lon: number, elevation?: number): Promise<HourlyWeather> {
  const res = await fetch(forecastUrl(lat, lon, elevation));
  if (!res.ok) throw new Error(`Weather request failed (${res.status})`);
  const j = await res.json();
  const h = j.hourly;
  return {
    time: h.time,
    temperature: h.temperature_2m,
    precipitation: h.precipitation,
    snowfall: h.snowfall,
    weatherCode: h.weather_code,
    gusts: h.wind_gusts_10m,
  };
}

interface Hour {
  hour: number;
  temp: number;
  precip: number;
  snow: number;
  code: number;
  gust: number;
}

function hoursFor(w: HourlyWeather, date: string): Hour[] {
  const out: Hour[] = [];
  w.time.forEach((t, i) => {
    if (t.startsWith(date)) {
      out.push({
        hour: Number(t.slice(11, 13)),
        temp: w.temperature[i],
        precip: w.precipitation[i] ?? 0,
        snow: w.snowfall[i] ?? 0,
        code: w.weatherCode[i] ?? 0,
        gust: w.gusts[i] ?? 0,
      });
    }
  });
  return out;
}

function previous24h(w: HourlyWeather, date: string, hour: number): Hour[] {
  const idx = w.time.findIndex((t) => t === `${date}T${String(hour).padStart(2, '0')}:00`);
  if (idx < 0) return [];
  const out: Hour[] = [];
  for (let i = Math.max(0, idx - 24); i < idx; i++) {
    out.push({ hour: 0, temp: w.temperature[i], precip: w.precipitation[i] ?? 0, snow: w.snowfall[i] ?? 0, code: w.weatherCode[i] ?? 0, gust: w.gusts[i] ?? 0 });
  }
  return out;
}

function badForRun(h: Hour): string | null {
  if (THUNDER(h.code)) return 'thunderstorm';
  if (h.precip > 1.5) return 'heavy rain';
  if (h.snow > 1) return 'snowfall';
  if (h.gust > 55) return 'strong wind';
  if (h.temp < -5) return 'very cold';
  if (h.temp > 30) return 'too hot';
  return null;
}

/**
 * Verdict for an outdoor run. Preferred window: weekdays from the planned hour (16:00 home, ~17:30
 * after the commute), weekends 09:00–18:00.
 */
export function runVerdict(w: HourlyWeather, date: string, preferredHour: number, officeDay: boolean, weekend: boolean): RunVerdict {
  const hours = hoursFor(w, date);
  if (hours.length === 0) return { kind: 'outside', note: 'No forecast available.' };
  const at = (hr: number) => hours.find((h) => h.hour === hr);
  const prev = previous24h(w, date, preferredHour);
  const icy = (h: Hour | undefined) => !!h && h.temp <= 0 && prev.some((p) => p.precip > 0.2 || p.snow > 0);

  const target = at(preferredHour);
  const problem = target ? badForRun(target) ?? (icy(target) ? 'icy paths' : null) : null;
  if (!problem) {
    const notes: string[] = [];
    if (target && target.precip > 0.2) notes.push('Light rain: a light jacket.');
    if (target && target.temp <= 2) notes.push('Cold: layers and gloves.');
    return { kind: 'outside', note: notes.join(' ') || undefined };
  }

  const window = weekend ? [9, 18] : [preferredHour - 1, 20];
  for (let hr = window[0]; hr <= window[1]; hr++) {
    if (hr === preferredHour) continue;
    const h = at(hr);
    if (h && !badForRun(h) && !icy(h)) {
      return { kind: 'betterTime', hour: hr, note: `${problem} at ${preferredHour}:00, better around ${hr}:00.` };
    }
  }
  if (officeDay) return { kind: 'treadmill', note: `${problem} all afternoon: treadmill at 4P (same distance, flat).` };
  return { kind: 'move', note: `${problem} all day: move the run to another day.` };
}

/** Verdict for a hike, checked at the summit altitude. */
export function hikeVerdict(w: HourlyWeather, date: string, ridge: boolean): HikeVerdict {
  const hours = hoursFor(w, date).filter((h) => h.hour >= 7 && h.hour <= 17);
  if (hours.length === 0) return { kind: 'go', notes: ['No forecast available: check ARSO before leaving.'] };
  const morning = hours.filter((h) => h.hour <= 12);
  const afternoon = hours.filter((h) => h.hour > 12);
  const prev = previous24h(w, date, 7);
  const freshSnowCm = [...prev, ...morning].reduce((a, h) => a + h.snow, 0);
  const notes: string[] = [];

  if (morning.some((h) => THUNDER(h.code))) return { kind: 'move', notes: ['Thunderstorms in the morning: move the hike.'] };
  if (morning.filter((h) => h.precip > 1).length >= 3) return { kind: 'move', notes: ['Steady rain: move the hike.'] };
  if (morning.filter((h) => FOG(h.code)).length >= 3) return { kind: 'move', notes: ['Fog most of the morning: move the hike.'] };
  if (freshSnowCm >= 20) return { kind: 'alternative', notes: ['Heavy fresh snow: lower destination (Sv. Peter) or gym stair machine. Check the ARSO avalanche bulletin.'] };
  if (ridge && hours.some((h) => h.gust > 60)) return { kind: 'alternative', notes: ['Strong wind on the ridge: pick a sheltered alternative.'] };

  if (hours.some((h) => h.temp <= 0) || freshSnowCm > 0 || prev.some((h) => h.snow > 0)) notes.push('Snow or ice likely: microspikes + poles.');
  if (afternoon.some((h) => THUNDER(h.code))) {
    return { kind: 'earlyStart', notes: ['Afternoon thunderstorms: start early, set a turnaround time, be down by ~13:00.', ...notes] };
  }
  if (notes.length) return { kind: 'gear', notes };
  return { kind: 'go', notes: ['Looks good.'] };
}

export function coordsFor(session: PlannedSession): { lat: number; lon: number; elevation: number } {
  if (session.kind === 'hike') {
    const d = destination(session.hikeDestId);
    if (d) return { lat: d.lat, lon: d.lon, elevation: d.summitElevation };
  }
  if (session.kind === 'triglav') return { lat: 46.3783, lon: 13.8367, elevation: 2864 };
  return HOME_COORDS;
}
