'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, type CSSProperties, type ReactNode } from 'react'
import { clampPct, revealClip } from '@/lib/motion'

type Props = {
  /** Shown from the left edge up to the line (the customer's photo). */
  before: ReactNode
  /** Shown to the right of the line (the drawing). */
  after: ReactNode
  labels: { before: string; after: string; slider: string; value: string }
  ratio?: string
}

/**
 * Before/after: two pictures stacked, a native range input moves the line (arrows, Page Up/Down, Home/End, drag or tap
 * anywhere on touch). The input covers the whole picture, invisible; the line and the 48px handle follow its value.
 */
export function BeforeAfter({ before, after, labels, ratio = '4/5' }: Props) {
  const [v, setV] = useState(50)
  const text = labels.value.replace('{photo}', String(v)).replace('{drawing}', String(100 - v))
  return (
    <div className="ba relative overflow-hidden" style={{ aspectRatio: ratio, '--pos': `${v}%` } as CSSProperties}>
      <div className="absolute inset-0">{after}</div>
      <div className="absolute inset-0" style={{ clipPath: revealClip(v) }}>
        {before}
      </div>
      <span aria-hidden="true" className="ba-line" />
      <span aria-hidden="true" className="ba-knob">
        <ChevronLeft className="size-5" />
        <ChevronRight className="size-5" />
      </span>
      <span aria-hidden="true" className="ba-chip left-2">
        {labels.before}
      </span>
      <span aria-hidden="true" className="ba-chip right-2">
        {labels.after}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={v}
        onChange={(e) => setV(clampPct(Number(e.currentTarget.value)))}
        aria-label={labels.slider}
        aria-valuetext={text}
        className="ba-input"
      />
    </div>
  )
}
