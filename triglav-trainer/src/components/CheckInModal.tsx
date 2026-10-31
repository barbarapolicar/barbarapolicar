import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, Switch, View } from 'react-native';
import { DESTINATIONS, destination } from '../domain/data';
import { checkIn } from '../domain/engine';
import { hikeDurationMin } from '../domain/timeline';
import type { KneeRating, LogEntry, PlannedSession, SessionKind } from '../domain/types';
import { useStore } from '../state/store';
import { Button, C, Chip, Field, H1, H2, Label, P, Row } from '../ui/kit';

export interface CheckInPrefill {
  durationMin?: number;
  distanceKm?: number;
  elevationGainM?: number;
  ascentMin?: number;
}

function defaultDuration(s: PlannedSession | null, pace: number): number {
  if (!s) return 60;
  switch (s.kind) {
    case 'gymPilates':
      return 120;
    case 'run':
      return Math.round((s.runKm ?? 3) * 7);
    case 'hike':
      return hikeDurationMin(s.targetGainM ?? 500, pace, 0);
    case 'walk':
      return 40;
    default:
      return 60;
  }
}

const MANUAL_KINDS: { kind: SessionKind; label: string }[] = [
  { kind: 'hike', label: 'Mountain day / hike' },
  { kind: 'run', label: 'Run' },
  { kind: 'walk', label: 'Walk' },
  { kind: 'gym', label: 'Gym' },
];

export function CheckInModal({
  visible,
  session,
  prefill,
  onClose,
}: {
  visible: boolean;
  session: PlannedSession | null; // null = manual entry
  prefill?: CheckInPrefill;
  onClose: () => void;
}) {
  const { state, update, today } = useStore();
  const [kind, setKind] = useState<SessionKind>('hike');
  const [date, setDate] = useState(today);
  const [duration, setDuration] = useState('60');
  const [effort, setEffort] = useState<number>(5);
  const [knee, setKnee] = useState<KneeRating>('fine');
  const [distance, setDistance] = useState('');
  const [gain, setGain] = useState('');
  const [ascent, setAscent] = useState('');
  const [energy, setEnergy] = useState<LogEntry['energy']>();
  const [ate, setAte] = useState('');
  const [note, setNote] = useState('');
  const [indoor, setIndoor] = useState(false);
  const [destId, setDestId] = useState<string | undefined>();

  useEffect(() => {
    if (!visible) return;
    const k = session?.kind ?? 'hike';
    setKind(k);
    setDate(session?.date ?? today);
    setDuration(String(prefill?.durationMin ?? defaultDuration(session, state.settings.hikePaceMPerHour)));
    setEffort(5);
    setKnee('fine');
    setDistance(prefill?.distanceKm ? prefill.distanceKm.toFixed(2) : session?.runKm ? String(session.runKm) : '');
    setGain(prefill?.elevationGainM ? String(prefill.elevationGainM) : session?.targetGainM ? String(session.targetGainM) : '');
    setAscent(prefill?.ascentMin ? String(prefill.ascentMin) : '');
    setEnergy(undefined);
    setAte('');
    setNote('');
    setIndoor(false);
    setDestId(session?.hikeDestId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const isHike = kind === 'hike' || kind === 'triglav';
  const isRun = kind === 'run';
  const num = (v: string) => {
    const n = parseFloat(v.replace(',', '.'));
    return Number.isFinite(n) ? n : undefined;
  };

  const save = () => {
    const gainM = num(gain);
    const ascentMin = num(ascent);
    const entry: Omit<LogEntry, 'id' | 'load'> = {
      date,
      kind,
      title: session?.title ?? MANUAL_KINDS.find((m) => m.kind === kind)?.label ?? kind,
      durationMin: Math.max(1, Math.round(num(duration) ?? 60)),
      effort,
      knee,
      note: note || undefined,
      distanceKm: isRun || isHike ? num(distance) : undefined,
      elevationGainM: isHike ? gainM : undefined,
      ascentMin: isHike ? ascentMin : undefined,
      mPerHour: isHike && gainM && ascentMin ? Math.round(gainM / (ascentMin / 60)) : undefined,
      packKg: session?.packKg,
      energy: isHike ? energy : undefined,
      ateDrank: isHike && ate ? ate : undefined,
      destinationId: isHike ? destId : undefined,
      indoor: isRun ? indoor : undefined,
      plannedId: session?.id,
      manual: !session,
    };
    update((s, t) => checkIn(s, entry, t));
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 20, paddingTop: 60 }} keyboardShouldPersistTaps="handled">
        <H1>{session ? 'Check in' : 'Log an activity'}</H1>
        {session && <P sub>{session.title}</P>}

        {!session && (
          <>
            <Label>What did you do?</Label>
            <Row>
              {MANUAL_KINDS.map((m) => (
                <Chip key={m.kind} label={m.label} selected={kind === m.kind} onPress={() => setKind(m.kind)} />
              ))}
            </Row>
            <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
          </>
        )}

        <Field label="Duration (min)" value={duration} onChangeText={setDuration} keyboardType="numeric" />

        <Label>Effort (1 = very easy, 10 = max)</Label>
        <Row>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <Chip key={n} label={String(n)} selected={effort === n} onPress={() => setEffort(n)} />
          ))}
        </Row>

        <Label>{isHike ? 'How did the knee feel going down?' : 'How did the knee feel?'}</Label>
        <Row>
          <Chip label="Fine" selected={knee === 'fine'} onPress={() => setKnee('fine')} />
          <Chip label="A bit" selected={knee === 'bit'} onPress={() => setKnee('bit')} />
          <Chip label="Sore" selected={knee === 'sore'} onPress={() => setKnee('sore')} />
        </Row>

        {(isRun || isHike) && <Field label="Distance (km)" value={distance} onChangeText={setDistance} keyboardType="numeric" />}
        {isRun && (
          <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <P>Treadmill (bad weather)</P>
            <Switch value={indoor} onValueChange={setIndoor} />
          </Row>
        )}

        {isHike && (
          <>
            {!session && (
              <>
                <Label>Where?</Label>
                <Row>
                  {DESTINATIONS.map((d) => (
                    <Chip key={d.id} label={d.name} selected={destId === d.id} onPress={() => { setDestId(d.id); if (!gain) setGain(String(d.gainM)); }} />
                  ))}
                  <Chip label="Other" selected={destId === undefined} onPress={() => setDestId(undefined)} />
                </Row>
              </>
            )}
            <Field label="Elevation gain (m)" value={gain} onChangeText={setGain} keyboardType="numeric" />
            <Field label="Time to the top (min)" value={ascent} onChangeText={setAscent} keyboardType="numeric" />
            {!!num(gain) && !!num(ascent) && (
              <P sub>
                Pace: {Math.round((num(gain) ?? 0) / ((num(ascent) ?? 1) / 60))} m/h (Triglav target 280 m/h)
              </P>
            )}
            <View style={{ height: 8 }} />
            <H2>Energy and fuelling</H2>
            <Row>
              <Chip label="Energy good" selected={energy === 'good'} onPress={() => setEnergy('good')} />
              <Chip label="Dipped" selected={energy === 'dipped'} onPress={() => setEnergy('dipped')} />
              <Chip label="Ran out" selected={energy === 'ranOut'} onPress={() => setEnergy('ranOut')} />
            </Row>
            <Field label="What did you eat and drink?" value={ate} onChangeText={setAte} placeholder="e.g. 1.5 l water, 2 bars, sandwich at the top" />
            {destination(destId)?.id && session?.packKg && <P sub>Planned pack: ~{session.packKg} kg</P>}
          </>
        )}

        <Field label="Note (optional)" value={note} onChangeText={setNote} />

        <Button title="Save" onPress={save} />
        <Button title="Cancel" kind="ghost" onPress={onClose} />
      </ScrollView>
    </Modal>
  );
}
