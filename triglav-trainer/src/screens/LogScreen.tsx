import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { CheckInModal } from '../components/CheckInModal';
import { destination } from '../domain/data';
import { formatDate } from '../domain/dates';
import { useStore } from '../state/store';
import { Button, C, Card, H1, P } from '../ui/kit';

export function LogScreen() {
  const { state, update } = useStore();
  const [adding, setAdding] = useState(false);
  const entries = [...state.log].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      <H1>Log</H1>
      <Button title="+ Log an activity" onPress={() => setAdding(true)} />
      {entries.length === 0 && <P sub>Nothing logged yet.</P>}
      {entries.map((l) => (
        <Card key={l.id}>
          <P sub>{formatDate(l.date)}</P>
          <P style={{ fontWeight: '700' }}>
            {l.title}
            {l.manual ? ' (own)' : ''}
          </P>
          <P sub>
            {l.durationMin} min · effort {l.effort} · knee {l.knee} · load {l.load}
            {l.distanceKm ? ` · ${l.distanceKm} km` : ''}
            {l.indoor ? ' · treadmill' : ''}
          </P>
          {l.elevationGainM ? (
            <P sub>
              {destination(l.destinationId)?.name ?? ''} {l.elevationGainM} m{l.ascentMin ? ` in ${l.ascentMin} min` : ''}
              {l.mPerHour ? ` → ${l.mPerHour} m/h` : ''}
              {l.energy ? ` · energy: ${l.energy}` : ''}
            </P>
          ) : null}
          {l.ateDrank ? <P sub>Ate/drank: {l.ateDrank}</P> : null}
          {l.note ? <P sub>“{l.note}”</P> : null}
          <Button small kind="ghost" title="Delete" onPress={() => update((s) => ({ ...s, log: s.log.filter((x) => x.id !== l.id) }))} />
        </Card>
      ))}
      <CheckInModal visible={adding} session={null} onClose={() => setAdding(false)} />
    </ScrollView>
  );
}
