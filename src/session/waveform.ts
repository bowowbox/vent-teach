import type { Sample, TriggerEvent } from '../engine/types'

// Streaming the learner's actual tracing to the instructor.
//
// Two engines with identical settings do NOT show the same thing. Whether a breath stacks
// depends on where the patient's neural effort lands relative to the ventilator cycle —
// that phase relationship *is* the dyssynchrony — so the double-triggering case is
// bistable: an 80 ms difference in start time flips it between severe gas trapping and
// none. Measured: Vt 747 vs 366 mL, auto-PEEP 9.9 vs 0.4 cmH2O from the same settings.
//
// So the instructor cannot simulate their own copy and expect it to match. They render
// what the learner's engine actually produced.

/** What the canvas draws. `phase` is in `Sample` but the renderer never reads it. */
export interface RenderSample {
  t: number
  paw: number
  flow: number
  volume: number
  pmus: number
  triggerEvent?: TriggerEvent
}

/** The engine stores at 8 ms; every 4th is still ~1.6 px apart on a 12 s / 600 px sweep. */
const STRIDE = 4

/** Seconds of tracing per chunk. Longer than the publish interval on purpose: the chunks
 *  overlap, so a single dropped write leaves no gap in the instructor's tracing. */
export const CHUNK_S = 0.6

/** Must match WINDOW_S in WaveformDisplay, or the instructor's sweep will not fill. */
export const WINDOW_S = 12

/** Column-major so the JSON is numbers rather than repeated key names. */
export interface WaveChunk {
  seq: number
  t: number[]
  p: number[] // paw
  f: number[] // flow
  v: number[] // volume
  m: number[] // pmus
  /** Sparse index -> event. Firebase drops empty objects, so this may be absent. */
  e?: Record<string, TriggerEvent>
}

export function encodeChunk(buffer: Sample[], seq: number): WaveChunk | null {
  if (!buffer.length) return null

  const startT = buffer[buffer.length - 1].t - CHUNK_S
  let from = buffer.findIndex((s) => s.t >= startT)
  if (from < 0) from = 0

  const t: number[] = []
  const p: number[] = []
  const f: number[] = []
  const v: number[] = []
  const m: number[] = []
  const e: Record<string, TriggerEvent> = {}

  for (let i = from; i < buffer.length; i += STRIDE) {
    const s = buffer[i]
    const idx = t.length
    t.push(Math.round(s.t * 1000) / 1000)
    p.push(s.paw)
    f.push(s.flow)
    v.push(s.volume)
    m.push(s.pmus)
    // Carry any event from the samples this one stands in for, so decimation never
    // swallows a trigger marker — those are the whole point of the dyssynchrony views.
    for (let k = i; k < Math.min(i + STRIDE, buffer.length); k++) {
      const ev = buffer[k].triggerEvent
      if (ev) {
        e[String(idx)] = ev
        break
      }
    }
  }

  if (!t.length) return null
  const chunk: WaveChunk = { seq, t, p, f, v, m }
  if (Object.keys(e).length) chunk.e = e
  return chunk
}

/** Firebase returns a dense numeric-keyed object as an array, but not always — accept both. */
function asArray(x: unknown): number[] {
  if (Array.isArray(x)) return x as number[]
  if (x && typeof x === 'object') {
    return Object.keys(x as Record<string, number>)
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => (x as Record<string, number>)[k])
  }
  return []
}

export function decodeChunk(raw: unknown): RenderSample[] {
  if (!raw || typeof raw !== 'object') return []
  const c = raw as WaveChunk
  const t = asArray(c.t)
  const p = asArray(c.p)
  const f = asArray(c.f)
  const v = asArray(c.v)
  const m = asArray(c.m)
  const n = Math.min(t.length, p.length, f.length, v.length, m.length)

  const out: RenderSample[] = []
  for (let i = 0; i < n; i++) {
    const s: RenderSample = { t: t[i], paw: p[i], flow: f[i], volume: v[i], pmus: m[i] ?? 0 }
    const ev = c.e?.[String(i)]
    if (ev) s.triggerEvent = ev
    out.push(s)
  }
  return out
}

/**
 * Append a chunk to the rolling buffer, dropping anything already seen and trimming to the
 * display window. Deduplicating by timestamp is what makes the overlapping chunks safe.
 */
export function mergeSamples(prev: RenderSample[], incoming: RenderSample[]): RenderSample[] {
  if (!incoming.length) return prev
  const lastT = prev.length ? prev[prev.length - 1].t : -Infinity

  // A learner who reset their sim restarts the clock; older samples are then meaningless.
  if (incoming[0].t < lastT - WINDOW_S) return incoming.slice()

  const merged = prev.concat(incoming.filter((s) => s.t > lastT))
  const cutoff = merged[merged.length - 1].t - WINDOW_S
  let drop = 0
  while (drop < merged.length && merged[drop].t < cutoff) drop++
  return drop ? merged.slice(drop) : merged
}

// --- mirror sweep clock -----------------------------------------------------------
//
// The instructor's sweep must not be pinned to the newest received sample's timestamp.
// Chunks land about four times a second, so pinning redraws at 60 fps while the picture
// only moves at 4 fps, which reads as heavy lag. Instead the sweep runs on local wall
// time and is eased toward the incoming data, the way a video jitter buffer works.

/** Held this far behind the newest sample so there is always data under the leading edge. */
export const MIRROR_LAG_S = 0.3

/**
 * Fraction of the remaining drift corrected per frame.
 *
 * Deliberately tiny. The incoming signal is a 4 Hz staircase — the target leaps 250 ms
 * whenever a chunk lands and sits still in between — so any correction strong enough to
 * track it frame-by-frame passes that ripple straight through to the sweep speed. At 0.08
 * the measured per-frame advance swung between 5 and 29 ms against an ideal 16.67, a 70 %
 * wobble. At 0.005 the ripple is under 1.3 ms and the time constant is ~3 s, which absorbs
 * jitter without anyone seeing the trace change pace.
 */
const DRIFT_PULL = 0.005

/** Hard bound on sweep speed as a multiple of real time, whatever the drift. */
const RATE_MIN = 0.9
const RATE_MAX = 1.1

/** Beyond this much disagreement, snap instead of easing: a reset or a long stall. */
const RESYNC_S = 2

/**
 * Next sweep position. `current` is null before the first frame or after a reset.
 *
 * The sweep runs on local wall time and is eased toward `newestSampleT - MIRROR_LAG_S`,
 * never pinned to it: pinning is what made the picture move at the 4 Hz the chunks arrive
 * instead of at the 60 Hz it is redrawn.
 */
export function advanceSweep(current: number | null, newestSampleT: number, dt: number): number {
  const target = newestSampleT - MIRROR_LAG_S
  if (current === null || Math.abs(target - current) > RESYNC_S) return target

  const moved = current + dt
  const eased = moved + (target - moved) * DRIFT_PULL
  // Belt and braces: even a pathological drift cannot make the trace visibly speed up.
  const step = Math.min(dt * RATE_MAX, Math.max(dt * RATE_MIN, eased - current))
  return current + step
}
