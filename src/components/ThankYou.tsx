'use client'

import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import { r1 } from '@/lib/art'
import { firstView } from '@/lib/motion'
import { InlineScript } from './InlineScript'

// Festive: eight petals round a leaf-green centre with a tick. Everyday: eight ink dots and one line weaving round them
// (in, out, in…) that closes its loop, then a tick. Drawn once at module load.
const PETAL = 'M0-8C5.5-13 5.5-21 0-27C-5.5-21-5.5-13 0-8Z'
const DOTS = Array.from({ length: 8 }, (_, i) => [r1(20 * Math.sin((i * Math.PI) / 4)), r1(-20 * Math.cos((i * Math.PI) / 4))])
const LOOP =
  Array.from({ length: 97 }, (_, i) => {
    const a = (i / 96) * 2 * Math.PI
    const r = 20 + 5.5 * Math.cos(4 * a)
    return `${i ? 'L' : 'M'}${r1(r * Math.sin(a))} ${r1(-r * Math.cos(a))}`
  }).join('') + 'Z'
const TICK = 'M-6 0.5L-1.8 4.6L6.2-4'

/**
 * The thank-you moment (order placed, enquiry sent, reminder saved): a rangoli bloom when festive, an ink kolam closing
 * its loop when everyday. ≤1.2s, once, decoration only: the text next to it says what happened (globals.css .ty).
 * `once`: an order id. The moment plays the first time that order is seen in this browser, then it just shows.
 */
export function ThankYouMark({ once, className = 'size-14' }: { once?: string; className?: string }) {
  const ref = useRef<SVGSVGElement>(null)
  // Arrived by client navigation (checkout → order page), the inline script below never ran: check here, before paint.
  useLayoutEffect(() => {
    const el = ref.current
    if (!once || !el || 'checked' in el.dataset) return
    el.dataset.checked = ''
    try {
      if (!firstView(localStorage, `ty:${once}`)) el.dataset.seen = ''
    } catch {
      // Storage blocked: it plays.
    }
  }, [once])

  return (
    <>
      <svg ref={ref} aria-hidden="true" focusable="false" viewBox="-30 -30 60 60" className={`ty shrink-0 overflow-visible ${className}`} suppressHydrationWarning>
        <g className="look-festive">
          {Array.from({ length: 8 }, (_, i) => (
            <g key={i} transform={`rotate(${i * 45})`}>
              <path d={PETAL} className="ty-petal" fill={i % 2 ? 'var(--color-kumkum)' : 'var(--color-marigold)'} style={{ '--i': i } as CSSProperties} />
            </g>
          ))}
          <circle r="9.5" className="ty-core" fill="var(--color-leaf)" />
          <path d={TICK} className="ty-check" pathLength={1} stroke="#fff" />
        </g>
        <g className="look-everyday">
          <path d={DOTS.map(([x, y]) => `M${x} ${y}h0`).join('')} className="ty-dots" />
          <path d={LOOP} className="ty-loop" pathLength={1} />
          <path d={TICK} className="ty-check ty-check--ink" pathLength={1} stroke="var(--color-leaf)" />
        </g>
      </svg>
      {/* Full page load: decide before first paint, so a second visit never flashes the start of the moment. */}
      {once && /^[\w-]+$/.test(once) && (
        <InlineScript
          html={`try{var e=document.currentScript.previousElementSibling;e.dataset.checked="";if(!(${firstView})(localStorage,"ty:${once}"))e.dataset.seen=""}catch(x){}`}
        />
      )}
    </>
  )
}
