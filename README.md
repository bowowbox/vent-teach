# VentTeach

An interactive web app for teaching **basic ventilator settings** and **patient–ventilator dyssynchrony** to medical students, nurses, and residents.

Every waveform is generated live by a single-compartment respiratory model (the equation of motion), so dyssynchronies are not drawn by hand — they **emerge from the physics** of timing mismatches between the patient and the ventilator. Learners can watch an asynchrony appear and then change a setting and watch it resolve.

> ⚠️ **Educational use only.** This is a simplified teaching model, not a validated clinical device. Do not use it for patient-care decisions.

## Features

- **Learn** — six guided fundamentals (anatomy of a breath, modes, oxygenation, ventilation, lung-protective ventilation, triggering & cycling), each with one-click "Try this" scenarios that load into the live waveforms.
- **Sandbox** — free-play simulator with every setting: mode (VC-AC, PC-AC, PSV, CPAP), FiO₂, PEEP, rate, tidal volume, flow, pressures, trigger type/sensitivity, plus lung phenotype (normal / ARDS / COPD / severe ARDS) and patient effort.
- **Dyssynchrony** — six annotated asynchronies (ineffective triggering, double triggering, flow starvation, reverse triggering, auto-triggering, delayed cycling) with mechanism, recognition cues, and fixes you apply live.
- **Challenges** — identify-the-asynchrony then fix-it assessment; the app checks the learner's correction in real time.
- **Learner levels** — Student / Nurse / Resident toggle flags stretch material and pitches depth appropriately.
- **Evidence panels** — every module cites primary literature (curated from a Zotero library) with DOI links.

## Getting started

Requires Node.js 18+ (developed on Node 24).

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check and produce a production build in dist/
npm run preview  # preview the production build locally
```

## Deploying

The build output in `dist/` is fully static — host it anywhere:

- **Netlify / Vercel / Cloudflare Pages** — point at the repo; build command `npm run build`, publish directory `dist`.
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
  engine/        physiology + ventilator simulation (framework-agnostic, unit-tested by hand)
    types.ts        core types
    simulation.ts   the VentSim stepper (equation of motion, triggering, cycling)
    presets.ts      default settings + lung phenotypes
  store/         Zustand store + the single shared VentSim instance
  components/    waveform canvas, control panels, telemetry, shared UI
  content/       lessons, dyssynchrony scenarios, references (from Zotero)
  views/         Learn / Dyssynchrony / Challenge / About screens
```

## Tech

React 18 · TypeScript · Vite · Tailwind CSS · Zustand · HTML canvas (custom 60 fps waveform renderer).

## Attribution

References are curated from the educator's Zotero library. Built as an open teaching resource.
