import React from 'react';
import { Text, View } from 'react-native';
import { formatDate } from '../domain/dates';
import type { PlannedSession } from '../domain/types';
import { Badge, C, Card, intensityColor, intensityLabel, P } from '../ui/kit';

export function SessionCard({
  session,
  showDate,
  compact,
  children,
}: {
  session: PlannedSession;
  showDate?: boolean;
  compact?: boolean;
  children?: React.ReactNode;
}) {
  const skipped = session.status === 'skipped';
  const done = session.status === 'done';
  return (
    <Card style={[{ borderLeftWidth: 5, borderLeftColor: intensityColor(session.intensity) }, skipped && { opacity: 0.55 }]}>
      {showDate && <P sub>{formatDate(session.date)}</P>}
      <Text style={{ fontSize: compact ? 16 : 19, fontWeight: '700', color: C.text, textDecorationLine: skipped ? 'line-through' : 'none' }}>
        {done ? '✓ ' : ''}
        {session.title}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
        {session.time && <Badge label={session.time} color={C.text} />}
        {intensityLabel(session.intensity) !== '' && <Badge label={intensityLabel(session.intensity)} color={intensityColor(session.intensity)} />}
        {session.day < 5 && <Badge label={session.place === 'office' ? 'Office day' : 'Home day'} color={C.sub} />}
        {skipped && <Badge label={`Skipped${session.skipReason ? ` · ${session.skipReason}` : ''}`} color={C.accent} />}
      </View>
      {!compact &&
        session.details.map((d, i) => (
          <P key={i} sub style={{ marginTop: 4 }}>
            • {d}
          </P>
        ))}
      {children}
    </Card>
  );
}
