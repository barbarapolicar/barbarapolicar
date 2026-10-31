import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Intensity } from '../domain/types';

export const C = {
  bg: '#F4F6F8',
  card: '#FFFFFF',
  text: '#16202A',
  sub: '#5B6875',
  line: '#E2E7EC',
  primary: '#1F6F5C', // alpine green
  primarySoft: '#E3F1EC',
  accent: '#C8553D',
  warn: '#B7791F',
  warnSoft: '#FDF3E1',
  hard: '#C8553D',
  medium: '#B7791F',
  light: '#3B82A0',
  none: '#9AA5B1',
};

export const intensityColor = (i: Intensity) => (i === 'H' ? C.hard : i === 'M' ? C.medium : i === 'L' ? C.light : C.none);
export const intensityLabel = (i: Intensity) => (i === 'H' ? 'Hard' : i === 'M' ? 'Medium' : i === 'L' ? 'Light' : '');

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function H1({ children }: { children: React.ReactNode }) {
  return <Text style={s.h1}>{children}</Text>;
}
export function H2({ children }: { children: React.ReactNode }) {
  return <Text style={s.h2}>{children}</Text>;
}
export function P({ children, sub, style }: { children: React.ReactNode; sub?: boolean; style?: StyleProp<any> }) {
  return <Text style={[s.p, sub && { color: C.sub }, style]}>{children}</Text>;
}

export function Button({
  title,
  onPress,
  kind = 'primary',
  small,
  disabled,
}: {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'ghost' | 'danger';
  small?: boolean;
  disabled?: boolean;
}) {
  const bg = kind === 'primary' ? C.primary : kind === 'danger' ? C.accent : kind === 'secondary' ? C.primarySoft : 'transparent';
  const fg = kind === 'primary' || kind === 'danger' ? '#fff' : C.primary;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.btn,
        small && s.btnSmall,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
        kind === 'ghost' && { borderWidth: 1, borderColor: C.line },
      ]}
    >
      <Text style={[s.btnText, small && { fontSize: 14 }, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, selected && { backgroundColor: C.primary, borderColor: C.primary }]}>
      <Text style={[s.chipText, selected && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.row, style]}>{children}</View>;
}

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[s.badge, { backgroundColor: color + '22' }]}>
      <Text style={[s.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function Notice({ children, tone = 'warn' }: { children: React.ReactNode; tone?: 'warn' | 'info' }) {
  return (
    <View style={[s.notice, { backgroundColor: tone === 'warn' ? C.warnSoft : C.primarySoft }]}>
      <Text style={{ color: tone === 'warn' ? C.warn : C.primary, fontSize: 14 }}>{children}</Text>
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'numeric' | 'default';
  placeholder?: string;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType === 'numeric' ? 'decimal-pad' : 'default'}
        placeholder={placeholder}
        placeholderTextColor={C.none}
      />
    </View>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={s.label}>{children}</Text>;
}

export const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.line },
  h1: { fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 6 },
  h2: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 6 },
  p: { fontSize: 15, color: C.text, lineHeight: 21 },
  btn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center', marginVertical: 4 },
  btnSmall: { paddingVertical: 8, paddingHorizontal: 12 },
  btnText: { fontSize: 16, fontWeight: '600' },
  chip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: C.line, marginRight: 6, marginBottom: 6, backgroundColor: '#fff' },
  chipText: { fontSize: 14, color: C.text },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginRight: 6 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  notice: { padding: 10, borderRadius: 10, marginVertical: 6 },
  label: { fontSize: 13, color: C.sub, marginBottom: 4, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 10, padding: 10, fontSize: 16, color: C.text, backgroundColor: '#fff' },
});
