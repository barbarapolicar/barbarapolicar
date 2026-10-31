import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, Switch, View } from 'react-native';
import { addDays, DAY_SHORT, formatDate } from '../domain/dates';
import { defaultWeekConfig, generateWeek } from '../domain/engine';
import type { DayIdx, WeekConfig } from '../domain/types';
import { useStore } from '../state/store';
import { Button, C, Chip, H1, H2, Label, P, Row } from '../ui/kit';

const ALL: DayIdx[] = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS: DayIdx[] = [0, 1, 2, 3, 4];

export function WeekSetupModal({ weekStart, visible, onClose }: { weekStart: string; visible: boolean; onClose: () => void }) {
  const { state, update } = useStore();
  const [cfg, setCfg] = useState<WeekConfig>(() => state.weeks[weekStart]?.config ?? defaultWeekConfig(state, weekStart));

  useEffect(() => {
    if (visible) setCfg(state.weeks[weekStart]?.config ?? defaultWeekConfig(state, weekStart));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, weekStart]);

  const toggle = (list: DayIdx[], d: DayIdx) => (list.includes(d) ? list.filter((x) => x !== d) : [...list, d].sort());

  const save = () => {
    update((s, today) => generateWeek(s, cfg, today));
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
        <H1>Plan the week</H1>
        <P sub>
          {formatDate(weekStart)} – {formatDate(addDays(weekStart, 6))}
        </P>

        <View style={{ height: 18 }} />
        <H2>Singing lesson</H2>
        <Label>Which day (Mon–Thu)? That day stays free of workouts.</Label>
        <Row>
          {([0, 1, 2, 3] as DayIdx[]).map((d) => (
            <Chip key={d} label={DAY_SHORT[d]} selected={cfg.singingDay === d} onPress={() => setCfg({ ...cfg, singingDay: d })} />
          ))}
          <Chip label="None this week" selected={cfg.singingDay === null} onPress={() => setCfg({ ...cfg, singingDay: null })} />
        </Row>

        <View style={{ height: 14 }} />
        <H2>Working from home</H2>
        <Label>Home days in Radovljica (the other weekdays are office days in Ljubljana).</Label>
        <Row>
          {WEEKDAYS.map((d) => (
            <Chip key={d} label={DAY_SHORT[d]} selected={cfg.homeDays.includes(d)} onPress={() => setCfg({ ...cfg, homeDays: toggle(cfg.homeDays, d) })} />
          ))}
        </Row>

        <View style={{ height: 14 }} />
        <H2>Other unavailable days</H2>
        <Row>
          {ALL.map((d) => (
            <Chip key={d} label={DAY_SHORT[d]} selected={cfg.blocked.includes(d)} onPress={() => setCfg({ ...cfg, blocked: toggle(cfg.blocked, d) })} />
          ))}
        </Row>

        <View style={{ height: 14 }} />
        <H2>Ballet (Wed 17:30, BTC)</H2>
        <Row style={{ justifyContent: 'space-between' }}>
          <P>Skip ballet this week</P>
          <Switch value={!!cfg.balletSkipped} onValueChange={(v) => setCfg({ ...cfg, balletSkipped: v, wednesdayFree: v ? cfg.wednesdayFree : false })} />
        </Row>
        {cfg.balletSkipped && (
          <Row style={{ justifyContent: 'space-between', marginTop: 8 }}>
            <P>Use Wednesday for training</P>
            <Switch value={!!cfg.wednesdayFree} onValueChange={(v) => setCfg({ ...cfg, wednesdayFree: v })} />
          </Row>
        )}

        <View style={{ height: 24 }} />
        <Button title={state.weeks[weekStart] ? 'Re-plan week' : 'Build my week'} onPress={save} />
        <Button title="Cancel" kind="ghost" onPress={onClose} />
      </ScrollView>
    </Modal>
  );
}
