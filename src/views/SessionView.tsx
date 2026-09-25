import { useEffect } from 'react'
import { SimStage } from '../components/SimStage'
import { WaveformDisplay } from '../components/WaveformDisplay'
import { TelemetryBar } from '../components/TelemetryBar'
import { PlaybackBar } from '../components/PlaybackBar'
import { ControlPanel } from '../components/ControlPanel'
import { PatientPanel } from '../components/PatientPanel'
import { VitalsMonitor } from '../components/VitalsMonitor'
import { VitalsPanel } from '../components/VitalsPanel'
import { VentSummary } from '../components/VentSummary'
import { AbgInstructorPanel, AbgLearnerPanel } from '../components/AbgPanel'
import { SessionLobby } from '../components/SessionLobby'
import { useSession } from '../session/sessionStore'
import { useUI } from '../i18n'

// Role router for the Session tab. The connection itself lives at module scope in
// sessionStore, so switching tabs (which unmounts this whole subtree) does not drop it.

function CodeBadge() {
  const code = useSession((s) => s.code)
  const role = useSession((s) => s.role)
  const peerPresent = useSession((s) => s.peerPresent)
  const leaveSession = useSession((s) => s.leaveSession)
  const ui = useUI()

  const peerLabel =
    role === 'instructor'
      ? peerPresent
        ? ui.session.learnerConnected
        : ui.session.learnerAway
      : peerPresent
        ? ui.session.instructorConnected
        : ui.session.instructorAway

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-slate-900/70 ring-1 ring-slate-800 px-3 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-sky-400 bg-sky-400/10 rounded px-1.5 py-0.5">
        {role === 'instructor' ? ui.session.instructor : ui.session.learner}
      </span>

      <span className="tabular text-base font-bold tracking-[0.25em] text-sky-300">{code}</span>

      <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            peerPresent ? 'bg-emerald-400' : 'bg-slate-600'
          }`}
        />
        {peerLabel}
      </span>

      <button
        onClick={() => void leaveSession()}
        className="ml-auto rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
      >
        {ui.session.leave}
      </button>
    </div>
  )
}

/**
 * Instructor: drives the patient and the monitor, watches what the learner does.
 *
 * SimStage is here for two reasons — the instructor needs to see the tracing, and the RAF
 * loop that advances the engine lives inside WaveformDisplay, so a console without it
 * would sit frozen.
 */
function InstructorConsole() {
  const peerPresent = useSession((s) => s.peerPresent)
  const remoteTelemetry = useSession((s) => s.remoteTelemetry)
  const ui = useUI()

  return (
    <div className="p-2.5 sm:p-3 space-y-3">
      <CodeBadge />

      {!peerPresent ? (
        <p className="flex items-center gap-2 rounded-lg bg-slate-900/50 px-3 py-2 text-xs text-slate-400">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          {ui.session.shareCode}
        </p>
      ) : null}

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1 min-w-0 space-y-3">
          <VitalsMonitor />
          {/* Composed by hand rather than via SimStage so the telemetry bar can show the
              learner's measured numbers while the waveform stays a local render. Both
              devices run their own VentSim, so the tracings match in shape but not phase. */}
          <div className="flex flex-col gap-2.5">
            <TelemetryBar telemetry={remoteTelemetry ?? undefined} />
            <div style={{ minHeight: 280 }} className="flex-1">
              <WaveformDisplay />
            </div>
            <PlaybackBar />
          </div>
          {remoteTelemetry ? (
            <p className="text-[10px] leading-tight text-slate-500">{ui.session.phaseNote}</p>
          ) : null}
        </div>

        <div className="w-full lg:w-[360px] shrink-0 space-y-3 lg:overflow-y-auto">
          <p className="text-xs leading-snug text-slate-400">{ui.session.instructorHint}</p>
          <PatientPanel />
          <VitalsPanel />
          <AbgInstructorPanel />
          <VentSummary />
        </div>
      </div>
    </div>
  )
}

/**
 * Learner: the full sandbox plus the monitor.
 *
 * Deliberately no PatientPanel — the compliance, resistance and effort the instructor is
 * dialling are applied to this engine but never shown. Inferring stiff lungs from a rising
 * plateau pressure is the exercise.
 */
function LearnerConsole() {
  const ui = useUI()

  return (
    <div className="p-2.5 sm:p-3 space-y-3">
      <CodeBadge />

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1 min-w-0 space-y-3">
          <VitalsMonitor />
          <SimStage minH={280} />
        </div>

        <div className="w-full lg:w-[360px] shrink-0 space-y-3 lg:overflow-y-auto">
          <p className="text-xs leading-snug text-slate-400">{ui.session.learnerHint}</p>
          <ControlPanel />
          <AbgLearnerPanel />
        </div>
      </div>
    </div>
  )
}

export function SessionView() {
  const status = useSession((s) => s.status)
  const role = useSession((s) => s.role)
  const restoreSession = useSession((s) => s.restoreSession)

  // Rejoin after a page reload. restoreSession no-ops unless it is idle with something
  // saved, which also makes it safe under StrictMode's double-invoked effects.
  useEffect(() => {
    void restoreSession()
  }, [restoreSession])

  if (status !== 'connected' || !role) return <SessionLobby />
  return role === 'instructor' ? <InstructorConsole /> : <LearnerConsole />
}
