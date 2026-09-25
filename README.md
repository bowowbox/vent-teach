# VentTeach

An interactive web app for teaching **basic ventilator settings** and **patient–ventilator dyssynchrony** to medical students, nurses, and residents.

Every waveform is generated live by a single-compartment respiratory model (the equation of motion), so dyssynchronies are not drawn by hand — they **emerge from the physics** of timing mismatches between the patient and the ventilator. Learners can watch an asynchrony appear and then change a setting and watch it resolve.

> ⚠️ **Educational use only.** This is a simplified teaching model, not a validated clinical device. Do not use it for patient-care decisions.

## Features

- **Learn** — six guided fundamentals (anatomy of a breath, modes, oxygenation, ventilation, lung-protective ventilation, triggering & cycling), each with one-click "Try this" scenarios that load into the live waveforms.
- **Sandbox** — free-play simulator with every setting: mode (VC-AC, PC-AC, PSV, CPAP), FiO₂, PEEP, rate, tidal volume, flow, pressures, trigger type/sensitivity, plus lung phenotype (normal / ARDS / COPD / severe ARDS) and patient effort.
- **Dyssynchrony** — six annotated asynchronies (ineffective triggering, double triggering, flow starvation, reverse triggering, auto-triggering, delayed cycling) with mechanism, recognition cues, and fixes you apply live.
- **Challenges** — identify-the-asynchrony then fix-it assessment; the app checks the learner's correction in real time.
- **Session** — a live two-device exercise joined by a short code: the instructor drives the patient (compliance, resistance, effort) and the monitor (HR, BP, SpO₂, RR, temp, and blood gases on request), while the learner sees only the waveforms, the telemetry and the vital signs, and has to titrate the ventilator. Requires a Firebase project — see [Session sync](#session-sync-two-device-teaching).
- **Evidence panels** — every module cites primary literature (curated from a Zotero library) with DOI links.

## Getting started

Requires Node.js 18+ (developed on Node 24).

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check and produce a production build in dist/
npm run preview  # preview the production build locally
```

## Session sync (two-device teaching)

The **Session** tab links an instructor and a learner on two devices through a
[Firebase Realtime Database](https://firebase.google.com/docs/database). Everything else
in the app is offline and needs no setup; only this tab does.

Without configuration the Session tab shows setup instructions instead of a lobby, and the
other five tabs behave exactly as before.

**1. Create the database.** In a free Firebase project, add a Realtime Database.

**2. Set four environment variables.** Copy `.env.example` to `.env` for local
development, and add the same four in Netlify under *Site configuration → Environment
variables*:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
```

These are public client identifiers, not secrets — they are readable in any deployed
bundle, which is normal for Firebase web apps.

**3. Apply database rules** scoped to `/sessions` only:

```json
{
  "rules": {
    "sessions": {
      "$code": { ".read": true, ".write": true }
    }
  }
}
```

> **What this trades away.** These rules are open, so the six-character join code is the
> only access control: anyone who guessed a live code could read or disturb that session.
> For a teaching simulator that holds no patient data this buys zero-friction joining at
> acceptable cost, and the code space is about 8.9 × 10⁸. If that is not acceptable in your
> setting, add Firebase Anonymous Auth and require an authenticated `uid` in the rules.

### How a session works

One person presses **Start as instructor** and reads out the code; the other enters it
under **Join as learner**. Each node has exactly one writer, so the two sides never fight:

| Node | Written by | Seen by the other side as |
|---|---|---|
| `patient/lung`, `patient/effort` | instructor | applied to the engine, **never displayed** |
| `vitals` | instructor | the monitor strip |
| `abg/result` | instructor | the released blood gas |
| `vent` | learner | the instructor's read-only ventilator summary |
| `telemetry` | learner | the instructor's telemetry bar |
| `abg/request` | learner | a badge on the instructor's ABG panel |

The learner never sees the compliance or effort numbers — inferring a stiff lung from a
rising plateau pressure is the exercise. Plateau pressure, peak pressure, tidal volume and
auto-PEEP are always computed by the engine from the instructor's patient settings and the
learner's ventilator settings, so they cannot be faked and always respond to what the
learner does. Vital signs and blood gases are the instructor's to choose, because the
engine models respiratory mechanics only and has no gas exchange or haemodynamics.

Both devices run their own copy of the engine, so the two tracings match in shape but not
in phase. The numbers on the instructor's telemetry bar are the learner's real measured
values, streamed up from their machine.

Firebase itself loads only when you open a session — it is a separate lazy-loaded chunk, so
the other tabs do not download it.

## Deploying

The build output in `dist/` is fully static — host it anywhere:

- **Netlify / Vercel / Cloudflare Pages** — point at the repo; build command `npm run build`, publish directory `dist`. Add the four `VITE_FIREBASE_*` variables if you want the Session tab to work.
- **University web server / GitHub Pages** — upload the contents of `dist/`. The Vite `base` is set to `./` so it works from a subdirectory.

## How the model works

Each breath is integrated in real time from:

```
Paw + Pmus = PEEP + (V / C) + (R · Q)
```

where `V` is volume above the resting end-expiratory volume, `C` is compliance, `R` is resistance, `Q` is flow, and `Pmus` is patient inspiratory muscle pressure. Volume-controlled breaths fix flow and solve for pressure; pressure-targeted breaths (PC/PSV) and expiration fix pressure and solve for flow. Triggering against auto-PEEP, neural-vs-ventilator timing, and cardiogenic oscillation are all explicit, which is why ineffective/double/reverse/auto triggering and flow/cycle asynchronies fall out of the same equations.

## Project structure

```
src/
  engine/        physiology + ventilator simulation (framework-agnostic; verified with
    types.ts        ad-hoc headless driver scripts, not an automated suite)
    simulation.ts   the VentSim stepper (equation of motion, triggering, cycling)
    presets.ts      default settings + lung phenotypes
  store/         Zustand store + the single shared VentSim instance
  session/       two-device teaching sessions: join codes, Firebase sync, ABG helpers
  components/    waveform canvas, control panels, telemetry, vitals, shared UI
  content/       lessons, dyssynchrony scenarios, references (from Zotero)
  views/         Learn / Dyssynchrony / Challenge / Session / About screens
```

The `engine/` directory imports nothing from React, which is what lets it be driven
headlessly for verification and run identically on both devices in a session.

## Tech

React 18 · TypeScript · Vite · Tailwind CSS · Zustand · HTML canvas (custom 60 fps waveform renderer) · Firebase Realtime Database (lazy-loaded, Session tab only).

## Attribution

References are curated from the educator's Zotero library. Built as an open teaching resource.
