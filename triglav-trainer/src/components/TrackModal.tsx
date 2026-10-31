import React from 'react';
import { Alert, Modal, Platform, ScrollView, Text, View } from 'react-native';
import type { PlannedSession } from '../domain/types';
import { fmtDuration, mPerHour, useTracker } from '../services/tracker';
import { useStore } from '../state/store';
import { Button, C, Card, H1, Notice, P, Row } from '../ui/kit';
import type { CheckInPrefill } from './CheckInModal';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ width: '50%', paddingVertical: 10 }}>
      <Text style={{ fontSize: 13, color: C.sub }}>{label}</Text>
      <Text style={{ fontSize: 28, fontWeight: '700', color: C.text }}>{value}</Text>
    </View>
  );
}

export function TrackModal({
  session,
  onClose,
  onFinish,
}: {
  session: PlannedSession | null;
  onClose: () => void;
  onFinish: (prefill: CheckInPrefill) => void;
}) {
  const { state } = useStore();
  const isHike = session?.kind === 'hike' || session?.kind === 'triglav';
  const { stats, start, stop, summit, reset } = useTracker({
    batterySaver: state.settings.batterySaver || !!(isHike && (session?.targetGainM ?? 0) >= 1200),
    fuelReminders: state.settings.fuelReminders,
    isHike,
  });

  const ascentSec = stats.ascentSec ?? stats.elapsedSec;
  const gainForPace = stats.gainAtSummit ?? stats.gainM;
  const pace = stats.distanceKm > 0.05 ? stats.elapsedSec / 60 / stats.distanceKm : 0;

  const finish = () => {
    stop();
    onFinish({
      durationMin: Math.max(1, Math.round(stats.elapsedSec / 60)),
      distanceKm: Math.round(stats.distanceKm * 100) / 100,
      elevationGainM: isHike ? gainForPace : undefined,
      ascentMin: isHike ? Math.round(ascentSec / 60) : undefined,
    });
    reset();
  };

  const close = () => {
    if (stats.running) {
      if (Platform.OS === 'web') {
        stop();
        reset();
        onClose();
        return;
      }
      Alert.alert('Stop tracking?', 'The recording will be discarded.', [
        { text: 'Keep going', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => { reset(); onClose(); } },
      ]);
      return;
    }
    reset();
    onClose();
  };

  return (
    <Modal visible={!!session} animationType="slide" onRequestClose={close}>
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
        <H1>{session?.title}</H1>
        <Card>
          <Row>
            <Stat label="Time" value={fmtDuration(stats.elapsedSec)} />
            <Stat label="Distance" value={`${stats.distanceKm.toFixed(2)} km`} />
            {isHike ? (
              <>
                <Stat label="Climbed" value={`${stats.gainM} m`} />
                <Stat label="Pace up" value={`${mPerHour(gainForPace, ascentSec)} m/h`} />
              </>
            ) : (
              <Stat label="Pace" value={pace ? `${Math.floor(pace)}:${String(Math.round((pace % 1) * 60)).padStart(2, '0')} /km` : '–'} />
            )}
          </Row>
          {isHike && <P sub>Triglav target: 280 m/h. Elevation from {stats.source === 'barometer' ? 'the altimeter' : stats.source === 'gps' ? 'GPS' : '…'}.</P>}
          {stats.ascentSec !== null && <P sub>Summit reached at {fmtDuration(stats.ascentSec)}: descent is not timed.</P>}
        </Card>

        {stats.error && <Notice>{stats.error}</Notice>}
        {isHike && state.settings.fuelReminders && stats.running && <Notice tone="info">Vibration reminders: drink every ~25 min, snack every ~50 min.</Notice>}
        <Notice tone="info">Keep the app open while tracking (screen stays on). Battery saver: {state.settings.batterySaver ? 'on' : 'auto for long hikes'}.</Notice>

        {!stats.running && stats.elapsedSec === 0 && <Button title="Start" onPress={start} />}
        {stats.running && isHike && stats.ascentSec === null && <Button title="⛰️ Summit reached" kind="secondary" onPress={summit} />}
        {(stats.running || stats.elapsedSec > 0) && <Button title="Finish + check in" onPress={finish} />}
        <Button title={stats.running ? 'Discard' : 'Close'} kind="ghost" onPress={close} />
      </ScrollView>
    </Modal>
  );
}
