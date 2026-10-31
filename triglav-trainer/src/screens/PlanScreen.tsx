import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { PHASES, TRIGLAV, destination, phaseFor } from '../domain/data';
import { daysBetween, formatDate } from '../domain/dates';
import { germanStreak, loadJumpWarning, trainingStreak, weeklyLoads } from '../domain/engine';
import { useStore } from '../state/store';
import { C, Card, H1, H2, Notice, P, Row } from '../ui/kit';

export function PlanScreen() {
  const { state, today } = useStore();
  const phase = phaseFor(today);
  const loads = weeklyLoads(state, 8, today);
  const maxLoad = Math.max(1, ...loads.map((l) => l.load));
  const hikes = state.log.filter((l) => l.kind === 'hike' && l.mPerHour).sort((a, b) => a.date.localeCompare(b.date));
  const svPeter = hikes.filter((h) => h.destinationId === 'svpeter');
  const bestPace = hikes.reduce((m, h) => Math.max(m, h.mPerHour ?? 0), 0);
  const lastWeek = Object.values(state.weeks).sort((a, b) => b.weekStart.localeCompare(a.weekStart))[0];
  const b = state.progress.bootcamp;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      <H1>Road to Triglav</H1>
      <P sub>
        {TRIGLAV.start} → {TRIGLAV.summit} in {TRIGLAV.targetHours} h · {formatDate(state.settings.goalDate)} ({daysBetween(today, state.settings.goalDate)} days)
      </P>
      <View style={{ height: 12 }} />

      <Card>
        <H2>Phases</H2>
        {PHASES.map((p) => (
          <View key={p.id} style={{ paddingVertical: 6, opacity: p.id === phase.id ? 1 : 0.55 }}>
            <Text style={{ fontWeight: '700', color: p.id === phase.id ? C.primary : C.text }}>
              {p.id === phase.id ? '▶ ' : ''}
              {p.id}. {p.name} · {formatDate(p.start)} – {formatDate(p.end)}
            </Text>
            <P sub>{p.focus}</P>
          </View>
        ))}
      </Card>

      <Card>
        <H2>Triglav pace</H2>
        <P>
          Best climbing pace: <Text style={{ fontWeight: '700' }}>{bestPace || '–'} m/h</Text> · target {TRIGLAV.targetMPerHour} m/h
        </P>
        <P sub>Estimated pace used for planning: {state.settings.hikePaceMPerHour} m/h</P>
        {hikes.slice(-6).map((h) => (
          <P key={h.id} sub>
            {formatDate(h.date)} · {destination(h.destinationId)?.name ?? h.title} · {h.elevationGainM} m in {h.ascentMin} min → {h.mPerHour} m/h
          </P>
        ))}
        {svPeter.length > 0 && (
          <>
            <View style={{ height: 6 }} />
            <P style={{ fontWeight: '600' }}>Sv. Peter benchmark</P>
            {svPeter.map((h) => (
              <P key={h.id} sub>
                {formatDate(h.date)}: {h.ascentMin} min (effort {h.effort})
              </P>
            ))}
          </>
        )}
      </Card>

      <Card>
        <H2>Weekly load</H2>
        <P sub>Effort × minutes, last 8 weeks</P>
        <Row style={{ alignItems: 'flex-end', height: 110, marginTop: 8, flexWrap: 'nowrap' }}>
          {loads.map((l) => (
            <View key={l.weekStart} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: C.sub }}>{l.load || ''}</Text>
              <View style={{ width: '60%', height: Math.max(2, (l.load / maxLoad) * 80), backgroundColor: C.primary, borderRadius: 4 }} />
              <Text style={{ fontSize: 10, color: C.sub }}>{l.weekStart.slice(5).replace('-', '/')}</Text>
            </View>
          ))}
        </Row>
        {loadJumpWarning(loads) && <Notice>Load jumped more than 30% vs last week: take the next session easier.</Notice>}
      </Card>

      <Card>
        <H2>Progress</H2>
        <P>🔥 Training streak: {trainingStreak(state, today)} weeks (≥ 2 sessions)</P>
        <P>🇩🇪 German streak: {germanStreak(state, today)} days</P>
        {lastWeek && phase.id === 1 && <P>🏃 Run level: week {lastWeek.runLevel + 1} of 8</P>}
        <P>
          🥾 Boot Camp:{' '}
          {{ notStarted: 'trial starts week 5 (30 Nov)', trial: 'trial', paused: 'paused (knee)', kept: 'in the plan', dropped: 'not in the plan' }[b.status]}
        </P>
        <P>✅ Sessions logged: {state.log.length}</P>
      </Card>
    </ScrollView>
  );
}
