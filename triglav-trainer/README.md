# Triglav Trainer

Personal training app: 4P Fitness classes, flat outdoor runs, gym and Gorenjska hikes, building toward **Triglav from Pokljuka in 5.5 h (27 June 2027)**. It also plans two daily German study blocks and syncs everything to the iPhone calendar.

The full specification is in [`../DESIGN.md`](../DESIGN.md).

## Run it on your iPhone (Expo Go)

You need a computer with [Node.js](https://nodejs.org) (LTS) and the **Expo Go** app on the iPhone.

```bash
cd triglav-trainer
npm install
npx expo start
```

Scan the QR code with the iPhone camera, and the app opens in Expo Go. Phone and computer must be on the same Wi-Fi (or use `npx expo start --tunnel`).

To get a standalone app on the home screen, build it with EAS (`npx eas-cli@latest build --platform ios`). This needs an Apple Developer account.

## What's in it

| Tab | What it does |
|---|---|
| **Today** | Today's session, daily weather check (outside / better time / treadmill / move), Passsport! booking link, GPS tracking, check-in, German blocks, tomorrow's checklist |
| **Week** | Week plan, edit singing day / home days / blocked days / ballet, skip or block a day, re-plan, **Add to calendar** |
| **Triglav** | Phases, climbing pace vs 280 m/h, Sv. Peter benchmark, weekly load, streaks |
| **Log** | All check-ins, plus logging your own activities (e.g. a mountain day) |
| **Settings** | Home days, calendars, German, tracking, sick mode, travel, Boot Camp |

Every Sunday (or whenever a week isn't planned yet) the app asks for the **singing day** and **home days**, then builds the week.

## Development

```bash
npm test           # planner and scheduling rules (vitest)
npm run typecheck  # TypeScript
npx expo start --web
```

Code layout:
- `src/domain/`: pure logic, with no React Native imports. `planner.ts` is the week rules engine, `engine.ts` holds adaptive rules and state updates, `timeline.ts` covers commute, ballet and German blocks, `weather.ts` has the Open-Meteo verdicts, and `data.ts` holds the 4P timetable, hikes and phases.
- `src/services/`: iPhone calendar (`expo-calendar/legacy`, works in Expo Go) and GPS + altimeter tracking.
- `src/screens/`, `src/components/`, `src/ui/`: the UI.

## Known limits (v1)

- Tracking runs in the foreground: keep the app open (the screen stays on). Background tracking needs a custom build.
- Weather needs an internet connection (Open-Meteo). The ARSO avalanche bulletin isn't integrated; the app reminds you to check it.
- No offline map display yet. Tracking itself works offline.
- The 4P timetable is built in (`src/domain/data.ts`). Update it there when 4P changes the schedule.
- English only for now.
