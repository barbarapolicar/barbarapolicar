import { describe, expect, it } from 'vitest';
import { CLASS_SLOTS } from '../data';
import { addDays, dayIdx } from '../dates';
import { checkIn, defaultState, endSick, generateWeek, skipSession, startSick } from '../engine';
import { isHard } from '../planner';
import { dayTimeline, GERMAN_LAST_END, planGerman } from '../timeline';
import type { AppState, DayIdx, PlannedSession, WeekConfig } from '../types';

const WEEKS = ['2026-11-02', '2026-11-30', '2027-01-11', '2027-02-15', '2027-04-12', '2027-05-17', '2027-06-14', '2027-06-21'];
const SINGING: (DayIdx | null)[] = [0, 1, 3, null];
const HOME_SETS: DayIdx[][] = [[0, 2], [1, 3], [3, 4], [0, 4], [2, 3]];

function cfg(weekStart: string, singingDay: DayIdx | null, homeDays: DayIdx[], blocked: DayIdx[] = []): WeekConfig {
  return { weekStart, singingDay, homeDays, blocked };
}

function checkRules(sessions: PlannedSession[], c: WeekConfig, prevSundayHard: boolean) {
  expect(sessions).toHaveLength(7);
  sessions.forEach((s, d) => {
    expect(s.day).toBe(d);
    expect(dayIdx(s.date)).toBe(d);
    // never two hard days in a row (incl. Sun -> Mon)
    const prevHard = d === 0 ? prevSundayHard : isHard(sessions[d - 1]);
    if (isHard(s)) expect(prevHard, `${s.date} ${s.kind} after hard`).toBe(false);
    // Wednesday is ballet
    if (d === 2 && !c.wednesdayFree) expect(s.kind).toBe('ballet');
    // singing / blocked days are off
    if (c.singingDay === d || c.blocked.includes(d as DayIdx)) expect(['off', 'triglav']).toContain(s.kind);
    // 4P only on office days, at real timetable slots
    if (['pilates', 'bodypump', 'bootcamp', 'gym', 'gymLight', 'gymPilates'].includes(s.kind)) {
      expect(s.place).toBe('office');
      expect(d).toBeLessThan(5);
    }
    if (['pilates', 'bodypump', 'bootcamp'].includes(s.kind)) {
      expect(CLASS_SLOTS.some((cl) => cl.kind === s.kind && cl.day === d)).toBe(true);
    }
    if (s.kind === 'gymPilates') expect(CLASS_SLOTS.some((cl) => cl.kind === 'pilates' && cl.day === d)).toBe(true);
    // hikes on weekends only
    if (s.kind === 'hike') expect(d).toBeGreaterThanOrEqual(5);
    if (s.kind === 'run') expect(s.runKm!).toBeLessThanOrEqual(5);
  });
  expect(sessions.filter((s) => s.kind === 'run').length).toBeLessThanOrEqual(2);
  expect(sessions.filter((s) => s.kind === 'hike').length).toBeLessThanOrEqual(1);
}

describe('planner rules', () => {
  it('respects every rule across phases, singing days and home days', () => {
    for (const ws of WEEKS) {
      for (const sing of SINGING) {
        for (const home of HOME_SETS) {
          for (const prevHard of [false, true]) {
            let st = defaultState();
            if (prevHard) {
              // previous week ending in a hard Sunday
              st = generateWeek(st, cfg(addDays(ws, -7), null, []), addDays(ws, -7));
              const prev = st.weeks[addDays(ws, -7)];
              prev.sessions[6] = { ...prev.sessions[6], kind: 'hike', status: 'done' };
            }
            const c = cfg(ws, sing, home);
            st = generateWeek(st, c, ws);
            checkRules(st.weeks[ws].sessions, c, prevHard);
          }
        }
      }
    }
  });

  it('plans a sensible number of sessions', () => {
    const st = generateWeek(defaultState(), cfg('2026-11-02', 0, [3]), '2026-11-02');
    const counted = st.weeks['2026-11-02'].sessions.filter((s) => !['rest', 'off', 'ballet', 'walk'].includes(s.kind));
    expect(counted.length).toBeGreaterThanOrEqual(3);
    expect(counted.length).toBeLessThanOrEqual(4);
  });

  it('never repeats last week’s layout with the same constraints', () => {
    let st = defaultState();
    let ws = '2026-11-02';
    for (let i = 0; i < 12; i++) {
      st = generateWeek(st, cfg(ws, 1, [0, 3]), ws);
      const prev = st.weeks[addDays(ws, -7)];
      if (prev) expect(st.weeks[ws].signature).not.toBe(prev.signature);
      // mark everything done so progression moves
      st.weeks[ws].sessions = st.weeks[ws].sessions.map((s) => ({ ...s, status: s.kind === 'off' || s.kind === 'rest' ? s.status : 'done' }));
      ws = addDays(ws, 7);
    }
  });

  it('puts the Triglav day on the goal date', () => {
    const st = generateWeek(defaultState(), cfg('2027-06-21', 1, []), '2027-06-21');
    expect(st.weeks['2027-06-21'].sessions[6].kind).toBe('triglav');
  });

  it('frees Wednesday when ballet is skipped in advance', () => {
    const c = { ...cfg('2027-02-15', 1, []), balletSkipped: true, wednesdayFree: true };
    const st = generateWeek(defaultState(), c, '2027-02-15');
    expect(st.weeks['2027-02-15'].sessions[2].kind).not.toBe('ballet');
    checkRules(st.weeks['2027-02-15'].sessions, c, false);
  });

  it('keeps ballet (skipped) on Wednesday when skipped without freeing the day', () => {
    const c = { ...cfg('2027-02-15', 1, []), balletSkipped: true };
    const st = generateWeek(defaultState(), c, '2027-02-15');
    const wed = st.weeks['2027-02-15'].sessions[2];
    expect(wed.kind).toBe('ballet');
    expect(wed.status).toBe('skipped');
  });
});

describe('adaptive behaviour', () => {
  it('re-plans after a skip and keeps the rules', () => {
    const ws = '2027-01-11';
    let st = generateWeek(defaultState(), cfg(ws, 0, [3]), ws);
    const first = st.weeks[ws].sessions.find((s) => s.status === 'planned' && isHard(s))!;
    st = skipSession(st, first.id, 'busy', first.date);
    const w = st.weeks[ws];
    expect(w.sessions.find((s) => s.id === first.id)?.status).toBe('skipped');
    checkRules(w.sessions, w.config, false);
  });

  it('sick mode blocks days and restarts gently', () => {
    const ws = '2027-01-11';
    let st: AppState = generateWeek(defaultState(), cfg(ws, 0, []), ws);
    st = startSick(st, '2027-01-12');
    expect(st.weeks[ws].sessions.slice(1).every((s) => s.kind === 'off' || s.kind === 'ballet' || s.kind === 'triglav' || s.status !== 'planned' || s.date < '2027-01-12')).toBe(true);
    st = endSick(st, '2027-01-15');
    const w = st.weeks[ws];
    expect(w.isEasy).toBe(true);
    // first two days back are light only
    for (const d of ['2027-01-15', '2027-01-16']) {
      const s = w.sessions.find((x) => x.date === d)!;
      expect(isHard(s)).toBe(false);
    }
  });

  it('pauses Boot Camp after two sore knees', () => {
    let st = defaultState();
    for (const date of ['2026-11-30', '2026-12-14']) {
      st = checkIn(st, { date, kind: 'bootcamp', title: 'Boot Camp', durationMin: 60, effort: 7, knee: 'sore' }, date);
    }
    expect(st.progress.bootcamp.status).toBe('paused');
  });

  it('knee caution after two sore check-ins removes Boot Camp and gym legs', () => {
    let st = defaultState();
    st = checkIn(st, { date: '2027-01-05', kind: 'run', title: 'Run', durationMin: 30, effort: 5, knee: 'sore' }, '2027-01-05');
    st = checkIn(st, { date: '2027-01-07', kind: 'hike', title: 'Hike', durationMin: 120, effort: 6, knee: 'sore' }, '2027-01-07');
    st = generateWeek(st, cfg('2027-01-11', 1, []), '2027-01-11');
    const w = st.weeks['2027-01-11'];
    expect(w.kneeCaution).toBe(true);
    expect(w.sessions.some((s) => s.kind === 'bootcamp' || s.kind === 'gym')).toBe(false);
  });
});

describe('German blocks', () => {
  it('fits two 30-min blocks inside the window without clashing', () => {
    for (const ws of WEEKS) {
      for (const sing of SINGING) {
        for (const home of HOME_SETS) {
          const st = generateWeek(defaultState(), cfg(ws, sing, home), ws);
          for (const s of st.weeks[ws].sessions) {
            const g = planGerman(s);
            const busy = dayTimeline(s);
            const start = s.day >= 5 ? 9 * 60 : s.place === 'office' ? 16 * 60 + 30 : 15 * 60;
            for (const b of g.blocks) {
              expect(b.end - b.start).toBe(30);
              expect(b.start).toBeGreaterThanOrEqual(start);
              expect(b.end).toBeLessThanOrEqual(GERMAN_LAST_END);
              for (const i of busy) expect(b.end <= i.start || b.start >= i.end, `${s.date} ${s.kind}`).toBe(true);
            }
            if (s.kind !== 'triglav') expect(g.blocks.length, `${s.date} ${s.kind}`).toBe(2);
          }
        }
      }
    }
  });

  it('office day with a 17:00 class: both blocks after the drive home', () => {
    const s: PlannedSession = { id: 'x', date: '2027-01-15', day: 4, kind: 'bodypump', title: 'BodyPump', details: [], intensity: 'H', place: 'office', status: 'planned' };
    const g = planGerman(s);
    // class 17-18, walk back 18:10, drive until 18:55
    expect(g.blocks[0].start).toBeGreaterThanOrEqual(18 * 60 + 55);
    expect(g.blocks).toHaveLength(2);
  });

  it('avoids external calendar events', () => {
    const s: PlannedSession = { id: 'x', date: '2027-01-16', day: 5, kind: 'rest', title: 'Rest', details: [], intensity: 'none', place: 'home', status: 'planned' };
    const g = planGerman(s, [{ start: 9 * 60, end: 12 * 60, label: 'Brunch', kind: 'external' }]);
    expect(g.blocks[0].start).toBeGreaterThanOrEqual(12 * 60 + 10);
  });
});
