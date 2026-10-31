import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, View } from 'react-native';
import { GermanCard } from '../components/GermanCard';
import { SessionCard } from '../components/SessionCard';
import { SkipModal } from '../components/SkipModal';
import { WeekSetupModal } from '../components/WeekSetupModal';
import { addDays, DAY_SHORT, formatDate, weekStartOf } from '../domain/dates';
import { replanWeek, weekNumber } from '../domain/engine';
import { fmt } from '../domain/timeline';
import type { PlannedSession } from '../domain/types';
import { calendarSupported, desiredEvents, syncEvents, type PendingEvent } from '../services/calendar';
import { useStore } from '../state/store';
import { useExternalBusy } from '../ui/hooks';
import { Button, C, Card, H1, H2, Notice, P, Row } from '../ui/kit';

export function WeekScreen() {
  const { state, update, today } = useStore();
  const [ws, setWs] = useState(weekStartOf(today));
  const [setup, setSetup] = useState(false);
  const [open, setOpen] = useState<string | null>(today);
  const [skip, setSkip] = useState<PlannedSession | null>(null);
  const [preview, setPreview] = useState<PendingEvent[] | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const week = state.weeks[ws];
  const dates = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const busy = useExternalBusy(state, dates);

  const toggleBlock = (s: PlannedSession) => {
    if (!week) return;
    const blocked = week.config.blocked.includes(s.day) ? week.config.blocked.filter((d) => d !== s.day) : [...week.config.blocked, s.day];
    update((st, t) => replanWeek(st, ws, t, { ...week.config, blocked }));
  };

  const doSync = async () => {
    if (!week || !preview) return;
    if (!state.settings.trainingCalendarId) {
      setMsg('Pick a calendar in Settings first.');
      setPreview(null);
      return;
    }
    setSyncing(true);
    try {
      const map = await syncEvents(state, ws, preview);
      update((s) => ({ ...s, calendarEvents: map }));
      setMsg(`Calendar updated (${preview.length} events).`);
    } catch (e: any) {
      setMsg(`Calendar error: ${e?.message ?? e}`);
    } finally {
      setSyncing(false);
      setPreview(null);
    }
  };

  const confirmReplan = () => {
    const run = () => update((s, t) => replanWeek(s, ws, t));
    if (Platform.OS === 'web') return run();
    Alert.alert('Re-plan the rest of the week?', 'Past, done and skipped days stay as they are.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Re-plan', onPress: run },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Button small kind="ghost" title="‹ Prev" onPress={() => setWs(addDays(ws, -7))} />
        <View style={{ alignItems: 'center' }}>
          <H1>Week {weekNumber(ws)}</H1>
          <P sub>
            {formatDate(ws)} – {formatDate(addDays(ws, 6))}
          </P>
        </View>
        <Button small kind="ghost" title="Next ›" onPress={() => setWs(addDays(ws, 7))} />
      </Row>

      {!week ? (
        <Card>
          <H2>Not planned yet</H2>
          <Button title="Plan this week" onPress={() => setSetup(true)} />
        </Card>
      ) : (
        <>
          <Card>
            <P sub>
              Singing: {week.config.singingDay === null ? 'none' : DAY_SHORT[week.config.singingDay]} · Home days:{' '}
              {week.config.homeDays.length ? week.config.homeDays.map((d) => DAY_SHORT[d]).join(', ') : 'none'}
              {week.config.blocked.length ? ` · Blocked: ${week.config.blocked.map((d) => DAY_SHORT[d]).join(', ')}` : ''}
              {week.isEasy ? ' · Easy week' : ''}
              {week.kneeCaution ? ' · Knee caution' : ''}
            </P>
            <Row style={{ marginTop: 6 }}>
              <Button small kind="secondary" title="Edit week" onPress={() => setSetup(true)} />
              <View style={{ width: 8 }} />
              <Button small kind="ghost" title="Re-plan" onPress={confirmReplan} />
              <View style={{ width: 8 }} />
              {calendarSupported && <Button small kind="ghost" title="📅 Add to calendar" onPress={() => setPreview(desiredEvents(state, week, busy))} />}
            </Row>
            {week.kneeCaution && <Notice>Knee was sore twice in a row: lighter week, no Boot Camp or gym legs. If it stays sore, see a physiotherapist.</Notice>}
            {msg && <Notice tone="info">{msg}</Notice>}
          </Card>

          {preview && (
            <Card style={{ backgroundColor: C.primarySoft }}>
              <H2>Add to your calendar?</H2>
              {preview.map((e) => (
                <P key={e.key} sub>
                  {formatDate(e.date)} {fmt(e.start)}–{fmt(e.end)} {e.title}
                </P>
              ))}
              <Button title={syncing ? 'Adding…' : 'Add to calendar'} onPress={doSync} disabled={syncing} />
              <Button title="Cancel" kind="ghost" onPress={() => setPreview(null)} />
            </Card>
          )}

          {week.sessions.map((s) => (
            <Pressable key={s.id} onPress={() => setOpen(open === s.date ? null : s.date)}>
              <SessionCard session={s} showDate compact={open !== s.date}>
                {open === s.date && s.date >= today && (
                  <Row style={{ marginTop: 8 }}>
                    {s.status === 'planned' && !['rest', 'off', 'triglav'].includes(s.kind) && (
                      <Button small kind="ghost" title="Skip" onPress={() => setSkip(s)} />
                    )}
                    <View style={{ width: 6 }} />
                    {s.kind !== 'ballet' && s.kind !== 'triglav' && s.status === 'planned' && (
                      <Button small kind="ghost" title={week.config.blocked.includes(s.day) ? 'Unblock day' : 'Block day'} onPress={() => toggleBlock(s)} />
                    )}
                  </Row>
                )}
              </SessionCard>
              {open === s.date && <GermanCard session={s} external={busy[s.date] ?? []} />}
            </Pressable>
          ))}
        </>
      )}

      {setup && <WeekSetupModal visible weekStart={ws} onClose={() => setSetup(false)} />}
      <SkipModal session={skip} onClose={() => setSkip(null)} />
    </ScrollView>
  );
}
