# Triglav Trainer: Design Document

> A personal fitness tracking app that combines **4P Fitness group classes (vodene vadbe)**, **running**, **gym** and **mountain hikes** into one adaptive plan, building toward **climbing Triglav from Pokljuka in 5.5 hours at the end of June 2027**.

Status: **design only**, not implemented yet.

---

## 1. User profile and goal

| Item | Value |
|---|---|
| Home | Radovljica |
| Gym | 4P Fitnes klub, Stegne 11, Ljubljana (classes + open gym access) |
| Current fitness | Moderate. Šmarna gora (Tacen) in ~40 min |
| Injury | Past knee injury, mostly fine now. **Descents can bother it.** |
| Equipment | Phone only (no watch or heart rate monitor), microspikes, trekking poles |
| Mountain experience | Comfortable on via ferratas (klettersteigs) |
| Other apps | None |
| **Goal** | **Triglav from Pokljuka (Rudno polje) to the summit in 5.5 h**, end of June 2027 (target date: **Sun, 27 June 2027**) |

### What the goal requires
- Rudno polje (~1,350 m) to Triglav (2,864 m) is roughly **1,500 m of climbing**. 5.5 h is about **280 m/h sustained for hours**, plus the ferrata section near the top.
- Short-climb speed is already good (~500 m/h on Šmarna gora). What's missing is **endurance: holding the pace for 5+ hours**, and **knee resilience on long descents**.
- So the plan prioritises **leg strength, climbing volume and long hikes**. Running is supporting cardio, **capped at 5 km**.

---

## 2. Concept

One app, one calendar, one way of measuring effort for every kind of training:

- **4P classes** (suggested from the real timetable, booked through Passsport!)
- **Runs** (tracked with phone GPS)
- **Gym sessions** (structured workouts in the 4P open gym)
- **Hikes** (GPS + altimeter, metres climbed per hour)

The app plans each week, adapts when life gets in the way (skips, mountain trips, weather, knee pain), and shows progress toward Triglav.

---

## 3. Scheduling rules

| Rule | Detail |
|---|---|
| Weekday time window | **Classes must finish by 18:00.** Runs and gym on weekdays start after 16:00. |
| Weekends | No time limit. |
| Weekly volume | 2 classes + 2 runs as the core. In Phase 2+, a gym session is added and the weekend run usually becomes a hike. |
| Hard and light days | Hard: run, hike, BodyPump, gym (legs). Light: Pilates, easy bike, walk. **Never two hard days in a row**, including across the weekend boundary (Sun → Mon). |
| Knee | No leg-heavy session the day before a run or hike. No high-impact classes. |
| **Variety** | **The same weekly layout is never repeated two weeks in a row.** Days, run types, gym workouts and hikes rotate (see §6). |
| Easier weeks | Every 4th week is lighter (~30% less volume). |

---

## 4. 4P classes

Source: 4P Fitnes klub Ljubljana timetable (screenshot, Oct 2026). There are **no weekend classes**.

### Classes that fit the rules (finish by 18:00, knee-friendly)

| Class | When | Role |
|---|---|---|
| **Pilates** | Tue 17:00–18:00, Thu 17:00–18:00 | Core, stability, light day |
| **BodyPump** | Fri 17:00–18:00 | Main strength class: squats and lunges for climbing and controlled descents. Lighter weights on leg tracks at first. |

### Excluded

| Class | Reason |
|---|---|
| Boot Camp (Mon/Wed 17:00), Hyrox prep (Thu 16:00), BodyAttack, FatBurner | High impact / jumping, bad for the knee |
| BodyPump Mon/Wed 18:00, Spin, BodyStep, Yogalates, BodyShape, Core | Finish after 18:00 |
| Fit in zdravi (Tue/Thu 09:30), early morning classes | Outside the preferred time |

The timetable is stored as editable data so it can be updated when 4P changes the schedule (see §11).

---

## 5. Training phases

34 weeks, from Mon 2 Nov 2026 to Triglav on Sun 27 Jun 2027.

| Phase | Dates | Weeks | Focus |
|---|---|---|---|
| **1. Base** | 2 Nov – 27 Dec 2026 | 8 | Build the habit. Pilates, BodyPump, runs 2 → 5 km, Sv. Peter |
| **2. Build** | 28 Dec 2026 – 28 Mar 2027 | 13 | Add a weekly gym session (stairs + legs). Roblek. Hikes up to ~1,000 m |
| **3. Mountain** | 29 Mar – 13 Jun 2027 | 11 | Long climbing days: Begunjščica, Stol. Hikes up to ~1,500 m+ |
| **4. Taper** | 14 – 27 Jun 2027 | 2 | Less volume, fresh legs, then **Triglav** |

### Running progression (distance only)

The app sets distance only, never run/walk intervals or pace. How the distance is covered is up to the user.

| Week | Run 1 | Run 2 |
|---|---|---|
| 1 | 2 km | 2.5 km |
| 2 | 2.5 km | 2.5 km |
| 3 | 2.5 km | 3 km |
| 4 (easy) | 2 km | 2.5 km |
| 5 | 3 km | 3.5 km |
| 6 | 3 km | 4 km |
| 7 | 3.5 km | 4.5 km |
| 8 | 3.5 km | **5 km** |
| Phase 2+ | 3–5 km, varied types (see §6) | usually replaced by a hike |

If a week was rated hard (effort ≥ 8) or the knee complained, the week is repeated instead of moving on.

### Hike progression (elevation gain)

| Period | Typical hike | Climb (approx.) |
|---|---|---|
| Nov–Dec | **Sv. Peter nad Begunjami** | ~400–450 m |
| Jan | Sv. Peter ×2 | ~850 m |
| Feb–Mar | **Roblek** (from Begunje / Draga) | ~1,000 m |
| Apr | **Begunjščica** | ~1,400 m |
| May – early Jun | **Stol** (from Završnica) = Triglav rehearsal | ~1,500 m+ |
| Jun | Taper: one medium hike, then **Triglav** | ~1,500 m |

Climbing figures are estimates. The app replaces them with real GPS values after the first hike.

---

## 6. Weekly variety

The app builds each week from a **rotating set of week templates**, so days and workouts change from week to week. The total load stays on track. Constraints: Pilates is only Tue/Thu, BodyPump only Fri, so the variety comes from moving runs, gym and hikes, swapping Pilates days, and occasionally replacing BodyPump with a gym strength session.

### Example 4-week block, Phase 1

H = hard, L = light. All checked against the "no two hard days in a row" rule, including across week boundaries.

| Week | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| **A** | Rest | Pilates 17:00 (L) | Run, flat (H) | Rest | BodyPump 17:00 (H) | Rest | Run, longer (H) |
| **B** | Rest | Run, hilly (H) | Rest | Pilates 17:00 (L) | BodyPump 17:00 (H) | Rest | **Sv. Peter** (H) |
| **C**, "Saturday week" | Rest | Gym legs 16:00 + Pilates 17:00 (H) | Rest | Run, trail (H) | Rest | **Sv. Peter** (H) | Rest / walk |
| **D**, easy week | Rest | Pilates 17:00 (L) | Run, short (H) | Rest | BodyPump 17:00 (H) | Rest | Easy walk (L) |

Week C replaces BodyPump with a gym strength session, which frees Saturday for the mountains.

### Example 4-week block, Phase 2+ (gym added)

| Week | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| **A** | Gym: stairs + legs (H) | Pilates 17:00 (L) | Run (H) | Rest | BodyPump 17:00 (H) | Rest | **Hike** (H) |
| **B** | Rest | Run, hilly (H) | Gym: easy bike + mobility (L) | Pilates 17:00 (L) | BodyPump 17:00 (H) | Rest | **Hike** (H) |
| **C** | Rest | Gym legs 16:00 + Pilates 17:00 (H) | Rest | Run (H) | Rest | **Long hike** (H) | Easy walk (L) |
| **D**, easy week | Rest | Pilates 17:00 (L) | Run, short (H) | Rest | BodyPump 17:00 (H) | Rest | Short hike or walk (L) |

### What rotates
- **Template order** is shuffled every block (e.g. B-A-C-D, then C-B-A-D). The easy week D always stays 4th. **Never the same layout two weeks in a row.**
- **Run types:** flat easy, hilly, trail, "finish strong" (last km a bit faster), new route. Routes around Radovljica vary: Sava riverside, Lesce, toward Begunje.
- **Gym workouts:** rotation of 3 sessions:
  - **G1** stair machine + leg press + step-ups
  - **G2** incline treadmill + slow step-downs (eccentric, for knee control on descents) + glutes/hamstrings
  - **G3** easy bike + core + mobility (used as a light day or when the knee is irritated)
- **Hikes:** alternate destinations and paths up (Sv. Peter / Roblek / Begunjščica / Stol, and Ratitovec occasionally for variety in Phase 3).
- **Pilates:** alternates between Tue and Thu.

---

## 7. Hikes, benchmarks and conditions

### Benchmarks
- **Sv. Peter benchmark** (~monthly, Phases 1–2). The first ascent sets the baseline time. Progress target: **two ascents in a row without slowing much**.
- **Roblek steady-pace test** (Phase 2–3): hold an even pace for the whole climb.
- **Stol rehearsal** (late May / early June): target **≥ 280 m/h** sustained over ~1,500 m. This is the clearest predictor of the Triglav 5.5 h.
- The **Triglav dashboard** shows the trend of metres climbed per hour on long climbs against the 280 m/h target line.

### Snow, ice and conditions
- In snowy or icy conditions the app shows a **gear reminder: microspikes + poles**. Roblek stays in the plan all winter.
- **Backup options** are offered only in heavy fresh snow or avalanche danger: Sv. Peter repeats, or 45–60 min on the gym stair machine. Choosing a backup **never counts as a skip**.
- Begunjščica and Stol are suggested from spring, once the user confirms conditions are OK.

---

## 8. Knee protection

- **Trekking poles on every descent** (pre-hike checklist reminder).
- **Descents are never timed.** Only the ascent counts toward pace.
- After every hike and run the app asks: **"How did the knee feel (going down)?"** (fine / a bit / sore).
  - **Sore twice in a row:** the next week gets less climbing, the run is swapped for G3 (bike), and BodyPump leg tracks are flagged "go light".
  - If it stays sore, the app suggests seeing a physiotherapist.
- Strength focus (BodyPump, G1, G2) includes slow step-downs and controlled lowering, which build the eccentric strength needed for descents.
- No high-impact classes (see §4).

---

## 9. Skips and mountain days

- **Skip a session:** one tap, with a reason (mountains / busy / tired / sick).
- **Block dates ahead:** mark a day or a date range (e.g. a weekend in the mountains). The week is planned around it.
- **Log your own mountain day** (GPS or manual: duration, elevation gain, effort). It counts as training and **replaces the planned hike or run**. The day after a big mountain day is automatically easy or rest.
- **After a skip** the app tries to move the session to the next free slot that respects the rules. If there isn't one, it is dropped. **No penalty:** the progression simply holds.
- **Streaks** count weeks with ≥ 2 completed sessions, so one skip doesn't break a streak.

---

## 10. App features

### Main screens
1. **Today**: today's session with details (class + time, run distance and type, gym workout, hike suggestion + gear reminder), and buttons to start tracking, book or skip.
2. **Week**: calendar view of the current week, with drag to move sessions (rules are validated).
3. **Plan**: phases, upcoming weeks, Triglav countdown.
4. **Track**: GPS recording for runs and hikes (distance, time, elevation gain, metres climbed/h, map).
5. **Progress / Triglav dashboard**: benchmark trend, m/h vs target, weekly load, streaks, distance and climbing totals.
6. **Log**: history of all sessions with effort and knee ratings.

### After-session check-in
- Effort 1–10 (RPE)
- Knee: fine / a bit / sore
- Optional note

### Training load
- **Load = effort (1–10) × duration (min)**, the same for every session type.
- Weekly load chart. A load jump of more than ~30% over the previous week triggers a warning and an easier next session.

### Booking (option 1: hand off to Passsport!)
- The app suggests a specific class ("BodyPump, Fri 17:00").
- **"Book"** opens Passsport! (deep link if supported, otherwise the app home screen). The user confirms there.
- The user marks the class as booked in the app (one tap). No automation of the Passsport! account and no stored credentials.

### Notifications
- Reminder on session days (~14:00)
- Sunday evening: preview of next week
- Gear reminder the evening before a winter hike

---

## 11. Data model

```
User
  ├─ profile: home, gym, injuries, equipment
  ├─ Goal: Triglav, date 2027-06-27, target 5.5 h / ~1,500 m (≈280 m/h)
  ├─ Plan
  │    ├─ Phase[] (name, start, end, focus)
  │    └─ Week[] (template id, isEasyWeek)
  │         └─ PlannedSession[] (day, type, details, status: planned/done/skipped/moved)
  └─ Session[]  (shared: date, durationMin, effort, kneeRating, load, note)
       ├─ ClassSession   → classTypeId, scheduleSlotId, booked
       ├─ RunSession     → distanceKm, runType, gpsTrack
       ├─ GymSession     → workoutId (G1/G2/G3)
       └─ HikeSession    → destination, elevationGainM, ascentTimeMin, mPerHour, gpsTrack, conditions

ClassType      → name, impact (low/med/high), legHeavy, allowed
ScheduleSlot   → classTypeId, weekday, start, end (4P timetable, editable)
Destination    → name, approxGainM, winterNote
BlockedDate    → date range, reason
```

---

## 12. Technology

| Area | Choice | Why |
|---|---|---|
| App | **React Native (Expo)** | One codebase for iPhone (and Android later). Background GPS. |
| Tracking | Phone **GPS + barometric altimeter** (iPhone) | No watch needed. Accurate elevation gain. |
| Health data | Apple HealthKit (optional) | Saves workouts to Apple Health |
| Storage | Local-first (SQLite) with optional cloud backup (Supabase) | Works offline in the mountains |
| Maps | Mapbox or Apple Maps | Run and hike tracks |
| Weather / conditions | Public forecast API (e.g. ARSO data) | Snow and ice hints for winter hikes |
| Language | Slovenian + English | |

The **plan generator** is a rules engine (§3, §6, §8, §9). It picks a template, fills in sessions, validates the hard/light and knee rules, and re-plans after skips, blocks and check-ins.

---

## 13. Build scope

### MVP
- Profile, goal, phases and the plan generator with week templates and variety
- 4P timetable (manual data entry) and class suggestions
- Today / Week / Log screens
- GPS tracking for runs and hikes (distance, elevation, m/h)
- Check-in (effort + knee) and adaptive rules
- Skip, block dates, log a mountain day
- Passsport! hand-off button

### Later
- Triglav dashboard with benchmark trends
- Weather and conditions hints
- Apple Health sync
- Notifications
- Timetable update helper (re-enter from a screenshot)

---

## 14. Decisions log

| Decision | Choice |
|---|---|
| Booking | Option 1: hand off to Passsport!, no automation |
| Class time | Classes finish by 18:00 on weekdays. No limit on weekends (no weekend classes at 4P). |
| Runs | Max 5 km, distance only (no run/walk instructions) |
| Training hills | Sv. Peter nad Begunjami (benchmark), Roblek (winter with microspikes), Begunjščica, Stol. **Not Dobrča.** Not Šmarna gora (lives in Radovljica). |
| Weekly structure | Varies week to week, never the same layout twice in a row |
| Gym | 4P open gym used for stairs and leg strength sessions |
| Tracking | Built in (phone GPS + altimeter). No watch, no third-party apps. |
| Triglav | Pokljuka → summit in 5.5 h (ascent only), end of June 2027 |
