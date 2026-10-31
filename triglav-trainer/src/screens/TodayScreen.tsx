import React, { useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { CheckInModal, type CheckInPrefill } from '../components/CheckInModal';
import { GermanCard } from '../components/GermanCard';
import { SessionCard } from '../components/SessionCard';
import { SkipModal } from '../components/SkipModal';
import { TrackModal } from '../components/TrackModal';
import { WeekSetupModal } from '../components/WeekSetupModal';
import { CHECKLISTS, phaseFor } from '../domain/data';
import { addDays, daysBetween, formatDate, month, weekStartOf } from '../domain/dates';
import {
  activeSick,
  bootcampNeedsDecision,
  decideBootcamp,
  endSick,
  germanStreak,
  promptWeekStart,
  skipSession,
  trainingStreak,
  weekNumber,
} from '../domain/engine';
import type { PlannedSession } from '../domain/types';
import { useStore } from '../state/store';
import { useExternalBusy, useWeatherCheck, type WeatherState } from '../ui/hooks';
import { Button, C, Card, H1, H2, Notice, P, Row } from '../ui/kit';

const PASSSPORT_FALLBACK = 'itms-apps://search.itunes.apple.com/WebObjects/MZSearch.woa/wa/search?media=software&term=Passsport';
const PAMELA_REIF_URL = 'https://www.youtube.com/@PamelaRf1/videos';

function WeatherBox({ w, onMove, onIndoor }: { w: WeatherState; onMove: () => void; onIndoor: () => void }) {
  if (w.status === 'idle') return null;
  if (w.status === 'loading') return <Notice tone="info">Checking the weather…</Notice>;
  if (w.status === 'error') return <Notice>Weather unavailable ({w.message}). Check ARSO before heading out.</Notice>;
  if (w.status === 'run') {
    const v = w.verdict;
    if (v.kind === 'outside') return <Notice tone="info">☀️ Run outside.{v.note ? ` ${v.note}` : ''}</Notice>;
    if (v.kind === 'betterTime') return <Notice>🕐 {v.note}</Notice>;
    return (
      <View>
        <Notice>🌧️ {v.note}</Notice>
        {v.kind === 'treadmill' ? <Button small kind="secondary" title="OK: treadmill today" onPress={onIndoor} /> : <Button small kind="secondary" title="Move the run" onPress={onMove} />}
      </View>
    );
  }
  const v = w.verdict;
  const icon = { go: '✅', earlyStart: '⏰', gear: '🧊', alternative: '🔀', move: '🌧️' }[v.kind];
  return (
    <View>
      <Notice tone={v.kind === 'go' ? 'info' : 'warn'}>
        {icon} {v.notes.join(' ')}
      </Notice>
      {(v.kind === 'move' || v.kind === 'alternative') && <Button small kind="secondary" title="Move the hike" onPress={onMove} />}
    </View>
  );
}

export function TodayScreen() {
  const { state, update, today } = useStore();
  const [setupWeek, setSetupWeek] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState<{ session: PlannedSession | null; prefill?: CheckInPrefill } | null>(null);
  const [skip, setSkip] = useState<PlannedSession | null>(null);
  const [track, setTrack] = useState<PlannedSession | null>(null);

  const ws = weekStartOf(today);
  const week = state.weeks[ws];
  const session = week?.sessions.find((s) => s.date === today);
  const tomorrow = addDays(today, 1);
  const tomorrowSession = state.weeks[weekStartOf(tomorrow)]?.sessions.find((s) => s.date === tomorrow);
  const weather = useWeatherCheck(session);
  const busy = useExternalBusy(state, [today]);
  const prompt = promptWeekStart(state, today);
  const daysToGoal = daysBetween(today, state.settings.goalDate);
  const phase = phaseFor(today);
  const sick = activeSick(state);

  const book = () => Linking.openURL(state.settings.passsportUrl || PASSSPORT_FALLBACK).catch(() => {});

  const actions = (s: PlannedSession) => {
    if (s.status !== 'planned') return null;
    const isClass = ['pilates', 'bodypump', 'bootcamp', 'gymPilates'].includes(s.kind);
    const isOutdoor = ['run', 'hike', 'triglav'].includes(s.kind);
    if (['rest', 'off'].includes(s.kind)) {
      return s.optionalVideo ? <Button small kind="secondary" title="Open Pamela Reif (optional, ≤15 min)" onPress={() => Linking.openURL(PAMELA_REIF_URL)} /> : null;
    }
    return (
      <View style={{ marginTop: 10 }}>
        {isClass && <Button title="Book in Passsport!" kind="secondary" onPress={book} />}
        {isOutdoor && <Button title="Start tracking" onPress={() => setTrack(s)} />}
        <Button title={isOutdoor ? 'Log without tracking' : 'Done ✓ check in'} kind={isOutdoor ? 'secondary' : 'primary'} onPress={() => setCheckIn({ session: s })} />
        <Button title="Skip" kind="ghost" onPress={() => setSkip(s)} />
      </View>
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      <H1>{daysToGoal > 0 ? `Triglav in ${daysToGoal} days` : daysToGoal === 0 ? 'Triglav day! 🏔️' : 'Triglav done 🏔️'}</H1>
      <P sub>
        {formatDate(today)} · Phase {phase.id}: {phase.name} · Week {weekNumber(ws)}
        {week?.isEasy ? ' · easy week' : ''}
      </P>
      <View style={{ height: 12 }} />

      {sick && (
        <Card>
          <H2>🤒 Sick mode</H2>
          <P sub>Plan paused since {formatDate(sick.start)}. When you feel better, the app restarts gently (two light days, easy week).</P>
          <Button title="I'm better" onPress={() => update((s, t) => endSick(s, t))} />
        </Card>
      )}

      {prompt && (
        <Card style={{ backgroundColor: C.primarySoft }}>
          <H2>{prompt === ws ? 'Plan this week' : 'Plan next week'}</H2>
          <P sub>Two quick questions: singing day and home days.</P>
          <Button title="Plan the week" onPress={() => setSetupWeek(prompt)} />
        </Card>
      )}

      {bootcampNeedsDecision(state, today) && (
        <Card>
          <H2>Boot Camp trial finished</H2>
          <P sub>Keep Boot Camp in the plan (up to once a week, Mondays)?</P>
          <Row>
            <Button small title="Keep it" onPress={() => update((s) => decideBootcamp(s, true))} />
            <View style={{ width: 8 }} />
            <Button small kind="ghost" title="Not for me" onPress={() => update((s) => decideBootcamp(s, false))} />
          </Row>
        </Card>
      )}

      {session ? (
        <>
          <SessionCard session={session}>
            {session.status === 'planned' && (
              <WeatherBox
                w={weather}
                onMove={() => update((s, t) => skipSession(s, session.id, 'weather', t))}
                onIndoor={() => setCheckIn({ session })}
              />
            )}
            {(session.kind === 'hike' || session.kind === 'triglav') && session.status === 'planned' && (
              <P sub style={{ marginTop: 6 }}>
                Checklist: {(session.kind === 'triglav' ? CHECKLISTS.triglav : month(today) >= 11 || month(today) <= 3 ? CHECKLISTS.winterHike : CHECKLISTS.summerHike).join(', ')}
              </P>
            )}
            {actions(session)}
          </SessionCard>
          <GermanCard session={session} external={busy[today] ?? []} />
        </>
      ) : (
        !prompt && <Notice tone="info">No plan for today yet.</Notice>
      )}

      {tomorrowSession && tomorrowSession.status === 'planned' && !['rest'].includes(tomorrowSession.kind) && (
        <Card>
          <H2>Tomorrow</H2>
          <P>{tomorrowSession.title}</P>
          {tomorrowSession.kind === 'hike' && (
            <P sub style={{ marginTop: 4 }}>
              Pack tonight: {(month(tomorrow) >= 11 || month(tomorrow) <= 3 ? CHECKLISTS.winterHike : CHECKLISTS.summerHike).join(', ')}
            </P>
          )}
          {tomorrowSession.kind === 'run' && (month(tomorrow) >= 10 || month(tomorrow) <= 3) && tomorrowSession.day < 5 && (
            <P sub style={{ marginTop: 4 }}>Dark run: {CHECKLISTS.run.join(', ')}</P>
          )}
        </Card>
      )}

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <P>🔥 Training streak: {trainingStreak(state, today)} wk</P>
          <P>🇩🇪 German streak: {germanStreak(state, today)} d</P>
        </Row>
      </Card>

      <Button title="+ Log an activity (e.g. own mountain day)" kind="ghost" onPress={() => setCheckIn({ session: null })} />

      {setupWeek && <WeekSetupModal visible weekStart={setupWeek} onClose={() => setSetupWeek(null)} />}
      <CheckInModal visible={!!checkIn} session={checkIn?.session ?? null} prefill={checkIn?.prefill} onClose={() => setCheckIn(null)} />
      <SkipModal session={skip} onClose={() => setSkip(null)} />
      <TrackModal
        session={track}
        onClose={() => setTrack(null)}
        onFinish={(prefill) => {
          const s = track;
          setTrack(null);
          setCheckIn({ session: s, prefill });
        }}
      />
    </ScrollView>
  );
}
