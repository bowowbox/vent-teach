import { useState } from 'react'
import { lessons, type Block } from '../content/lessons'
import { useSim } from '../store/simStore'
import { SimStage } from '../components/SimStage'
import { ReferenceList } from '../components/ReferenceList'

export function LearnView() {
  const [activeId, setActiveId] = useState(lessons[0].id)
  const applySettings = useSim((s) => s.applySettings)
  const setRunning = useSim((s) => s.setRunning)
  const lesson = lessons.find((l) => l.id === activeId)!

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Lesson list: horizontal scroll strip on mobile, sidebar on desktop */}
      <aside className="lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800 p-2 lg:p-3 lg:overflow-y-auto">
        <h2 className="hidden lg:block text-[11px] font-semibold uppercase tracking-wide text-slate-500 px-1 mb-1">
          Fundamentals
        </h2>
        <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
          {lessons.map((l) => (
            <button
              key={l.id}
              onClick={() => setActiveId(l.id)}
              className={`shrink-0 lg:shrink w-52 lg:w-full text-left rounded-lg px-3 py-2 transition ${
                activeId === l.id
                  ? 'bg-sky-500/15 ring-1 ring-sky-500/40'
                  : 'bg-slate-900/40 lg:bg-transparent hover:bg-slate-800/50'
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  activeId === l.id ? 'text-sky-200' : 'text-slate-200'
                }`}
              >
                {l.title}
              </span>
              <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{l.subtitle}</p>
            </button>
          ))}
        </div>
      </aside>

      {/* Lesson body + live sim */}
      <div className="flex-1 min-w-0 grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 overflow-y-auto">
        {/* Sim pinned to top on mobile so waveforms stay visible while reading / tapping "Try this" */}
        <div className="order-1 xl:order-2 sticky top-0 z-10 self-start w-full min-w-0 bg-slate-950/90 backdrop-blur xl:bg-transparent rounded-lg pt-1 pb-2 xl:py-0">
          <SimStage minH={300} />
          <p className="mt-2 text-[11px] text-slate-500 hidden sm:block">
            Press a <span className="text-sky-300 font-medium">“Try this”</span> button in the
            lesson to load a scenario into the live waveforms, then explore with the Sandbox
            controls.
          </p>
        </div>

        <article className="order-2 xl:order-1 min-w-0 space-y-3">
          <header>
            <h1 className="text-lg font-bold text-slate-100">{lesson.title}</h1>
            <p className="text-sm text-slate-400">{lesson.subtitle}</p>
          </header>
          {lesson.blocks.map((b, i) => (
            <BlockView
              key={i}
              block={b}
              onTry={(s) => {
                applySettings(s)
                setRunning(true)
              }}
            />
          ))}
          <ReferenceList ids={lesson.refIds} />
        </article>
      </div>
    </div>
  )
}

function BlockView({ block, onTry }: { block: Block; onTry: (s: import('../engine/types').SimSettings) => void }) {
  switch (block.t) {
    case 'h':
      return <h3 className="text-sm font-semibold text-sky-300 pt-1">{block.text}</h3>
    case 'p':
      return <p className="text-sm leading-relaxed text-slate-300">{block.text}</p>
    case 'list':
      return (
        <ul className="space-y-1.5 pl-1">
          {block.items.map((it, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-300">
              <span className="text-sky-500 mt-0.5">▸</span>
              <span className="leading-snug">{it}</span>
            </li>
          ))}
        </ul>
      )
    case 'callout': {
      const styles = {
        key: 'bg-sky-500/10 ring-sky-500/30 text-sky-100',
        safety: 'bg-rose-500/10 ring-rose-500/30 text-rose-100',
        tip: 'bg-emerald-500/10 ring-emerald-500/30 text-emerald-100',
      }[block.tone]
      const icon = { key: '🔑', safety: '⚠️', tip: '💡' }[block.tone]
      return (
        <div className={`rounded-lg ring-1 p-3 text-sm leading-snug ${styles}`}>
          <span className="mr-1.5">{icon}</span>
          {block.text}
        </div>
      )
    }
    case 'try':
      return (
        <div className="rounded-lg bg-slate-800/50 ring-1 ring-slate-700 p-3">
          <button
            onClick={() => onTry(block.settings)}
            className="rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 transition"
          >
            ▶ Try this: {block.label}
          </button>
          <p className="mt-2 text-xs text-slate-400 leading-snug">{block.note}</p>
        </div>
      )
  }
}
