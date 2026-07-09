import { useEffect, useRef } from 'react'
import { sim, useSim } from '../store/simStore'
import type { Sample, TriggerEvent } from '../engine/types'

const COLORS = {
  pressure: '#38bdf8',
  flow: '#34d399',
  volume: '#f59e0b',
  pmus: '#f472b6',
  grid: 'rgba(148,163,184,0.14)',
  zero: 'rgba(148,163,184,0.35)',
  label: '#94a3b8',
}

const TRIGGER_STYLE: Record<TriggerEvent, { color: string; label: string }> = {
  patient: { color: '#34d399', label: 'P' },
  time: { color: '#60a5fa', label: 'M' },
  ineffective: { color: '#f87171', label: '!' },
  double: { color: '#fb923c', label: '2x' },
  auto: { color: '#c084fc', label: 'A' },
}

const WINDOW_S = 12

interface Lane {
  key: 'paw' | 'flow' | 'volume'
  title: string
  unit: string
  color: string
  min: (buf: Sample[]) => number
  max: (buf: Sample[]) => number
  symmetric?: boolean
}

const LANES: Lane[] = [
  {
    key: 'paw',
    title: 'Pressure',
    unit: 'cmH₂O',
    color: COLORS.pressure,
    min: () => -5,
    max: (b) => Math.max(40, ...b.map((s) => s.paw)) + 3,
  },
  {
    key: 'flow',
    title: 'Flow',
    unit: 'L/min',
    color: COLORS.flow,
    symmetric: true,
    min: (b) => -bound(b, 'flow', 60),
    max: (b) => bound(b, 'flow', 60),
  },
  {
    key: 'volume',
    title: 'Volume',
    unit: 'mL',
    color: COLORS.volume,
    min: () => 0,
    max: (b) => Math.max(600, ...b.map((s) => s.volume)) + 40,
  },
]

function bound(buf: Sample[], key: 'flow', floor: number): number {
  let m = floor
  for (const s of buf) m = Math.max(m, Math.abs(s[key]))
  return m + 10
}

export function WaveformDisplay() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const showPmus = useSim((s) => s.showPmus)
  const showPmusRef = useRef(showPmus)
  showPmusRef.current = showPmus

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let raf = 0
    let last = performance.now()
    let telAccum = 0

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const frame = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      const st = useSim.getState()
      if (st.running) sim.advance(dt, st.speed)

      telAccum += dt
      if (telAccum > 0.2) {
        telAccum = 0
        st._setTelemetry(sim.getTelemetry())
      }

      draw(ctx, canvas, sim.getBuffer(), showPmusRef.current)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <div className="w-full h-full rounded-lg bg-slate-950/80 ring-1 ring-slate-800 overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  )
}

function draw(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  buf: Sample[],
  showPmus: boolean,
) {
  const dpr = window.devicePixelRatio || 1
  const W = canvas.width / dpr
  const H = canvas.height / dpr
  ctx.clearRect(0, 0, W, H)

  const padL = 52
  const padR = 10
  const laneGap = 8
  const plotW = W - padL - padR
  const laneH = (H - laneGap * (LANES.length - 1)) / LANES.length

  const now = buf.length ? buf[buf.length - 1].t : 0
  const t0 = now - WINDOW_S
  const xOf = (t: number) => padL + ((t - t0) / WINDOW_S) * plotW

  LANES.forEach((lane, i) => {
    const top = i * (laneH + laneGap)
    const min = lane.min(buf)
    const max = lane.max(buf)
    const yOf = (v: number) => top + laneH - ((v - min) / (max - min)) * laneH

    // Lane background + border
    ctx.fillStyle = 'rgba(15,23,42,0.6)'
    ctx.fillRect(padL, top, plotW, laneH)

    // Gridlines (quarters)
    ctx.strokeStyle = COLORS.grid
    ctx.lineWidth = 1
    for (let g = 1; g < 4; g++) {
      const y = top + (laneH * g) / 4
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(padL + plotW, y)
      ctx.stroke()
    }

    // Zero line (flow especially)
    if (min < 0 && max > 0) {
      const yz = yOf(0)
      ctx.strokeStyle = COLORS.zero
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padL, yz)
      ctx.lineTo(padL + plotW, yz)
      ctx.stroke()
    }

    // Pmus overlay on the pressure lane
    if (showPmus && lane.key === 'paw') {
      ctx.strokeStyle = COLORS.pmus
      ctx.lineWidth = 1.25
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      let started = false
      for (const s of buf) {
        // draw Pmus as a downward deflection from PEEP baseline for intuition
        const v = -s.pmus
        const x = xOf(s.t)
        const y = yOf(v)
        if (!started) {
          ctx.moveTo(x, y)
          started = true
        } else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Main trace
    ctx.strokeStyle = lane.color
    ctx.lineWidth = 1.75
    ctx.lineJoin = 'round'
    ctx.beginPath()
    let started = false
    for (const s of buf) {
      const x = xOf(s.t)
      const y = yOf(s[lane.key])
      if (!started) {
        ctx.moveTo(x, y)
        started = true
      } else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // Trigger event markers on the pressure lane
    if (lane.key === 'paw') {
      for (const s of buf) {
        if (!s.triggerEvent) continue
        const style = TRIGGER_STYLE[s.triggerEvent]
        const x = xOf(s.t)
        ctx.strokeStyle = style.color
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.moveTo(x, top + 2)
        ctx.lineTo(x, top + laneH - 2)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = style.color
        ctx.font = '10px ui-monospace, monospace'
        ctx.textAlign = 'center'
        ctx.fillText(style.label, x, top + 11)
      }
    }

    // Axis labels
    ctx.fillStyle = COLORS.label
    ctx.font = '11px ui-sans-serif, system-ui'
    ctx.textAlign = 'left'
    ctx.fillText(`${lane.title}`, padL + 4, top + laneH - 6)
    ctx.textAlign = 'right'
    ctx.fillText(`${Math.round(max)}`, padL - 6, top + 12)
    ctx.fillText(`${Math.round(min)}`, padL - 6, top + laneH - 4)
    ctx.save()
    ctx.translate(12, top + laneH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'center'
    ctx.fillStyle = lane.color
    ctx.fillText(lane.unit, 0, 0)
    ctx.restore()
  })
}
