# Triglav Trainer: Design Document

> A personal fitness tracking app that combines **4P Fitness group classes (vodene vadbe)**, **running**, **gym** and **mountain hikes** into one adaptive plan, building toward **climbing Triglav from Pokljuka in 5.5 hours at the end of June 2027**.

Status: **design only**, not implemented yet.

---

## 1. User profile and goal

| Item | Value |
|---|---|
| Home | Radovljica |
| Work | Office in Ljubljana 3 days/week, **working from home in Radovljica 2 days/week** |
| Commute | Car, up to **45 min each way** Radovljica ↔ Ljubljana. 4P is a 10 min walk from the office. |
| Fixed commitments | **Adult ballet class every Wednesday 17:30–18:30 at BTC Ljubljana** (no other workout that day; can be skipped). **Singing lesson once a week**, on a different day Mon–Thu each week. |
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
| **Outdoor first** | Runs are **outside, on flat routes** whenever the weather allows. The 4P treadmill is only a bad-weather fallback. |
| **Daily weather check** | Every outdoor run and hike is checked against the forecast each day (see §8). |
| **Unavailable days** | **Wednesday is always off** (ballet). **One more day Mon–Thu is off each week** (singing lesson), chosen weekly. Extra days can be blocked any time. See §3.2. |
| Weekly volume | Ballet + **4 sessions** as the target (Phase 1: 2 classes + 2 runs, hike can replace the Sunday run. Phase 2+: strength, Pilates, run, hike). Weeks where the free days don't allow 4 get 3, which is fine. |
| Hard and light days | Hard: run, hike, BodyPump, Boot Camp, gym (legs). Medium: **ballet** (counts in the weekly load, not as a hard day unless rated effort ≥ 7). Light: Pilates, easy bike, walk. **Never two hard days in a row**, including across the weekend boundary (Sun → Mon). |
| Knee | No leg-heavy session the day before a run or hike. No high-impact classes. |
| **Variety** | **The same weekly layout is never repeated two weeks in a row.** Days, run types, gym workouts and hikes rotate (see §6). |
| Easier weeks | Every 4th week is lighter (~30% less volume). |
| **Location** | **Office days (Ljubljana):** 4P classes and gym. **Home days (Radovljica):** outdoor runs and, from spring, short hikes after work. **No home strength workouts** (only an optional ≤ 15 min Pamela Reif video). See §3.1. |

### 3.1 Office days and home days

The user works from the Ljubljana office 3 days a week and from home in Radovljica 2 days a week. The app plans each day around **where the user actually is**.

| | Office day (Ljubljana) | Home day (Radovljica) |
|---|---|---|
| 4P classes (Pilates, BodyPump, Boot Camp) | ✅ Only here | ❌ |
| 4P gym (stairs, leg press, treadmill) | ✅ | ❌ |
| Outdoor flat run | Possible (run in Radovljica after the commute) | ✅ **Preferred**: no commute, more daylight |
| Optional short video (see below) | – | Optional, max 15 min, never required |
| Short weekday hike (Sv. Peter) | – | ✅ From ~April, when it's light after 16:00 |
| Bad-weather fallback for runs | 4P treadmill | Move the run to an office day, or rest |

**Setting the home days:**
- In settings: **fixed home days** (e.g. always Mon + Thu), or **pick them each week** in the Sunday-evening planning prompt (§3.2).
- Changing a home day re-plans the rest of the week.

**Rules when home days clash with classes:**
- Pilates is on Tue and Thu, so at least one of them is usually an office day. If both are home days, Pilates is dropped that week.
- If **Friday is a home day**, BodyPump isn't possible. It is replaced by **gym G1 on another office day** (rules permitting), or dropped that week.
- Boot Camp (Mon only, since Wednesday is ballet) is only suggested if Monday is an office day.

**No home strength workouts.** Strength happens at 4P (BodyPump, Boot Camp, gym). The only home option is:
- **Optional Pamela Reif video, max 15 min** (e.g. a short legs, booty or abs workout from her YouTube channel). The app can offer it on a home day when a strength session couldn't be placed at 4P. It's **always optional**, never counts as a missed session if skipped, and the app prefers low-impact (no-jump) videos because of the knee.

The example weeks in §6 show the structure only. When the real home days are known, the generator applies the rules above: a gym session on a home day moves to an office day (or is dropped), a class on a home day moves to its other weekday (Pilates Tue ↔ Thu) or is replaced, and runs move to home days where possible. All hard/light and knee rules still apply.

### 3.2 Ballet, singing and other unavailable days

**Wednesday: ballet (fixed).**
- No other workout is ever planned on Wednesday.
- Ballet is logged automatically as a session (can be confirmed or skipped) with the usual check-in: effort and knee. It counts toward the weekly load. It's good training for balance, ankle and knee stability and core.
- If ballet was rated hard (effort ≥ 7) or the knee was sore, Thursday is kept light.

**Singing lesson: one day Mon–Thu, chosen each week.**
- **Sunday-evening planning prompt:** *"Next week: which day is singing? Which days are you working from home?"* Two quick taps, then the app builds the week.
- If the singing day changes during the week, the user moves it in the app and the rest of the week is re-planned.
- A day can be marked **fully off** (default) or **"evening only"** if the lesson is late and a workout before it is possible. Only fully off is used unless the user changes it.

**Any other day** can be blocked at any time (one tap, optional reason). This works exactly like the singing day.

**What this means for the plan:**
- Weekdays available for workouts each week: **Mon, Tue, Thu, Fri minus the singing day**, plus Saturday and Sunday.
- Monday is only used for a hard session (run, gym, Boot Camp) when the Sunday before was light. Otherwise Monday is rest.
- When the free days don't fit 4 sessions with the hard/light rules, the app plans 3 and **drops the least important session for that phase** (Phase 1: second run first. Phase 2+: Pilates first, then the run). The hike and the strength session are kept.
- A week that ends up with only 3 sessions **can count as that block's easy week**, so the plan doesn't stack an extra easy week on top.

---

## 4. 4P classes

Source: 4P Fitnes klub Ljubljana timetable (screenshot, Oct 2026). There are **no weekend classes**.

### Classes that fit the rules (finish by 18:00, knee-friendly)

| Class | When | Role |
|---|---|---|
| **Pilates** | Tue 17:00–18:00, Thu 17:00–18:00 | Core, stability, light day |
| **BodyPump** | Fri 17:00–18:00 | Main strength class: squats and lunges for climbing and controlled descents. Lighter weights on leg tracks at first. |

### Trial class: Boot Camp

| Class | When | Role |
|---|---|---|
| **Boot Camp** | **Mon 17:00–18:00** (the Wed slot clashes with ballet) | **Trial from week 5 (from 30 Nov 2026)**, about every other week, when Monday is free and the Sunday before was light. Hard, leg-heavy day. |

Boot Camp includes jumping, so it is introduced carefully:
- **Trial period (weeks 5–8):** about every second week. Tell the instructor about the knee and **use the low-impact options** (step instead of jump).
- After each Boot Camp the knee check-in matters most. **Knee sore once → next Boot Camp skipped. Sore twice → Boot Camp paused** and replaced by BodyPump or gym G1.
- **After the trial** the app asks: *Keep Boot Camp?* If yes, it can appear up to once a week. If no, it is removed from the rotation.
- In Phase 1, a Boot Camp week replaces one run. In Phase 2+, it takes the gym session's place.

### Excluded

| Class | Reason |
|---|---|
| Hyrox prep (Thu 16:00), BodyAttack, FatBurner | High impact / jumping, bad for the knee |
| BodyPump Mon/Wed 18:00, Spin, BodyStep, Yogalates, BodyShape, Core | Finish after 18:00 |
| Fit in zdravi (Tue/Thu 09:30), early morning classes | Outside the preferred time |

The timetable is stored as editable data so it can be updated when 4P changes the schedule (see §15).

---

## 5. Training phases

34 weeks, from Mon 2 Nov 2026 to Triglav on Sun 27 Jun 2027.

| Phase | Dates | Weeks | Focus |
|---|---|---|---|
| **1. Base** | 2 Nov – 27 Dec 2026 | 8 | Build the habit. Pilates, BodyPump, runs 2 → 5 km, Sv. Peter. **Boot Camp trial from week 5.** |
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
| Phase 2+ | 3–5 km, flat, varied types (see §6) | usually replaced by a hike |

If a week was rated hard (effort ≥ 8) or the knee complained, the week is repeated instead of moving on.

### Hike progression (elevation gain)

| Period | Typical hike | Climb (approx.) |
|---|---|---|
| Nov–Dec | **Sv. Peter nad Begunjami** | ~400–450 m |
| Jan | **Kofce** (from Podljubelj, ~25 min drive) or a first, relaxed **Roblek** | ~600–1,000 m |
| Feb–Mar | **Roblek** (from Begunje / Draga) | ~1,000 m |
| Apr | **Begunjščica** | ~1,400 m |
| May – early Jun | **Stol** (from Završnica) = Triglav rehearsal | ~1,500 m+ |
| Jun | Taper: one medium hike, then **Triglav** | ~1,500 m |

Climbing figures are estimates. The app replaces them with real GPS values after the first hike.

---

## 6. Weekly variety

The app builds each week from scratch every Sunday evening, using that week's free days (§3.2), home days (§3.1), the phase and the weather. Because the singing day moves and different week types rotate, **weeks naturally change**. On top of that, the app makes sure **no two consecutive weeks have the same layout**.

Building blocks:
- **"Friday pump" week:** BodyPump on Friday, hike or long run on Sunday.
- **"Saturday mountains" week:** a gym strength session (16:00) + Pilates (17:00) on Tuesday or Thursday replaces BodyPump. This frees **Saturday for the mountains**, and a light Sunday opens **Monday** for a hard session in the following week (e.g. Boot Camp).
- **Easy week:** every ~4th week, or a week that is naturally short because of blocked days.

### Example: first 5 weeks (Phase 1)

H = hard, M = medium, L = light, ♪ = singing day (off). Checked against the rules: no two hard days in a row (including Sun → Mon), Wednesday always ballet, classes finish by 18:00.

| Week | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| **1** (♪ Mon) | ♪ | Run 2 km (H) | Ballet (M) | Pilates 17:00 (L) | BodyPump 17:00 (H) | Rest | Run 2.5 km (H) |
| **2** (♪ Thu) | Rest | Gym legs 16:00 + Pilates 17:00 (H) | Ballet (M) | ♪ | Run 2.5 km (H) | Rest | **Sv. Peter** (H) |
| **3** (♪ Tue), short week = easy week | Rest | ♪ | Ballet (M) | Pilates 17:00 (L) | BodyPump 17:00 (H) | Rest | Run 2.5 km (H) |
| **4** (♪ Mon), Saturday mountains | ♪ | Run 3 km (H) | Ballet (M) | Gym legs 16:00 + Pilates 17:00 (H) | Rest | **Sv. Peter** (H) | Walk (L) |
| **5** (♪ Thu), first Boot Camp | **Boot Camp 17:00** (H) | Pilates 17:00 (L) | Ballet (M) | ♪ | BodyPump 17:00 (H) | Rest | Run 3.5 km (H) |

Week 4 ends with a light Sunday, so week 5 can start with Boot Camp on Monday. In week 5 Boot Camp replaces one run (§4).

### Example: 4 weeks in Phase 2

| Week | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| **A** (♪ Mon) | ♪ | Run 4 km (H) | Ballet (M) | Pilates 17:00 (L) | BodyPump 17:00 (H) | Rest | **Hike: Roblek** (H) |
| **B** (♪ Thu) | Rest | Gym G2 16:00 + Pilates 17:00 (H) | Ballet (M) | ♪ | Run 5 km (H) | Rest | **Hike: Kofce** (H) |
| **C** (♪ Tue), Saturday mountains | Rest | ♪ | Ballet (M) | Gym G1 16:00 + Pilates 17:00 (H) | Rest | **Long hike** (H) | Walk (L) |
| **D** (♪ Thu), easy week | Run 3 km **or Boot Camp** (H) | Pilates 17:00 (L) | Ballet (M) | ♪ | BodyPump 17:00 (H) | Rest | Short hike or walk (L) |

These are examples. The real weeks depend on the singing day, home days and weather chosen each week.

### What rotates
- **Week type** alternates between "Friday pump" and "Saturday mountains" as the free days allow. **Never the same layout two weeks in a row.**
- **Run types (all flat, outside):** easy, longer, "finish strong" (last km a bit faster), new route. The app rotates flat routes around Radovljica and Lesce (e.g. along the Sava) and learns your favourites from GPS.
- **Monday hard sessions** (gym or Boot Camp) are only placed after a light or rest Sunday.
- **Location swap:** gym sessions are only placed on office days, and runs are moved to home days when possible (see §3.1).
- **Gym workouts:** rotation of 3 sessions:
  - **G1** stair machine + leg press + step-ups
  - **G2** incline treadmill + slow step-downs (eccentric, for knee control on descents) + glutes/hamstrings
  - **G3** easy bike + core + mobility (used as a light day or when the knee is irritated)
- **Hikes:** alternate destinations and paths up (Sv. Peter / Kofce / Roblek / Begunjščica / Stol, and **Golica** (from Planina pod Golico, ~25 min drive, ~900 m) for variety in spring). All starting points are **within ~30 min drive of Radovljica**.
- **Pilates:** Tue or Thu, whichever isn't the singing day. Alternates when both are free.

---

## 7. Hikes, benchmarks and conditions

### Benchmarks
- **Sv. Peter benchmark** (~monthly, Phases 1–2). The first ascent sets the baseline time. Progress target: **a steadily faster single ascent at the same effort**. One ascent per day, never repeats.
- **Roblek steady-pace test** (Phase 2–3): hold an even pace for the whole climb.
- **Stol rehearsal** (late May / early June): target **≥ 280 m/h** sustained over ~1,500 m. This is the clearest predictor of the Triglav 5.5 h.
- The **Triglav dashboard** shows the trend of metres climbed per hour on long climbs against the 280 m/h target line.

### Snow, ice and conditions
- In snowy or icy conditions the app shows a **gear reminder: microspikes + poles**. Roblek stays in the plan all winter.
- **Backup options** are offered only in heavy fresh snow or avalanche danger: a single Sv. Peter ascent, or 45–60 min on the gym stair machine. Choosing a backup **never counts as a skip**.
- Begunjščica and Stol are suggested from spring, once the user confirms conditions are OK.

### Backpack weight
On Triglav the pack will weigh about **6–8 kg** (water, food, ferrata set, helmet, layers). Hikes build up to it so race day doesn't feel heavier than training:

| Period | Pack on hikes |
|---|---|
| Nov–Feb | Normal day pack (~3–4 kg) |
| Mar | ~5 kg (add water bottles) |
| Apr–May | ~6–7 kg |
| Stol rehearsal | **Full Triglav pack** incl. ferrata set and helmet |

The app shows the target pack weight on the hike card and asks after the hike how it felt. If the knee complained, the pack weight goes back down a step.

### Eating and drinking on long hikes
On hikes longer than ~2.5 h (from Roblek onward) the app treats eating and drinking as part of the training:
- **Reminders during tracking:** drink every ~20–30 min, small snack every ~45–60 min. Discreet vibration, can be turned off.
- **After the hike:** quick log of what was eaten and drunk, how energy felt (good / dipped / ran out) and when.
- Over the spring the app builds the user's **personal Triglav fuelling plan** (what works, how much water to carry, where to refill at huts) from these logs.

---

## 8. Daily weather check

The app checks the forecast **every day** for that day's outdoor session, and the **evening before** for hikes.

### Runs (outside, flat)
| Forecast at run time | Action |
|---|---|
| OK (dry or light drizzle, no storm, above about −5 °C, no ice on paths) | **Run outside** |
| Bad window only (e.g. rain 16:00–18:00) | Suggests a better time today, or moves the run to the next suitable day (rules permitting) |
| Bad all day (heavy rain, storm, strong wind, icy paths, extreme heat) | **Treadmill at 4P** (flat, same distance) as a fallback. Outside is always preferred. |

Winter extras: after 16:00 it's dark from November, so the app reminds you about a **headlamp and reflective gear**, and warns about icy paths after freezing nights.

### Hikes and mountains
| Check | Action |
|---|---|
| Rain, fog or thunderstorms | Move the hike to the other weekend day or the next suitable day |
| Summer afternoon thunderstorms (Apr–Jun) | Suggests an **early start** and a turnaround time |
| Snow or ice | Gear reminder: **microspikes + poles** |
| Heavy fresh snow or avalanche danger | Backup: lower destination (e.g. Sv. Peter) or gym stair machine |
| Strong wind on ridges (Stol, Begunjščica) | Suggests a sheltered alternative |

Data sources: national weather service forecasts (ARSO / meteo.si), the ARSO avalanche bulletin in winter, and a general forecast API (e.g. Open-Meteo) for hourly data at the exact location and altitude.

Weather swaps **never count as a skip**.

---

## 9. Knee protection

- **Trekking poles on every descent** (pre-hike checklist reminder).
- **Descents are never timed.** Only the ascent counts toward pace.
- After every hike and run the app asks: **"How did the knee feel (going down)?"** (fine / a bit / sore).
  - **Sore twice in a row:** the next week gets less climbing, the run is swapped for G3 (bike), and BodyPump leg tracks are flagged "go light".
  - If it stays sore, the app suggests seeing a physiotherapist.
- Strength focus (BodyPump, G1, G2) includes slow step-downs and controlled lowering, which build the eccentric strength needed for descents.
- No high-impact classes (see §4).

---

## 10. Skips and mountain days

- **Skip a session:** one tap, with a reason (mountains / busy / tired / sick).
- **Block dates ahead:** mark a day or a date range (e.g. a weekend in the mountains, a ballet performance, an extra singing lesson). The week is planned around it.
- **Log your own mountain day** (GPS or manual: duration, elevation gain, effort). It counts as training and **replaces the planned hike or run**. The day after a big mountain day is automatically easy or rest.
- **After a skip** the app tries to move the session to the next free slot that respects the rules. If there isn't one, it is dropped. **No penalty:** the progression simply holds.
- **Streaks** count weeks with ≥ 2 completed sessions, so one skip doesn't break a streak.

### Sick mode and travel mode
- **Sick mode:** one tap pauses the plan. When the user marks themselves healthy again, the app restarts gently: **two light days** (walk, Pilates) before hard sessions, and the first week back is an easy week. Longer illness (> 7 days) also repeats the last completed progression week.
- **Travel / holiday mode:** for trips and holidays (e.g. Christmas). The user picks the dates and what's available (*nothing / running only / hotel gym / mountains*). The app plans light sessions with what's there, or pauses. On return, sessions restart at the level before the break, or one step lower if the break was longer than 10 days.
- Neither mode counts as skips or breaks a streak.

---

## 11. Triglav day plan

The final weeks include a dedicated Triglav plan screen.

| Item | Detail |
|---|---|
| **Main date** | Sun, 27 June 2027 |
| **Backup dates** | Next weekend (3–4 July) and one more in early July. Snow near the summit or a storm can cancel the main date. |
| Weather window | From ~5 days before, the app watches the forecast for Pokljuka and the summit (thunderstorms, wind, freezing level, snow). **Go / wait / move** recommendation 2 days before. |
| Conditions | Reminder to check recent reports for snow on the upper part and the ferrata (PZS conditions, hut reports). |
| Start time | Suggested early start (e.g. 5:00–5:30 from Rudno polje) to be off the summit before afternoon storms. |
| **Pace plan** | Split times for the main points (e.g. Vodnikov dom, Planika, summit) based on the user's m/h from the Stol rehearsal, to stay on the 5.5 h target. |
| **Turnaround time** | A fixed time to turn back regardless of position, set together with the weather. |
| Huts | Optional reminder to book Vodnikov dom or Planika for an overnight or a rest stop. Check opening dates; some huts open only in late June. |
| Descent | Planned as easy and untimed: poles, short steps, knee check-in afterwards. |
| Fuelling | The personal fuelling plan from §7. Where to refill water. |
| Pack | Final checklist: ferrata set, helmet, layers, headlamp, power bank, first aid, documents. |

---

## 12. Battery and offline use

### Phone battery
The phone is the only tracker, so the app needs to last a full Triglav day:
- **Battery-saver tracking mode** for long hikes (lower GPS sampling, altimeter continues).
- Battery estimate at start: *"At this rate the battery lasts ~X h."*
- **Power bank** on the checklist for hikes > 3 h.

### Offline use
- **Offline maps** for all training hills and the Triglav route, downloaded in advance.
- Tracking, check-ins and the plan work fully **offline**. Sync happens when back online.

---

## 13. Preparation routines

### Gear checklists
Checklists per session type, shown the evening before:
- **Run (dark/cold):** headlamp, reflective vest, layers, gloves.
- **Winter hike:** microspikes, poles, warm layers, thermos, headlamp, power bank.
- **Summer hike:** water, sun protection, rain jacket, snacks.
- **Ferrata / Triglav:** ferrata set, helmet, gloves (+ the full Triglav list in §11).
- **New boots:** reminder to **break them in** on shorter hikes before the long ones (at least ~4 weeks before Stol).

### Warm-up and stretching
Short guided routines (with simple illustrations, timer):
- **Before runs** (5 min): leg swings, hip circles, easy skipping or brisk walk.
- **After runs and hikes** (5–10 min): calves, quads, hamstrings, hip flexors, glutes.
- Built into the session flow: warm-up is offered when tracking starts, stretching when it ends.

---

## 13a. Calendar sync and German study

### iPhone calendar
- The app writes planned sessions to a calendar the user picks on the iPhone (e.g. their Google calendar, which then syncs to Google Calendar). German blocks can go to a separate calendar.
- **Suggest first:** after the week is planned, the app shows the events and the user taps **"Add to calendar"**.
- When a session moves, is skipped or is dropped, its calendar event is updated or deleted.
- Existing calendar events are read so German blocks don't clash with them.

### Event times
| Session | Time in calendar |
|---|---|
| 4P class | Class time (e.g. 17:00–18:00) + 10 min walk each way |
| Gym + Pilates | 16:00–18:00 |
| Run on a home day | 16:00 (after work), ~45 min |
| Run on an office day | After the drive home (~17:30) |
| Ballet (Wed) | 17:30–18:30 at BTC, then the 45 min drive home |
| Hike (weekend) | Start ~08:00. Duration estimated from the climb (ascent at the user's pace + descent + breaks + drive). |

### German: two 30-minute blocks every day
| Day type | Window |
|---|---|
| Home day | From **15:00** to **20:30** |
| Office day | From **16:30** to **20:30** (after work; usually after the 45 min drive home) |
| Weekend | Any time, 09:00–20:30 |

Rules:
- Two blocks of **30 min each, minimum 30 min**. Never overlapping with workouts, the 4P walk, the commute, ballet or calendar events, with a 10 min buffer.
- **Block 1: textbook. Block 2: Duolingo (≥ 5 min) + review.**
- If a day really can't fit both blocks inside the window, the app shows it and suggests the best single block. The user can always **skip German** for a day (no penalty).
- German streak: days with at least one completed block.

### Skipping ballet
- Ballet can be skipped for a given week. If it's skipped in advance, the user can choose to **free Wednesday for training**, and the week is re-planned.

---

## 14. App features

### Main screens
1. **Today**: today's session with details, **weather verdict (outside / treadmill / move)**, (class + time, run distance and type, gym workout, hike suggestion + gear reminder), and buttons to start tracking, book or skip.
2. **Week**: calendar view of the current week, with drag to move sessions (rules are validated).
3. **Plan**: phases, upcoming weeks, Triglav countdown, Triglav day plan (§11).
4. **Track**: GPS recording for runs and hikes (distance, time, elevation gain, metres climbed/h, map).
5. **Progress / Triglav dashboard**: benchmark trend, m/h vs target, weekly load, streaks, distance and climbing totals.
6. **Log**: history of all sessions with effort and knee ratings.

7. **Settings**: recurring off days (Wednesday: ballet), weekly variable off day (singing, Mon–Thu), home/office days, units, language, data export.

### Motivation
- **Summit collection:** every training hill and peak reached gets a card (date, time, photo, m/h). Goal: complete all training hills before Triglav.
- **Badges**, e.g. first 5 km, 10 classes, first Boot Camp, first 1,000 m day, full Triglav pack carried, all training hills, Triglav summit.
- **Streaks** (weeks with ≥ 2 sessions, see §10).
- Monthly recap: sessions, km run, metres climbed, benchmark progress.

### After-session check-in
- Effort 1–10 (RPE)
- Knee: fine / a bit / sore
- Optional note
- After long hikes: energy, food and drink (see §7), pack weight feel

### Training load
- **Load = effort (1–10) × duration (min)**, the same for every session type.
- Weekly load chart. A load jump of more than ~30% over the previous week triggers a warning and an easier next session.

### Data export and backup
- **Export** all sessions and GPS tracks (CSV + GPX) at any time.
- **Automatic backup** (iCloud or the optional cloud account) so history survives a phone change.
- All data belongs to the user. No sharing without explicit action.

### Booking (option 1: hand off to Passsport!)
- The app suggests a specific class ("BodyPump, Fri 17:00").
- **"Book"** opens Passsport! (deep link if supported, otherwise the app home screen). The user confirms there.
- The user marks the class as booked in the app (one tap). No automation of the Passsport! account and no stored credentials.

### Notifications
- Reminder on session days (~14:00)
- Morning weather check for today's outdoor session; alert if the plan changes
- Gear checklist the evening before a hike or a dark run
- **Sunday evening planning prompt:** singing day + home days for next week, then a preview of the new week

---

## 15. Data model

```
User
  ├─ profile: home, gym, injuries, equipment
  ├─ WorkPattern: fixed home days or weekly choice; DayLocation[] (date, office / home)
  ├─ RecurringOffDay[]: weekday, reason (Wed: ballet)
  ├─ WeeklyOffDay[]: weekStart, day (Mon–Thu), reason (singing), fullDay / eveningOnly
  ├─ Goal: Triglav, date 2027-06-27, target 5.5 h / ~1,500 m (≈280 m/h)
  ├─ Plan
  │    ├─ Phase[] (name, start, end, focus)
  │    └─ Week[] (template id, isEasyWeek)
  │         └─ PlannedSession[] (day, type, details, status: planned/done/skipped/moved)
  └─ Session[]  (shared: date, durationMin, effort, kneeRating, load, note)
       ├─ ClassSession   → classTypeId, scheduleSlotId, booked
       ├─ RunSession     → distanceKm, runType, indoor (treadmill) flag, gpsTrack
       ├─ GymSession     → workoutId (G1/G2/G3)
       ├─ HikeSession    → destination, elevationGainM, ascentTimeMin, mPerHour, packKg, fuelLog, energy, gpsTrack, conditions
       ├─ VideoSession   → optional short Pamela Reif video (≤ 15 min), link, title
       └─ BalletSession  → auto-created each Wednesday, confirmed or skipped

ClassType      → name, impact (low/med/high), legHeavy, status (allowed / trial / excluded)
WeatherCheck   → date, sessionId, forecast, verdict (outside / treadmill / move / backup)
ScheduleSlot   → classTypeId, weekday, start, end (4P timetable, editable)
Destination    → name, approxGainM, winterNote
BlockedDate    → date range, reason
ModePeriod     → sick / travel, dates, availableOptions
TriglavPlan    → mainDate, backupDates[], startTime, turnaroundTime, splits[], hutBooking
Checklist      → sessionType, items[]
Badge          → id, earnedAt
SummitCard     → destinationId, date, photo, mPerHour
```

---

## 16. Technology

| Area | Choice | Why |
|---|---|---|
| App | **React Native (Expo)** | One codebase for iPhone (and Android later). Background GPS. |
| Tracking | Phone **GPS + barometric altimeter** (iPhone) | No watch needed. Accurate elevation gain. |
| Health data | Apple HealthKit (optional) | Saves workouts to Apple Health |
| Storage | Local-first (SQLite) with optional cloud backup (Supabase) | Works offline in the mountains |
| Maps | Mapbox or Apple Maps | Run and hike tracks |
| Weather / conditions | ARSO (meteo.si) + avalanche bulletin, Open-Meteo hourly API | Daily check for outdoor runs and hikes |
| Offline maps | Mapbox offline packs (or similar) | Mountains without signal |
| Language | Slovenian + English | |

The **plan generator** is a rules engine (§3, §3.1, §6, §8, §9, §10). It picks a template, fills in sessions, validates the hard/light and knee rules, and re-plans after skips, blocks and check-ins.

---

## 17. Build scope

### MVP
- Profile, goal, phases and the plan generator with week templates and variety
- **Office / home days** and location-aware planning
- **Off days:** Wednesday (ballet) fixed, weekly singing day, extra blocked days. Sunday-evening planning prompt
- 4P timetable (manual data entry) and class suggestions
- Today / Week / Log screens
- GPS tracking for runs and hikes (distance, elevation, m/h)
- Check-in (effort + knee) and adaptive rules
- Skip, block dates, log a mountain day
- Passsport! hand-off button
- Daily weather check with outside / treadmill / move decision
- Sick and travel mode
- Battery-saver tracking and offline use

### Later
- Triglav dashboard with benchmark trends
- Triglav day plan screen (needed by ~May 2027)
- Pack weight and fuelling tracking, personal fuelling plan
- Gear checklists, warm-up and stretching routines
- Summit collection, badges, monthly recap
- Data export and backup
- Apple Health sync
- Notifications
- Timetable update helper (re-enter from a screenshot)

### Success criteria for the MVP
The first version is done when the user can, for 4 consecutive weeks:
1. Open the app each day and see **one clear session** (or a clear rest/off day) that respects all rules (time window, hard/light, knee, office/home day, ballet and singing days, weather).
2. **Book** a suggested 4P class via the Passsport! hand-off in ≤ 2 taps.
3. **Track** a run and a hike with phone only, with distance, elevation gain and m/h within ~5–10% of known values.
4. **Skip**, block dates, change home days or switch to sick mode, and get a valid re-planned week immediately.
5. See that **no two weeks have the same layout** and no two hard days are back to back.
6. Use tracking fully **offline** on a hike, with sync afterwards.

---

## 18. Decisions log

| Decision | Choice |
|---|---|
| Booking | Option 1: hand off to Passsport!, no automation |
| Class time | Classes finish by 18:00 on weekdays. No limit on weekends (no weekend classes at 4P). |
| Runs | Max 5 km, distance only (no run/walk instructions). **Flat, outside**; treadmill only in bad weather. |
| Boot Camp | Trial from week 5 (~every other week, low-impact options), keep or drop after the trial |
| Weather | Checked daily for outdoor runs and hikes |
| Repeats | Never the same hill twice in one day |
| Training hills | All starts within ~30 min drive of Radovljica: Sv. Peter nad Begunjami (benchmark), Kofce, Roblek (winter with microspikes), Begunjščica, Golica, Stol. **Not Dobrča.** Not Šmarna gora (lives in Radovljica). |
| Weekly structure | Varies week to week, never the same layout twice in a row |
| Gym | 4P open gym used for stairs and leg strength sessions |
| Tracking | Built in (phone GPS + altimeter). No watch, no third-party apps. |
| Triglav | Pokljuka → summit in 5.5 h (ascent only), end of June 2027. Backup dates in early July. |
| Home workouts | None, except an optional Pamela Reif video of max 15 min |
| Safety features | Not included (no SOS, contact sharing or safety reminders) |
| Calendar | iPhone calendar (syncs to Google Calendar), suggest-then-confirm |
| German | 2 × 30 min daily: home days from 15:00, office days from 16:30, weekends any time, last block ends by 20:30. Skippable. |
| Off days | **Wednesday always off** (ballet, counted in load). **One more day Mon–Thu off each week** (singing), chosen in the Sunday prompt. Extra days blockable. |
| Location | 3 office days in Ljubljana (classes + gym), 2 home days in Radovljica (runs, short hikes; optional ≤ 15 min Pamela Reif video). Home days fixed or chosen weekly. |
| Extras | Backpack weight progression, fuelling practice, sick/travel mode, Triglav day plan, battery + offline, gear checklists, warm-up/stretching, motivation, data export |
