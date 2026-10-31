import { useEffect, useState } from 'react';
import { dayIdx } from '../domain/dates';
import type { Interval } from '../domain/timeline';
import type { AppState, PlannedSession } from '../domain/types';
import { coordsFor, fetchHourly, hikeVerdict, runVerdict, type HikeVerdict, type HourlyWeather, type RunVerdict } from '../domain/weather';
import { destination } from '../domain/data';
import { externalBusy } from '../services/calendar';

const cache = new Map<string, { at: number; data: HourlyWeather }>();

async function cachedHourly(lat: number, lon: number, elevation?: number): Promise<HourlyWeather> {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)},${elevation ?? ''}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 30 * 60 * 1000) return hit.data;
  const data = await fetchHourly(lat, lon, elevation);
  cache.set(key, { at: Date.now(), data });
  return data;
}

export type WeatherState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'run'; verdict: RunVerdict }
  | { status: 'hike'; verdict: HikeVerdict };

/** Daily weather check for an outdoor session (run, hike, Triglav). */
export function useWeatherCheck(session: PlannedSession | undefined): WeatherState {
  const [st, setSt] = useState<WeatherState>({ status: 'idle' });
  const key = session ? `${session.id}:${session.kind}:${session.status}` : '';
  useEffect(() => {
    if (!session || session.status !== 'planned' || !['run', 'hike', 'triglav'].includes(session.kind)) {
      setSt({ status: 'idle' });
      return;
    }
    let alive = true;
    setSt({ status: 'loading' });
    const c = coordsFor(session);
    cachedHourly(c.lat, c.lon, c.elevation)
      .then((w) => {
        if (!alive) return;
        if (session.kind === 'run') {
          const weekend = dayIdx(session.date) >= 5;
          const hour = weekend ? 10 : session.place === 'home' ? 16 : 17;
          setSt({ status: 'run', verdict: runVerdict(w, session.date, hour, session.place === 'office', weekend) });
        } else {
          const ridge = session.kind === 'triglav' || !!destination(session.hikeDestId)?.ridge;
          setSt({ status: 'hike', verdict: hikeVerdict(w, session.date, ridge) });
        }
      })
      .catch((e) => alive && setSt({ status: 'error', message: String(e?.message ?? e) }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return st;
}

/** Busy intervals from the user's own calendar events, by date. */
export function useExternalBusy(state: AppState, dates: string[]): Record<string, Interval[]> {
  const [busy, setBusy] = useState<Record<string, Interval[]>>({});
  const key = dates.join(',') + '|' + Object.keys(state.calendarEvents).length;
  useEffect(() => {
    let alive = true;
    externalBusy(state, dates)
      .then((b) => alive && setBusy(b))
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return busy;
}
