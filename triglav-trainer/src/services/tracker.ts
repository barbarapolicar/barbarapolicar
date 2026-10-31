/**
 * Phone-only GPS + altimeter tracking for runs and hikes.
 * Foreground tracking with the screen kept awake (works in Expo Go). Elevation gain uses the
 * barometer's relative altitude when available (iPhone), otherwise smoothed GPS altitude.
 */
import * as Location from 'expo-location';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Barometer } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Vibration } from 'react-native';

export interface TrackStats {
  running: boolean;
  startedAt: number | null;
  elapsedSec: number;
  distanceKm: number;
  gainM: number;
  ascentSec: number | null; // set when "Summit reached" is tapped
  gainAtSummit: number | null;
  points: number;
  source: 'barometer' | 'gps' | 'none';
  error?: string;
}

const EMPTY: TrackStats = {
  running: false,
  startedAt: null,
  elapsedSec: 0,
  distanceKm: 0,
  gainM: 0,
  ascentSec: null,
  gainAtSummit: null,
  points: 0,
  source: 'none',
};

export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Count climbing only when altitude rises more than a threshold above the last low point (filters noise). */
export class GainCounter {
  private ref: number | null = null;
  gain = 0;
  constructor(private threshold: number) {}
  push(alt: number) {
    if (this.ref === null) {
      this.ref = alt;
      return;
    }
    if (alt - this.ref >= this.threshold) {
      this.gain += alt - this.ref;
      this.ref = alt;
    } else if (alt < this.ref) {
      this.ref = alt;
    }
  }
}

export function useTracker(opts: { batterySaver: boolean; fuelReminders: boolean; isHike: boolean }) {
  const [stats, setStats] = useState<TrackStats>(EMPTY);
  const locSub = useRef<Location.LocationSubscription | null>(null);
  const baroSub = useRef<{ remove: () => void } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const last = useRef<{ lat: number; lon: number } | null>(null);
  const gps = useRef(new GainCounter(4));
  const baro = useRef(new GainCounter(2));
  const hasBaro = useRef(false);

  const stopAll = useCallback(() => {
    locSub.current?.remove();
    baroSub.current?.remove();
    if (timer.current) clearInterval(timer.current);
    locSub.current = null;
    baroSub.current = null;
    timer.current = null;
    Promise.resolve()
      .then(() => deactivateKeepAwake('tracking'))
      .catch(() => {}); // not active yet (e.g. never started)
  }, []);

  useEffect(() => stopAll, [stopAll]);

  const start = useCallback(async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) {
      setStats((s) => ({ ...s, error: 'Location permission is needed to track.' }));
      return;
    }
    last.current = null;
    gps.current = new GainCounter(4);
    baro.current = new GainCounter(2);
    const startedAt = Date.now();
    setStats({ ...EMPTY, running: true, startedAt });
    await activateKeepAwakeAsync('tracking').catch(() => {});

    hasBaro.current = await Barometer.isAvailableAsync().catch(() => false);
    if (hasBaro.current) {
      Barometer.setUpdateInterval(opts.batterySaver ? 5000 : 2000);
      baroSub.current = Barometer.addListener((m) => {
        if (m.relativeAltitude !== undefined) {
          baro.current.push(m.relativeAltitude);
          setStats((s) => ({ ...s, gainM: Math.round(baro.current.gain), source: 'barometer' }));
        }
      });
    }

    locSub.current = await Location.watchPositionAsync(
      {
        accuracy: opts.batterySaver ? Location.Accuracy.Balanced : Location.Accuracy.BestForNavigation,
        timeInterval: opts.batterySaver ? 15000 : 3000,
        distanceInterval: opts.batterySaver ? 25 : 5,
      },
      (loc) => {
        const p = { lat: loc.coords.latitude, lon: loc.coords.longitude };
        const acc = loc.coords.accuracy ?? 50;
        if (acc > 40) return; // skip poor fixes
        setStats((s) => {
          let distanceKm = s.distanceKm;
          if (last.current) {
            const d = haversineKm(last.current, p);
            if (d < 0.5) distanceKm += d; // ignore jumps
          }
          last.current = p;
          let gainM = s.gainM;
          let source = s.source;
          if (!hasBaro.current && loc.coords.altitude != null) {
            gps.current.push(loc.coords.altitude);
            gainM = Math.round(gps.current.gain);
            source = 'gps';
          }
          return { ...s, distanceKm, gainM, source, points: s.points + 1 };
        });
      },
    );

    let lastDrink = 0;
    let lastEat = 0;
    timer.current = setInterval(() => {
      setStats((s) => {
        const elapsedSec = Math.round((Date.now() - (s.startedAt ?? Date.now())) / 1000);
        if (opts.isHike && opts.fuelReminders) {
          const min = Math.floor(elapsedSec / 60);
          if (min >= 25 && min - lastDrink >= 25) {
            lastDrink = min;
            Vibration.vibrate([0, 300, 200, 300]);
          }
          if (min >= 50 && min - lastEat >= 50) {
            lastEat = min;
            Vibration.vibrate([0, 600]);
          }
        }
        return { ...s, elapsedSec };
      });
    }, 1000);
  }, [opts.batterySaver, opts.fuelReminders, opts.isHike]);

  const summit = useCallback(() => {
    setStats((s) => (s.ascentSec === null ? { ...s, ascentSec: s.elapsedSec, gainAtSummit: s.gainM } : s));
  }, []);

  const stop = useCallback(() => {
    stopAll();
    setStats((s) => ({ ...s, running: false }));
  }, [stopAll]);

  const reset = useCallback(() => {
    stopAll();
    setStats(EMPTY);
  }, [stopAll]);

  return { stats, start, stop, summit, reset };
}

export function mPerHour(gainM: number, seconds: number): number {
  return seconds > 0 ? Math.round(gainM / (seconds / 3600)) : 0;
}

export function fmtDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}
