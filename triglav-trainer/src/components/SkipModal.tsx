import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { skipSession } from '../domain/engine';
import type { PlannedSession, SkipReason } from '../domain/types';
import { useStore } from '../state/store';
import { Button, C, H2, P } from '../ui/kit';

const REASONS: { r: SkipReason; label: string }[] = [
  { r: 'mountains', label: '🏔️ Mountains' },
  { r: 'busy', label: '📅 Busy' },
  { r: 'tired', label: '😴 Tired' },
  { r: 'sick', label: '🤒 Sick' },
  { r: 'weather', label: '🌧️ Weather' },
  { r: 'other', label: 'Other' },
];

export function SkipModal({ session, onClose }: { session: PlannedSession | null; onClose: () => void }) {
  const { update } = useStore();
  return (
    <Modal visible={!!session} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: '#0006', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable style={{ backgroundColor: C.card, padding: 20, borderTopLeftRadius: 18, borderTopRightRadius: 18 }} onPress={() => {}}>
          <H2>Skip {session?.title}?</H2>
          <P sub>No penalty. The app moves it to a free day if the rules allow, otherwise it's dropped.</P>
          <View style={{ height: 10 }} />
          {REASONS.map(({ r, label }) => (
            <Button
              key={r}
              title={label}
              kind="secondary"
              onPress={() => {
                if (session) update((s, today) => skipSession(s, session.id, r, today));
                onClose();
              }}
            />
          ))}
          <Button title="Cancel" kind="ghost" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
