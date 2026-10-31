import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { todayISO } from '../domain/dates';
import { defaultState } from '../domain/engine';
import type { AppState } from '../domain/types';

const KEY = 'triglav-trainer/state/v1';

interface Store {
  state: AppState;
  ready: boolean;
  today: string;
  update: (fn: (s: AppState, today: string) => AppState) => void;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

function migrate(raw: unknown): AppState {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  const s = raw as Partial<AppState>;
  return {
    ...base,
    ...s,
    settings: { ...base.settings, ...(s.settings ?? {}) },
    progress: { ...base.progress, ...(s.progress ?? {}) },
    german: s.german ?? {},
    calendarEvents: s.calendarEvents ?? {},
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState(todayISO());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((json) => setState(migrate(json ? JSON.parse(json) : null)))
      .catch(() => setState(defaultState()))
      .finally(() => setReady(true));
  }, []);

  // Keep "today" fresh if the app stays open past midnight.
  useEffect(() => {
    const t = setInterval(() => setToday(todayISO()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
    }, 300);
  }, [state, ready]);

  const update = useCallback((fn: (s: AppState, today: string) => AppState) => {
    setState((s) => fn(s, todayISO()));
  }, []);

  const reset = useCallback(() => setState(defaultState()), []);

  const value = useMemo(() => ({ state, ready, today, update, reset }), [state, ready, today, update, reset]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
