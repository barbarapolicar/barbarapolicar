import React, { useState } from 'react';
import { Alert, Platform, ScrollView, Switch, View } from 'react-native';
import { DAY_SHORT, formatDate } from '../domain/dates';
import { activeSick, addTravel, decideBootcamp, removeMode, startSick } from '../domain/engine';
import type { DayIdx, Settings, TravelOption } from '../domain/types';
import { calendarSupported, writableCalendars, type CalendarInfo } from '../services/calendar';
import { useStore } from '../state/store';
import { Button, C, Card, Chip, Field, H1, H2, Label, Notice, P, Row } from '../ui/kit';

export function SettingsScreen() {
  const { state, update, reset } = useStore();
  const st = state.settings;
  const [cals, setCals] = useState<CalendarInfo[] | null>(null);
  const [calErr, setCalErr] = useState<string | null>(null);
  const [tStart, setTStart] = useState('');
  const [tEnd, setTEnd] = useState('');
  const [tOpt, setTOpt] = useState<TravelOption>('mountains');

  const set = (patch: Partial<Settings>) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  const toggleHome = (d: DayIdx) =>
    set({ fixedHomeDays: st.fixedHomeDays.includes(d) ? st.fixedHomeDays.filter((x) => x !== d) : [...st.fixedHomeDays, d].sort() });

  const loadCals = async () => {
    try {
      const list = await writableCalendars();
      setCals(list);
      if (list.length === 0) setCalErr('No writable calendars, or permission denied (Settings → Triglav Trainer → Calendars).');
    } catch (e: any) {
      setCalErr(String(e?.message ?? e));
    }
  };

  const sick = activeSick(state);

  const confirmReset = () => {
    if (Platform.OS === 'web') return reset();
    Alert.alert('Delete all data?', 'Plans, log and settings will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: reset },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <H1>Settings</H1>

      <Card>
        <H2>Working from home</H2>
        <Row>
          <Chip label="Choose every week" selected={st.homeDaysMode === 'weekly'} onPress={() => set({ homeDaysMode: 'weekly' })} />
          <Chip label="Fixed days" selected={st.homeDaysMode === 'fixed'} onPress={() => set({ homeDaysMode: 'fixed' })} />
        </Row>
        {st.homeDaysMode === 'fixed' && (
          <>
            <Label>Home days</Label>
            <Row>
              {([0, 1, 2, 3, 4] as DayIdx[]).map((d) => (
                <Chip key={d} label={DAY_SHORT[d]} selected={st.fixedHomeDays.includes(d)} onPress={() => toggleHome(d)} />
              ))}
            </Row>
          </>
        )}
        <P sub>Wednesday: ballet 17:30–18:30 at BTC (no other workout). Singing day: chosen each week.</P>
      </Card>

      <Card>
        <H2>📅 iPhone calendar</H2>
        {!calendarSupported ? (
          <P sub>Calendar sync works on the phone app.</P>
        ) : (
          <>
            <P sub>Pick a calendar (e.g. your Google calendar on the iPhone, which syncs to Google Calendar).</P>
            <Button small kind="secondary" title={cals ? 'Reload calendars' : 'Choose calendars'} onPress={loadCals} />
            {calErr && <Notice>{calErr}</Notice>}
            {cals && cals.length > 0 && (
              <>
                <Label>Workouts</Label>
                <Row>
                  {cals.map((c) => (
                    <Chip key={c.id} label={`${c.title}${c.source ? ` (${c.source})` : ''}`} selected={st.trainingCalendarId === c.id} onPress={() => set({ trainingCalendarId: c.id })} />
                  ))}
                </Row>
                <Label>German blocks</Label>
                <Row>
                  {cals.map((c) => (
                    <Chip key={c.id} label={`${c.title}${c.source ? ` (${c.source})` : ''}`} selected={st.germanCalendarId === c.id} onPress={() => set({ germanCalendarId: c.id })} />
                  ))}
                </Row>
              </>
            )}
            <P sub>Add a week from the Week tab. After that, events follow changes automatically.</P>
          </>
        )}
      </Card>

      <Card>
        <H2>🇩🇪 German</H2>
        <Row style={{ justifyContent: 'space-between' }}>
          <P>Plan 2 × 30 min every day</P>
          <Switch value={st.germanEnabled} onValueChange={(v) => set({ germanEnabled: v })} />
        </Row>
        <P sub>Home days from 15:00, office days from 16:30, weekends any time. Last block ends by 20:30. Block 1: textbook. Block 2: Duolingo + review.</P>
      </Card>

      <Card>
        <H2>Booking</H2>
        <Field label="Passsport! link (optional)" value={st.passsportUrl} onChangeText={(t) => set({ passsportUrl: t })} placeholder="Leave empty to open the App Store search" />
      </Card>

      <Card>
        <H2>Tracking</H2>
        <Row style={{ justifyContent: 'space-between' }}>
          <P>Battery saver (long hikes)</P>
          <Switch value={st.batterySaver} onValueChange={(v) => set({ batterySaver: v })} />
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <P>Drink / snack vibration reminders</P>
          <Switch value={st.fuelReminders} onValueChange={(v) => set({ fuelReminders: v })} />
        </Row>
        <Field label="Triglav date (YYYY-MM-DD)" value={st.goalDate} onChangeText={(t) => /^\d{4}-\d{2}-\d{2}$/.test(t) && set({ goalDate: t })} />
      </Card>

      <Card>
        <H2>🤒 Sick mode</H2>
        {sick ? (
          <P sub>Active since {formatDate(sick.start)}. End it from the Today tab.</P>
        ) : (
          <Button small kind="secondary" title="I'm sick: pause the plan" onPress={() => update((s, t) => startSick(s, t))} />
        )}
      </Card>

      <Card>
        <H2>✈️ Travel / holiday</H2>
        <Field label="From (YYYY-MM-DD)" value={tStart} onChangeText={setTStart} />
        <Field label="To (YYYY-MM-DD)" value={tEnd} onChangeText={setTEnd} />
        <Row>
          <Chip label="Nothing" selected={tOpt === 'nothing'} onPress={() => setTOpt('nothing')} />
          <Chip label="Running only" selected={tOpt === 'running'} onPress={() => setTOpt('running')} />
          <Chip label="Mountains" selected={tOpt === 'mountains'} onPress={() => setTOpt('mountains')} />
        </Row>
        <Button
          small
          title="Add trip"
          disabled={!/^\d{4}-\d{2}-\d{2}$/.test(tStart) || !/^\d{4}-\d{2}-\d{2}$/.test(tEnd) || tEnd < tStart}
          onPress={() => {
            update((s, t) => addTravel(s, tStart, tEnd, tOpt, t));
            setTStart('');
            setTEnd('');
          }}
        />
        {state.modes
          .filter((m) => m.type === 'travel')
          .map((m) => (
            <Row key={m.id} style={{ justifyContent: 'space-between' }}>
              <P sub>
                {formatDate(m.start)} – {m.end ? formatDate(m.end) : '…'} · {m.travelOption}
              </P>
              <Button small kind="ghost" title="Remove" onPress={() => update((s, t) => removeMode(s, m.id, t))} />
            </Row>
          ))}
      </Card>

      <Card>
        <H2>Boot Camp</H2>
        <P sub>Status: {state.progress.bootcamp.status}</P>
        <Row>
          <Button small kind="ghost" title="Keep in plan" onPress={() => update((s) => decideBootcamp(s, true))} />
          <View style={{ width: 8 }} />
          <Button small kind="ghost" title="Remove" onPress={() => update((s) => decideBootcamp(s, false))} />
        </Row>
      </Card>

      <Button title="Delete all data" kind="danger" onPress={confirmReset} />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
