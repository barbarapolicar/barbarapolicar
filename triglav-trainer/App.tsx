import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { addDays, weekStartOf } from './src/domain/dates';
import { LogScreen } from './src/screens/LogScreen';
import { PlanScreen } from './src/screens/PlanScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { WeekScreen } from './src/screens/WeekScreen';
import { calendarSupported, desiredEvents, syncEvents } from './src/services/calendar';
import { StoreProvider, useStore } from './src/state/store';
import { C } from './src/ui/kit';

type Tab = 'today' | 'week' | 'plan' | 'log' | 'settings';
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '☀️' },
  { id: 'week', label: 'Week', icon: '📅' },
  { id: 'plan', label: 'Triglav', icon: '🏔️' },
  { id: 'log', label: 'Log', icon: '📝' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

/** Once a week has been added to the calendar, keep its events in step with plan changes. */
function CalendarAutoSync() {
  const { state, update, today } = useStore();
  const last = useRef<Record<string, string>>({});
  useEffect(() => {
    if (!calendarSupported || !state.settings.trainingCalendarId) return;
    const timer = setTimeout(async () => {
      for (const ws of [weekStartOf(today), addDays(weekStartOf(today), 7)]) {
        const week = state.weeks[ws];
        if (!week) continue;
        const dates = new Set(week.sessions.map((s) => s.date));
        const synced = Object.keys(state.calendarEvents).some((k) => dates.has(k.split(':')[1]));
        if (!synced) continue;
        const events = desiredEvents(state, week);
        const sig = JSON.stringify(events);
        if (last.current[ws] === sig) continue;
        last.current[ws] = sig;
        try {
          const map = await syncEvents(state, ws, events);
          if (JSON.stringify(map) !== JSON.stringify(state.calendarEvents)) update((s) => ({ ...s, calendarEvents: map }));
        } catch {
          // ignore; the user can re-add from the Week tab
        }
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [state, today, update]);
  return null;
}

function Shell() {
  const { ready } = useStore();
  const [tab, setTab] = useState<Tab>('today');
  const insets = useSafeAreaInsets();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator color={C.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <CalendarAutoSync />
      <View style={{ flex: 1 }}>
        {tab === 'today' && <TodayScreen />}
        {tab === 'week' && <WeekScreen />}
        {tab === 'plan' && <PlanScreen />}
        {tab === 'log' && <LogScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </View>
      <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.card, paddingBottom: insets.bottom }}>
        {TABS.map((t) => (
          <Pressable key={t.id} onPress={() => setTab(t.id)} style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }} accessibilityRole="tab">
            <Text style={{ fontSize: 20 }}>{t.icon}</Text>
            <Text style={{ fontSize: 11, color: tab === t.id ? C.primary : C.sub, fontWeight: tab === t.id ? '700' : '400' }}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
