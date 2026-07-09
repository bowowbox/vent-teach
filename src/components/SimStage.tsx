import { WaveformDisplay } from './WaveformDisplay'
import { TelemetryBar } from './TelemetryBar'
import { PlaybackBar } from './PlaybackBar'

export function SimStage({ minH = 300 }: { minH?: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      <TelemetryBar />
      <div style={{ minHeight: minH }} className="flex-1">
        <WaveformDisplay />
      </div>
      <PlaybackBar />
    </div>
  )
}
