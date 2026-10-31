import React from 'react';
import { View } from 'react-native';
import { fmt, planGerman, type Interval } from '../domain/timeline';
import type { BlockStatus, GermanDay, PlannedSession } from '../domain/types';
import { useStore } from '../state/store';
import { Button, C, Card, Chip, H2, Notice, P, Row } from '../ui/kit';

export function GermanCard({ session, external }: { session: PlannedSession; external: Interval[] }) {
  const { state, update } = useStore();
  if (!state.settings.germanEnabled) return null;
  const plan = planGerman(session, external, state.settings.hikePaceMPerHour);
  const day: GermanDay = state.german[session.date] ?? {};

  const set = (patch: Partial<GermanDay>) =>
    update((s) => ({ ...s, german: { ...s.german, [session.date]: { ...(s.german[session.date] ?? {}), ...patch } } }));

  const status = (i: 1 | 2): BlockStatus | undefined => (i === 1 ? day.b1 : day.b2);
  const setStatus = (i: 1 | 2, v: BlockStatus | undefined) => set(i === 1 ? { b1: v } : { b2: v });
  const allSkipped = plan.blocks.length > 0 && plan.blocks.every((b) => status(b.index) === 'skipped');

  return (
    <Card>
      <H2>🇩🇪 German</H2>
      {plan.warning && <Notice>{plan.warning}</Notice>}
      {plan.blocks.map((b) => {
        const st = status(b.index);
        return (
          <View key={b.index} style={{ paddingVertical: 6, borderTopWidth: b.index === 2 ? 1 : 0, borderTopColor: C.line }}>
            <P style={{ fontWeight: '600', textDecorationLine: st === 'skipped' ? 'line-through' : 'none' }}>
              {st === 'done' ? '✓ ' : ''}
              {fmt(b.start)}–{fmt(b.end)} · {b.title}
            </P>
            <Row>
              <Chip label="Done" selected={st === 'done'} onPress={() => setStatus(b.index, st === 'done' ? undefined : 'done')} />
              <Chip label="Skip" selected={st === 'skipped'} onPress={() => setStatus(b.index, st === 'skipped' ? undefined : 'skipped')} />
            </Row>
          </View>
        );
      })}
      <Row style={{ marginTop: 6 }}>
        <Chip label={day.duolingo ? '✓ Duolingo (5 min+)' : 'Duolingo (5 min+)'} selected={!!day.duolingo} onPress={() => set({ duolingo: !day.duolingo })} />
      </Row>
      {plan.blocks.length > 0 && !allSkipped && (
        <Button title="Skip German today" kind="ghost" small onPress={() => set({ b1: 'skipped', b2: 'skipped' })} />
      )}
    </Card>
  );
}
