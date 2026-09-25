# VentTeach — spec

Interactive web app teaching basic ventilator settings and patient–ventilator
dyssynchrony to medical students, nurses, and residents.

Last updated: 2026-09-25 (feedback + scenario picker)

---

## Architecture

React 18 + TypeScript + Vite + Zustand + Tailwind. The three waveforms are drawn on a
single `<canvas>` by a hand-written renderer, not a charting library. ~4,600 lines of
source across 34 files in `src/`.

Offline and self-contained except for two features that share one Firebase Realtime
Database, lazily loaded so the rest of the app never pays for it: **Session** (two-device
teaching) and the **Feedback** button.

### The central idea

Dyssynchronies are **not drawn by hand**. Everything is integrated from the respiratory
equation of motion:

```
Paw + Pmus = PEEP + (V / C) + (R · Q)
```

Volume-controlled breaths fix flow and solve for pressure; pressure-targeted breaths
(PC/PSV) and expiration fix pressure and solve for flow. Triggering against auto-PEEP,
neural-vs-ventilator timing, and cardiogenic oscillation are explicit terms — so
ineffective / double / reverse / auto triggering and flow and cycle asynchronies fall
out of the same equations. This is what lets a learner change a setting and watch an
asynchrony resolve rather than watch a different canned animation play.

### Layout

| Path | Role |
|---|---|
| `src/engine/simulation.ts` (425) | `class VentSim` — the whole physics model and state machine |
| `src/engine/types.ts` (80) | `VentMode`, `VentSettings`, `LungParams`, `EffortParams`, `Sample`, `Telemetry` |
| `src/engine/presets.ts` (93) | `defaultVent`, `lungPresets`, `defaultEffort`, `defaultSettings` |
| `src/store/simStore.ts` (77) | one global `sim` instance living **outside** React + zustand `useSim` |
| `src/components/WaveformDisplay.tsx` (250) | RAF loop + canvas renderer; owns the clock |
| `src/components/ControlPanel.tsx` (199) | ventilator settings; mode-conditional JSX |
| `src/components/TelemetryBar.tsx` (53) | the readout tiles |
| `src/components/{PatientPanel,PlaybackBar,SimStage,LangToggle,ReferenceList,ui}.tsx` | lung/effort controls, transport, shared `Slider`/`SegGroup`/`Panel`/`Toggle` |
| `src/content/{lessons,scenarios,references}.ts` (375/402/190) | all teaching content as data |
| `src/views/{Learn,Dyssynchrony,Challenge,Session,About}View.tsx` | the five screens |
| `src/firebase.ts` | lazy Realtime Database access, shared by `session/` and `feedback/` |
| `src/session/` | two-device teaching sessions — see below |
| `src/feedback/submit.ts` | one-way feedback writes to `/feedback` |
| `src/i18n/` | EN/TH strings and language store |

The engine is framework-agnostic — it imports nothing from React. That is deliberate:
it can be driven headlessly, which is how `scenarios.ts` grades a challenge, how the
physics gets verified, and how the session sync gets tested (see *Testing*).

### The Session layer

| Path | Role |
|---|---|
| `src/session/sessionStore.ts` (~330) | zustand store + module-scope connection; publishers, subscriptions, throttling |
| `src/session/types.ts` (70) | `VitalSigns`, `AbgResult`, `SessionRole`, `OWNERSHIP` |
| `src/session/code.ts` (40) | join codes over a 31-symbol unambiguous alphabet |
| `src/session/abg.ts` (45) | PaCO₂-from-MV and Henderson–Hasselbalch prefill |
| `src/components/{VitalsMonitor,VitalsPanel,AbgPanel,VentSummary,SessionLobby,ScenarioPicker}.tsx` | the two consoles' surfaces |

**Single-writer ownership is the load-bearing rule.** Every database node has exactly one
author, and each side subscribes only to the nodes it does *not* own. That makes an echo
loop structurally impossible — there is no path by which a value we wrote returns and
re-triggers our own publish — so there are no revision counters or "applying remote"
dirty flags anywhere. Instructor writes `patient/lung`, `patient/effort`, `vitals`,
`abg/result`; learner writes `vent`, `telemetry`, `abg/request`. `abg` is split into
`request` and `result` precisely to keep that rule on a shared concept.

**Publishing is driven by subscribing to `useSim`**, not by wrapping the control panels.
`ControlPanel` and `PatientPanel` are therefore reused completely unmodified in a session.
`setVent`/`setLung`/`setEffort` each build a fresh object, so reference inequality is a
reliable and free change test.

**Vitals deliberately do not live in `SimSettings`.** The engine models respiratory
mechanics only — no gas exchange, no haemodynamics, and `fio2` is a setting nothing
consumes. Keeping monitor numbers in the session store means this whole feature touches
neither `src/engine/**` nor `src/content/**`: no `presets.ts` edit, no lesson or scenario
edit, no new `scenarios.check()` surface.

**Both devices run their own `VentSim`**, so tracings match in shape but drift in phase.
The instructor's telemetry bar is fed the learner's synced `telemetry` via
`TelemetryBar`'s optional `telemetry` prop, so those numbers are the learner's real
measured values rather than a local re-derivation.

### Invariants that must hold across files

These are the ones that bite. Each requires edits in more than one place:

- **A new `VentSettings` field** → `engine/types.ts` **and** `defaultVent` in
  `engine/presets.ts`. The `make()` helpers in `content/lessons.ts` and
  `content/scenarios.ts` spread over `defaultSettings`, so existing content inherits
  the default automatically and needs no edit.
- **A new `Telemetry` field** → `engine/types.ts`, the return object in
  `VentSim.getTelemetry()`, **and** `emptyTelemetry` in `store/simStore.ts`.
- **A new UI string** → add to `en` in `i18n/strings.ts`; `const th: UIStrings` is typed
  against `en`, so omitting the Thai key is a compile error. That is the registration
  mechanism — there is no runtime key check.
- **Settings objects must stay plain data** — `structuredClone` is used in the `VentSim`
  constructor and in `applySettings`, and the session layer round-trips them through JSON.
- **A new synced field** → `src/session/types.ts`, the publisher in `subscribeAndPublish`
  or an action in `sessionStore.ts`, the subscriber in `connect()`, and `OWNERSHIP` in
  `types.ts`. Give it exactly one writer; two writers on one node is the one thing that
  breaks the design.
- **A new env var** → `src/vite-env.d.ts` (there is no `vite/client` reference anywhere
  else), `.env.example`, and the Netlify environment variables.

### Conventions

- **Ventilator-panel terms are never translated** (Tidal volume, PEEP, Cycle-off, Ppeak,
  Ti, VC-AC, Pmus…). They are the labels printed on the real machine at the bedside.
  Only surrounding prose and hints go through i18n. Documented at `i18n/strings.ts:3-7`.
- Two string systems: `UIStrings` (nested object, `useUI()`) for chrome;
  `LS = { en, th }` (`useT()` / `t()`) inline in content files.
- No element IDs and no CSS-class toggling — mode-conditional controls are plain JSX
  conditionals in `ControlPanel.tsx`.

### Commands

```bash
npm run dev        # vite dev server, http://localhost:5173
npm run typecheck  # tsc -b --noEmit  ← the main correctness gate
npm run build      # tsc -b && vite build → dist/
npm run preview    # serve the production build
```

`cp .env.example .env` and fill in four `VITE_FIREBASE_*` values to enable the Session
tab locally. Without them every other tab works and Session shows setup instructions.

### Deployment

Netlify, from `netlify.toml`: build `npm run build`, publish `dist`, SPA fallback to
`index.html`. `dist/` is gitignored — Netlify builds from source, so **pushing to `main`
is the deploy**. Vite `base` is `./`, so the build also works unzipped into a
subdirectory on a university web server.

Repo: `https://github.com/bowowbox/vent-teach.git`, single branch `main`.
Live site: **https://learnventilator.netlify.app** (Netlify project `learnventilator`).
The folder is linked via `.netlify/` (gitignored), so `netlify env:list` and
`netlify env:import .env` work from the project root.

**Env-var ordering trap:** Vite inlines `import.meta.env.VITE_*` at *build* time, so
Netlify environment variables only reach the site through a build that runs after they are
set. Set the variables first, then push — otherwise the first deploy ships an
unconfigured Session tab and needs a second build.

---

## What was done

### 2026-09-25 (later) — About byline, instructor scenario picker, in-app feedback

Three additions after the Session tab went live.

**About byline.** One line under the intro: "By Jutamas Saoraya, MD, MScCH(HPTE), PhD ·
More about the author", linking to https://sites.google.com/view/jutamas-saoraya/. The link
label describes the destination rather than naming the site. Name and post-nominals stay
Latin in the Thai text, per the existing convention.

**Instructor scenario picker.** A "Load a case" panel on the instructor console: seven
pills (Normal + the six dyssynchronies) and an "Also set the learner's ventilator" switch,
default on.

The ventilator half is not optional in practice — auto-triggering needs a pressure trigger
at 0.5, delayed cycling needs PSV with 10 % cycle-off, flow starvation needs peak flow 30.
**Three of the six cases cannot appear at all** without it, which is why the switch defaults
on and the hint says what turning it off costs.

- The instructor does not own `vent`, so they write a **one-shot `scenario` command node**
  `{ id, at, vent? }`; the learner applies it with `setVent` and republishes it as their
  own `vent`. Single-writer ownership survives intact — no new conflict axis.
- The learner **ignores the value present when it attaches**. `onValue` fires immediately,
  and replaying an old command after a mid-session reload would wipe out settings the
  learner had since dialled. Cost: a learner who joins *after* a case is loaded inherits the
  patient but not the ventilator, so the instructor re-clicks. Predictable beats clever.
- `loadScenario` uses `setLung`/`setEffort`, **not `applySettings`**, unlike the
  Dyssynchrony tab. `applySettings` would also overwrite the instructor's local `vent` —
  which they neither own nor publish — leaving their engine out of step with the learner's
  real settings until the learner next touched a control. There is a test for exactly this.
- No learner-facing notification: the waveforms and vitals simply change, as at the bedside.

**In-app feedback.** A Feedback button in the header on every tab opening a native
`<dialog>` — chosen over a hand-rolled overlay because it brings a focus trap, Esc-to-close
and a real backdrop for free. Message plus optional email, writing to a `/feedback` node in
the same database. Also records the active tab, language and a truncated user-agent, which
the dialog discloses on screen. A honeypot field reports success rather than an error, so a
script has nothing to tune against. The button renders `null` when no database is
configured.

The `feedback` rules are a tighter posture than `sessions`: `".read": false` (no client can
read submissions back, not even the sender), `".write": "!data.exists()"` (create-only), and
a 2,000-character `.validate` cap that `submit.ts` mirrors client-side so a write never
bounces. **The rules must be applied before shipping** or submissions fail — the same
ordering trap as the Netlify env vars. No email notification; that needs Cloud Functions on
the paid Blaze plan.

**Structural change:** `src/session/firebase.ts` → **`src/firebase.ts`**, with
`isSessionConfigured()` renamed `isFirebaseConfigured()`. Feedback is independent of
sessions, so a module named `session/firebase` exporting `isSessionConfigured` would have
been actively misleading. Two call sites changed. This also moved where the test harnesses
copy the fake — see *Testing*.

Verified with a new feedback harness (22 assertions: trimming, truncation at 2,000, blank
email producing an *absent* key rather than `undefined`, empty messages rejected without a
write, distinct time-ordered push keys, nothing written outside `/feedback`) and a new
scenario harness (33 assertions), with all three earlier harnesses re-run clean after the
file move. The scenario echo check is the one worth quoting: **one case load produces
exactly 4 writes** — `scenario`, `patient/lung`, `patient/effort`, then the learner
republishing `vent` — and then silence.

The rename caught a real class of bug in the test doubles: the fake Firebase still exported
the old name and was missing `push()` entirely. Both were test-double drift rather than
product defects, but they are the reason the harnesses are worth committing.

### 2026-09-25 — Session tab: two-device instructor/learner simulation

A fifth tab where an instructor and a learner on two devices share one simulated patient
via a six-character join code. Instructor drives compliance, resistance, effort, the
monitor and blood gases; learner gets the full sandbox plus a vitals strip. The project's
first networking of any kind.

**Decisions, and why:**

- **Firebase Realtime Database**, not a Netlify Function with polling. The instructor is
  reacting live to what the learner does, so sub-second propagation is the feature, not a
  nicety. Behind a dynamic `import()`: the main bundle grew 7.4 kB gzipped (77.4 → 84.9)
  while Firebase itself sits in separate chunks (~57 kB gzipped) that only load when a
  session opens. Verified in `dist/index.html` — no `modulepreload`, only `import(...)`.
- **Single-writer ownership** rather than last-write-wins with conflict resolution. See
  *The Session layer* above. This is the decision the whole design rests on.
- **Physics-driven, no number overrides.** The instructor cannot type over Pplat, Ppeak,
  Vt or auto-PEEP — those stay engine outputs of the instructor's patient and the learner's
  ventilator, so they always respond to what the learner does and cannot be physically
  impossible. The instructor authors only what the engine does not model.
- **Vitals kept out of `SimSettings`**, so `src/engine/**` and `src/content/**` were not
  touched at all.
- **One tab with a role chooser**, not two tabs. The mobile bottom bar already fits five
  `flex-1` buttons tightly at 320 px; six is the practical ceiling.
- **Playback deliberately not synced.** `running`/`speed`/`reset` stay local to each
  device — syncing them adds a conflict axis for no teaching gain.
- **`normalizeCode` does not "repair" look-alikes.** An earlier draft mapped O→Q and I→J.
  Rejected: a silent substitution can turn a misread character into a different *valid*
  code and drop someone into a stranger's session. It now strips impossible characters and
  lets "session not found" be the feedback.

**Defect found during self-review:** the instructor's telemetry bar was showing its own
engine's numbers rather than the learner's. Since the two devices drift in phase, those
are not the same readings. Fixed by giving `TelemetryBar` an optional `telemetry` prop and
composing the instructor's stage by hand instead of via `SimStage` (the same thing
`SandboxLayout` already does for its own layout reasons).

**Optimisation that mattered:** `_setTelemetry` builds a fresh object every 0.2 s, so a
reference-only change test wrote to the database once a second for the whole session even
with a completely stable patient. The values are rounded, so `sameTelemetry()` compares by
value — 50 identical ticks now produce exactly 1 write.

Verified with two headless test harnesses (see *Testing*), covering 40 + 13 assertions:
bidirectional sync reaching the *engine* and not just React state, ownership as reflected
in the database, a bad code failing as `notFound` without leaving a dangling session, the
ABG request/release loop including a repeat request reading as pending again, presence
going out on leave, and a departed learner publishing nothing. The two results worth
quoting: **one `setLung` produces exactly 1 write with 0 follow-on writes** (no echo
loop), and **51 slider steps collapse to 1 write** with the final value still landing.

Also updated `README.md` — a Session section with the Firebase setup, the four env vars,
the database rules and the stated security trade-off — and removed the stale "Learner
levels" feature bullet, which advertised a selector deleted on 2026-07-09 and sat in the
same list. `.gitignore` now covers `.env`; a committed `.env.example` documents the four
variables.

### 2026-09-22 — VC-AC inspiratory pause (Tpause) + Ti in PSV/PC-AC (`1b3823e`)

Added `pauseTime` (0–1.0 s, step 0.1, default 0) as an **Insp. pause** slider shown only
in VC-AC.

- **Modelled as part of inspiration, not a third phase.** `phase` stays `'insp' | 'exp'`;
  the hold is tracked by a private `inPause` flag. Physiologically right (Ti includes the
  pause) and it avoids touching `Sample.phase`, which the renderer and the headless
  scenario checker both consume. During the hold `Q = 0`, volume is frozen, and no
  triggering can occur because all trigger logic lives in the `exp` branch.
- **Pplat is now measured, not assumed** — read from the airway pressure at the end of an
  actual hold, Pmus included. An actively breathing patient therefore drags the shelf
  down and Pplat reads falsely low, which is precisely why a plateau is only valid in a
  passive patient. With `pauseTime = 0` the analytic `PEEP + V/C` is kept, so the
  no-pause path is bit-identical to before.
- **Defect found and fixed:** `endInspiration()` took Ppeak from the *last* `Paw` of the
  inspiration. During a hold that is the plateau, so the peak would have been lost —
  but the same bug already existed for **decelerating flow at high resistance**, where
  peak Paw occurs at breath *start*. COPD + decelerating reported Ppeak 16.9 cmH₂O while
  its own waveform peaked at 21.5. Replaced with a per-breath `breathPeakPaw` latch.
  **This changes an existing readout** — decelerating + high-resistance Ppeak is now
  higher and correct.
- **Ti tile ungated.** `tTi` was already measured in every mode and already fed the I:E
  ratio, but the tile was gated to VC-AC. Now shown in VC-AC, PC-AC and PSV (hidden in
  CPAP), where it is the primary readout for cycling behaviour.

Verified by transpiling the engine and driving it headlessly (see *Testing*), not by
eyeballing the canvas. Measured: hold flow clamped to exactly 0 for the set duration with
volume frozen; Ti 0.5 → 0.8 s and I:E 1:8.8 → 1:5.2 at Tpause 0.3 s; PSV Ti 0.4/0.6/0.7 s
at cycle-off 60/25/10 %; PC-AC Ti = the set 1.0 s; the double-triggering scenario still
double-triggers as loaded and still clears with the canonical fix.

Nuance worth knowing for teaching: the hold **trace** always sags when the patient is
pulling (3.5–6.9 cmH₂O across the cases tried), but the **readout** only reads low if
effort is still present at the *end* of the hold. At neural Ti 0.9 s with a 0.5 s pause
the effort has waned by then and Pplat recovers to the passive value even though the
shelf dipped to 5.6. Correct physiology — a long hold is what lets pressure equilibrate —
but the demo needs a long neural Ti to show up in the numbers.

### 2026-08-14 — VCV flow pattern, Ti readout, "Peak flow" rename (`849d5cc`)

Square vs. decelerating inspiratory flow in VC-AC, with the ramp floored at 25 % of peak
so Ti stays finite. Added the Ti telemetry tile (VC-AC only at the time). Renamed the
flow control to "Peak flow" — with a decelerating ramp, "flow" alone is ambiguous.

### 2026-07-10 — Double-triggering waveform fix (`5bbf989`)

A stacked breath was starting on the very next 2 ms step, so the two breaths rendered as
one long inspiration. Added `EXP_VALVE_TIME = 0.15 s`: the exhalation valve must open and
the trigger re-arm before another breath can be delivered, so even the tightest stacked
breath is preceded by a short expiration and reads as two breaths.

### 2026-07-10 — Thai/English toggle (`2daef0c`)

Two-tier i18n as described in *Architecture*. `th` typed as `UIStrings` so a missing
translation fails the build. Persisted to `localStorage['venteach.lang']`; a Thai-
preferring browser auto-detects to Thai; `document.documentElement.lang` is kept in sync.
Decision: ventilator terms stay English in the Thai text, because that is what is printed
on the machine.

### 2026-07-09 — Mobile layout (`35fef0d`, `5260845`)

Nav became a bottom tab bar on mobile and a left rail from `sm:` up. The simulator was
un-pinned so it no longer covers lesson text on small screens.

**Removed the learner-level (Student / Nurse / Resident) selector** in `5260845`. It
added a dimension to every piece of content without changing what a learner actually
needed to see.

### 2026-07-09 — Initial commit (`523d309`)

Engine, store, canvas renderer, four views, 6 lessons, 6 dyssynchrony scenarios,
20 references curated from the educator's Zotero library.

---

## To do

### Blocking

Nothing blocks use. The app builds, deploys, and is live.

The Session tab's Firebase prerequisite was satisfied on 2026-09-25: project `vent-teach`
(Realtime Database in `asia-southeast1`), rules scoped to `/sessions/$code`, and the four
`VITE_FIREBASE_*` variables set both in `.env` and on the Netlify site. A real two-device
session was run successfully against it.

### Correctness / trust

- **Five of the six challenge `check()` functions are settings heuristics, not engine
  replays.** Only `'double'` calls `stillDoubleTriggers()`, which replays ~8 s headlessly
  and asks the engine. The comment at `content/scenarios.ts:9` records *why* the heuristic
  was abandoned there: it marked the scenario resolved on load, and called a visibly clean
  tracing unresolved. The same failure mode is latent in the other five — e.g.
  `'autotrigger'` is `s.vent.triggerSensitivity >= 1.5` and `'ineffective'` is a
  hand-tuned rate/sensitivity ladder. Migrating them to engine replay is the single
  highest-value correctness change left.
- **No automated test suite, still.** There are no `*.test.*` files in the repo and
  `npm run typecheck` is the only gate that runs. Three substantial headless harnesses now
  exist (engine physics, session sync, telemetry publishing) but they live in a scratch
  directory and are thrown away each session. The session-sync one in particular — two
  duplicated module trees sharing a fake Firebase through `globalThis` — took real effort
  to build and would be worth committing rather than rebuilding. See *Testing*.
- **Session security is a join code and nothing else.** The database rules are open on
  `/sessions/$code`, so anyone who guessed a live code could read or disturb that session.
  Deliberate, documented in `README.md`, and defensible for a teaching simulator holding no
  patient data — the code space is ~8.9 × 10⁸. Firebase Anonymous Auth plus a rule
  requiring an authenticated `uid` is the contained fix if a setting needs it.
- **Stale session nodes are never pruned.** `leaveSession()` clears presence but leaves
  `meta`, `patient`, `vent` and the rest behind, deliberately, so an instructor can refresh
  without losing the session. Each is a few hundred bytes against a 1 GB free tier, so this
  is housekeeping rather than a problem; a scheduled cleanup or a rule requiring a recent
  `createdAt` would close it.
- **`Telemetry.measuredTidalVolume` reports absolute lung volume**, `this.V * 1000`, not
  delivered volume for the breath. With gas trapping it reads high (756 mL against a set
  420 mL at rate 30 with a 1.0 s pause). Pre-existing and arguably defensible as "volume
  above PEEP resting volume", but it is not what "Vt (exp)" implies on a real machine.
  Decide whether to change the number or the label.

### Documentation drift

- ~~README advertises the removed "Learner levels" toggle~~ — deleted 2026-09-25.
- ~~README calls the engine "unit-tested by hand"~~ — reworded 2026-09-25 to say what
  actually happens (ad-hoc headless driver scripts).
- ~~README does not record the live Netlify URL~~ — it is
  **https://learnventilator.netlify.app** (Netlify site `learnventilator`, ID
  `a12f331c-f0ee-47ad-b620-28c5d2fe58bf`). Recorded here 2026-09-25; still worth putting in
  the README.
- README's feature list still predates the flow-pattern and Tpause controls. The Session
  bullet was added 2026-09-25; those two were not.

### Housekeeping

- `tsconfig.app.tsbuildinfo` and `tsconfig.node.tsbuildinfo` are **tracked in git** but
  are build cache. Add to `.gitignore` and `git rm --cached`.
- `patient-ventilatory dyssynchrony  double triggering and premature breath termination.jfif`
  sits untracked in the repo root. Reference image, not a deliverable — move it out or
  ignore it.
- `npm audit` reports 6 vulnerabilities (2 moderate, 4 high), all in the `postcss`/build
  dependency chain and all pre-existing — not introduced by `firebase`. `npm audit fix`
  resolves them; `--force` would bump major versions and was not run.

### Teaching content, now unlocked by the 2026-09-22 change

- A **0.4 s inspiratory pause also resolves the double-triggering challenge**, by
  stretching Ti past the patient's neural Ti. The engine-replay `check()` accepts it
  correctly. Worth naming as a second legitimate route in that scenario's `fix` bullets.
- `content/lessons.ts:289` tells learners "plateau pressure is the pressure held during an
  inspiratory pause" — a hold they previously could not perform. A "Try this" scenario
  with `pauseTime` set would now close that loop.
- The passive-vs-active plateau demo is the sharpest new teaching artefact in the app and
  is currently reachable only by free play in the Sandbox.

---

## Current state

**Five tabs live; the sixth needs a Firebase project.** `main` is at `1b3823e`
(2026-09-22), which is what is deployed. The Session work of 2026-09-25 is **in the working
tree, uncommitted** — see *Next step*. `npm run typecheck` and `npm run build` both pass clean
(87 modules; 254 kB / 84.9 kB gzipped main chunk, plus ~249 kB / 57 kB gzipped of
lazy-loaded Firebase chunks).

Shipped and verified: 4 modes (VC-AC / PC-AC / PSV / CPAP), 4 lung phenotypes, patient
effort with independent or reverse-trigger coupling, 6 lessons, 6 dyssynchrony scenarios,
20 references, EN/TH throughout, mobile and desktop layouts.

**Session tab — verified against real Firebase.** The sync logic passes 53 headless
assertions against a fake in-process database (ownership, echo-loop freedom, throttling,
the ABG loop, presence, teardown), and on 2026-09-25 a real two-device session was run
against Firebase project `vent-teach` — so the network path, the `onDisconnect` presence
semantics and the database rules are all confirmed working, not just modelled.

Still unexercised: two genuinely separate devices on separate networks (the live run was
two windows on one machine), and therefore real-world latency and mobile layout at phone
width.

**Feedback needs a rules update before it ships.** The `/feedback` node is rejected by the
rules currently live on the Firebase project, which only permit `/sessions`. Apply the
combined rules from the Session section of `README.md` *before* deploying, or every
submission will fail — the same ordering trap as the Netlify env vars.

**Not done:** no committed test suite; five of six challenge graders are heuristics; the
README predates the flow-pattern and Tpause controls.

### Blast radius

- **Touching `VentSim.step()` or `endInspiration()`** affects every view at once — there
  is one shared `sim` instance and the canvas, the telemetry tiles, and the challenge
  graders all read from it. Re-check the Ppeak latch, the double-triggering scenario, and
  the `pauseTime = 0` no-pause path, which is the regression baseline for the hold work.
- **Adding a phase to the state machine.** `Sample.phase` is `'insp' | 'exp'` and is
  consumed by `WaveformDisplay` and by `stillDoubleTriggers()`. The 2026-09-22 hold was
  deliberately built *without* a third phase for this reason. Widening that union means
  auditing both consumers.
- **Adding a setting or telemetry field** — see the invariants table under *Architecture*.
  `typecheck` catches the i18n half but not a missed `emptyTelemetry` entry, which fails
  silently as a zero in the UI.
- **Changing `defaultVent`** changes every lesson and scenario at once, since `make()`
  spreads over `defaultSettings`.
- **Touching anything in `src/session/`** can only affect the Session tab — nothing outside
  it imports from there, and `firebase` is reached solely through a dynamic `import()`. The
  one exception is `TelemetryBar`, which grew an optional `telemetry` prop; it defaults to
  the local store, so its four existing callers are unchanged.
- **Adding a second writer to any session node** is the one change that breaks the design.
  Echo-loop freedom is structural, not defensive — there are no guards to fall back on.
- **Reusing `ControlPanel`/`PatientPanel` elsewhere** is now load-bearing for the session:
  publishing works by watching `useSim`, so a panel that wrote settings by some other route
  would silently fail to sync.
- **`src/firebase.ts` is now shared** by `session/` and `feedback/`. Renaming its exports
  breaks the test harnesses at import time (they carry a hand-written fake), which is the
  right failure but reads like a product bug if you are not expecting it.

### Testing

There is no committed suite. Three harness patterns have been used and should be
formalised — all rely on `engine/` and `session/` importing nothing from React.

**1. Engine physics.** Transpile one file, drive it, read the buffer: `npx tsc
src/engine/simulation.ts --outDir <scratch>/out --module esnext --target es2020
--moduleResolution bundler --skipLibCheck`, then a driver `.mjs` that builds `SimSettings`
literals, calls `advance()` and reads `getTelemetry()` / `getBuffer()`. Confirmed the
Tpause physics, the Ppeak latch, and the double-triggering regression by inspecting
samples directly rather than trusting the rendered canvas.

**2. Pure session helpers.** Same shape for `session/code.ts` and `session/abg.ts` —
code-alphabet properties, and the PaCO2 / Henderson-Hasselbalch arithmetic.

**3. Two-device session sync.** The fiddly one, and the reason it is worth committing
rather than rebuilding:

- `npx tsc -p tsconfig.app.json --outDir <scratch>/out3`. It emits despite a TS5096
  warning about `allowImportingTsExtensions`.
- `sed` the emitted relative imports to append `.js`, which Node ESM requires and `tsc`
  omits.
- Copy the tree **once per device** (`devA`, `devB`, `devC`). A query-string import such as
  `?d=a` is not enough: the duplicated module still shares one `simStore`, because its own
  import specifier carries no query. Separate trees give each device genuinely separate
  `useSim` / `useSession` singletons, which is the isolation two browsers have.
- Overwrite **`firebase.js` at the tree root** (it moved out of `session/` on 2026-09-25)
  with a fake that keeps its data on `globalThis`, so the trees share one database. It must
  reproduce four Firebase behaviours or the tests quietly lie: `onValue` fires immediately
  with the current value, a write notifies listeners on ancestor *and* descendant paths,
  values round-trip through JSON, and `push()` returns keys that sort chronologically.
  Keep its exported names in step with `src/firebase.ts` — a rename there fails the
  harnesses at import time, which is the desired behaviour but easy to misread as a
  product bug.
- Junction `node_modules` into the scratch directory so `zustand` resolves.

Each device needs its own tree even for a throwaway case — reusing `devA` for a
"join a nonexistent code" test tears down the instructor's live session and corrupts every
assertion after it.

**Four harnesses exist** and are re-run together after any change to `src/session/`,
`src/feedback/` or `src/firebase.ts`: `sync-test` (ownership, echo freedom, presence,
teardown), `telemetry-test` (idle suppression, throttling), `scenario-test` (the command
node, skip-on-attach, instructor/learner asymmetry) and `feedback-test` (payload shape).
`feedback-test` needs only one tree.

### Next step

1. Apply the combined database rules (Session section of `README.md`) — feedback fails
   without them.
2. Commit and push; Netlify redeploys automatically.
3. Send one feedback message from the live site and confirm it appears under `feedback` in
   the Firebase console.
4. Still outstanding from before: run a session across two genuinely separate devices on
   separate networks (laptop as instructor, phone as learner) and check the learner console
   at phone width — the mobile nav carries six buttons and the header now carries a
   Feedback button too.

Note that `tsconfig.app.tsbuildinfo` shows as modified after every build because it is
tracked (see *Housekeeping*); it is build cache and does not belong in a commit.

### Biggest open risk

The challenge graders. A learner can produce a visibly correct tracing and be told they
are wrong, or load a scenario and be told it is already resolved — that exact failure was
observed and fixed for double triggering, and the other five scenarios still use the
approach that caused it. It undermines the app's core promise (change a setting, watch it
resolve) at the one moment a learner is being assessed.
