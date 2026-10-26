// Hand-made-looking art pieces drawn in code (no image files). All decorative: aria-hidden.
import { useId, type ReactNode } from 'react'
import { cubic, taperedPath, type Pt, type RangoliStyle } from '@/lib/art'
import { GenerativeRangoli } from './GenerativeRangoli'
import { PhotoStandIn, SketchStandIn } from './StandIns'

/** Threshold between two "floors": a woven paithani border over a row of powder dots. One empty div; the pattern is all CSS. */
export function Threshold({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`threshold ${className}`} />
}

/** One huge Devanagari word used as graphic texture behind a section. */
export function DisplayWord({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span aria-hidden="true" lang="mr" className={`display-word pointer-events-none select-none ${className}`}>
      {children}
    </span>
  )
}

/** Marigold brush stroke under a heading. */
export function BrushUnderline({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 300 16" preserveAspectRatio="none" className={`brush ${className}`}>
      <path d="M4 11C60 4 120 13 180 7S260 5 296 9" pathLength={1} />
    </svg>
  )
}

const DEVA_DIGITS = ['१', '२', '३', '४', '५', '६']

/** Numbered steps with big Devanagari numerals (decorative; the list itself carries the order). Numerals press in like a dot on scroll. */
export function StepList({ steps, className = '' }: { steps: string[]; className?: string }) {
  return (
    <ol className={`grid gap-5 ${className}`}>
      {steps.map((step, i) => (
        <li key={step} className="grid grid-cols-[3.5rem_1fr] items-center gap-3">
          <span aria-hidden="true" className="reveal font-display text-[3.25rem] leading-none text-kumkum">
            {DEVA_DIGITS[i]}
          </span>
          <span className="text-h3-sm">{step}</span>
        </li>
      ))}
    </ol>
  )
}

/** Top-down doorstep in a paper frame (so it reads on dark floors too): toran on top, a rangoli in front, a stone step and diyas. */
export function DoorstepScene({ seed, style, label, className = '' }: { seed: string; style?: RangoliStyle; label?: string; className?: string }) {
  return (
    <figure className={`grid gap-2 ${className}`}>
      <div aria-hidden="true" className="bg-surface p-1.5 shadow-frame sm:p-2 lg:p-3">
        <div className="relative aspect-[4/5] overflow-hidden bg-charcoal grain-dark">
          <div className="toran absolute inset-x-0 top-0 h-6" />
          <GenerativeRangoli seed={seed} style={style} tone="dark" className="absolute top-1/2 left-1/2 w-[82%] -translate-x-1/2 -translate-y-[45%]" />
          <span className="diya absolute bottom-[16%] left-[8%]" />
          <span className="diya absolute right-[8%] bottom-[16%]" />
          {/* Basalt doorstep with a worn, lighter edge: same stone family as the floor. */}
          <div className="absolute inset-x-0 bottom-0 h-[12%] border-t-[3px] border-[#8b8178] bg-[#4d4640]" />
        </div>
      </div>
      {label && <figcaption className="font-heading text-h3">{label}</figcaption>}
    </figure>
  )
}

/** "Your photo" beside "drawn by hand": a flat snapshot and the same face in charcoal (its lines draw in on scroll). */
export function PortraitPair({ photoLabel, drawingLabel }: { photoLabel: string; drawingLabel: string }) {
  return (
    <div className="relative grid grid-cols-2 items-end gap-4 sm:gap-8">
      <figure className="tilt-left grid gap-3">
        <div aria-hidden="true" className="aspect-[4/5] bg-surface p-2 shadow-frame sm:p-3">
          <PhotoStandIn seed="portrait-pair" />
        </div>
        <figcaption className="text-paper">{photoLabel}</figcaption>
      </figure>
      <svg aria-hidden="true" viewBox="0 0 80 40" className="chalk-arrow absolute top-[38%] left-1/2 w-[18%] -translate-x-1/2">
        <path d="M4 26C24 6 52 6 72 20M72 20L60 18M72 20L66 30" pathLength={1} />
      </svg>
      <figure className="tilt-right grid gap-3">
        <div aria-hidden="true" className="grid aspect-[4/5] place-items-center bg-paper shadow-frame grain">
          <SketchStandIn seed="portrait-pair" subject="face" />
        </div>
        <figcaption className="text-paper">{drawingLabel}</figcaption>
      </figure>
    </div>
  )
}

/** Kolam dot grid with one continuous powder-white line weaving through it as the visitor scrolls. */
export function KolamWeave({ className = '' }: { className?: string }) {
  const dots = []
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) dots.push(<circle key={`${r}-${c}`} cx={10 + c * 20} cy={10 + r * 20} r="1.8" />)
  // A sikku-style loop: wave across each row, turning at the edges.
  const weave =
    'M0 20C10 30 10 30 20 20S30 10 40 20 50 30 60 20 70 10 80 20 90 30 100 20' +
    'C110 30 110 50 100 60S90 70 80 60 70 50 60 60 50 70 40 60 30 50 20 60 10 70 0 60' +
    'C-10 70 -10 90 0 100S10 110 20 100 30 90 40 100 50 110 60 100 70 90 80 100 90 110 100 100'
  return (
    <svg aria-hidden="true" viewBox="-12 0 124 112" className={`kolam-weave ${className}`}>
      <g className="fx" filter="url(#powder)">
        <g className="kolam-dots">{dots}</g>
        <path d={weave} pathLength={1} className="kolam-halo" />
        <path d={weave} pathLength={1} />
      </g>
    </svg>
  )
}

// Brand mark "Bindu": one hand-drawn powder stroke (thick in the middle, thin at the ends) left open,
// with the kumkum dot every rangoli starts from sitting in the gap. Abstract: dot → line.
// Same shape as the app icons in scripts/make-icons.mjs.
const BINDU_STROKE =
  'M13.01,-2.77L13.72,-1.04L13.97,0.82L13.92,2.71L13.58,4.6L12.96,6.43L12.08,8.16L10.96,9.77L9.61,11.21L8.07,12.46L6.36,13.48L4.52,14.26L2.58,14.78L0.58,15.03L-1.43,15L-3.43,14.69L-5.36,14.11L-7.2,13.27L-8.9,12.19L-10.44,10.88L-11.79,9.38L-12.91,7.71L-13.8,5.9L-14.42,3.99L-14.78,2.02L-14.87,0.03L-14.68,-1.95L-14.23,-3.87L-13.53,-5.71L-12.58,-7.43L-11.41,-9L-10.05,-10.38L-8.52,-11.56L-6.85,-12.51L-5.09,-13.22L-3.25,-13.67L-1.38,-13.87L0.48,-13.81L2.29,-13.49L4.03,-12.91L5.62,-12.05L5.54,-11.87L3.83,-12.29L2.13,-12.54L0.43,-12.58L-1.24,-12.4L-2.86,-12.01L-4.4,-11.42L-5.83,-10.64L-7.15,-9.69L-8.32,-8.59L-9.32,-7.35L-10.15,-6L-10.79,-4.56L-11.24,-3.06L-11.49,-1.52L-11.53,0.03L-11.37,1.56L-11.02,3.05L-10.48,4.48L-9.76,5.82L-8.87,7.06L-7.84,8.17L-6.67,9.13L-5.39,9.93L-4.01,10.57L-2.57,11.02L-1.08,11.28L0.44,11.35L1.96,11.22L3.45,10.9L4.9,10.39L6.28,9.7L7.57,8.83L8.75,7.8L9.79,6.62L10.69,5.3L11.43,3.87L11.99,2.34L12.38,0.72L12.6,-0.95L12.81,-2.72Z'

// Motion (the CSS lives with the mark so the site and the admin panel share it):
// - on load the stroke trickles round from the dot like powder from a pinch (bindu → rekha). The dot itself never
//   animates, so a screenshot or a slow first frame still shows the mark; the stroke is whole after 0.9s;
// - on hover/focus the dot circles once with the line chasing it, then both settle back.
// Off for reduced motion and the site's "Stop animations" / lite modes.
const BINDU_CSS = `
.bm .bm-reveal{stroke-dasharray:1;stroke-dashoffset:0}
.bm .bm-orbit,.bm .bm-chase{transform-box:view-box;transform-origin:50% 50%}
@keyframes bm-draw{from{stroke-dashoffset:1}}
@keyframes bm-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:no-preference){
.bm:not(.bm--still) .bm-reveal{animation:bm-draw .9s cubic-bezier(.65,0,.35,1)}
:is(a,button):is(:hover,:focus-visible) .bm .bm-orbit,.bm:hover .bm-orbit{animation:bm-spin 1s cubic-bezier(.65,0,.35,1)}
:is(a,button):is(:hover,:focus-visible) .bm .bm-chase,.bm:hover .bm-chase{animation:bm-spin 1s cubic-bezier(.65,0,.35,1) .12s}
}
:root:is([data-motion=off],[data-fx=lite]) .bm *{animation:none!important}
`

/**
 * Header and admin mark. The stroke takes the text colour (works on light and dark); the dot stays kumkum. Decorative.
 * `animate={false}`: no draw-in on load (the admin top bar re-mounts it on every page); the hover spin stays.
 */
export function BrandMark({ className = '', animate = true }: { className?: string; animate?: boolean }) {
  // The mark appears twice on a page (header and menu): each copy needs its own mask id.
  const uid = `bm${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    // viewBox starts at 0 so "50% 50%" is the centre in every browser; the shapes are drawn around 0,0 and moved in.
    <svg aria-hidden="true" focusable="false" viewBox="0 0 34 34" className={`bm ${animate ? '' : 'bm--still '}${className}`}>
      <style>{BINDU_CSS}</style>
      <mask id={uid} maskUnits="userSpaceOnUse" x="-17" y="-17" width="34" height="34">
        {/* The stroke is revealed along its own arc, start to end, like powder being trickled. */}
        <path className="bm-reveal" d="M12.91,-2.74A13.2,13.2 0 1 1 5.58,-11.96" fill="none" stroke="#fff" strokeWidth="7" pathLength={1} />
      </mask>
      <g className="bm-chase">
        <path transform="translate(17 17)" d={BINDU_STROKE} fill="currentColor" mask={`url(#${uid})`} />
      </g>
      <g className="bm-orbit">
        <g transform="translate(17 17)">
          <circle className="bm-dot" cx="10.4" cy="-8.13" r="2.8" fill="var(--color-kumkum, #A6261D)" />
        </g>
      </g>
    </svg>
  )
}

// Festival symbols drawn like the rangoli: poured colour, tapered powder lines, the same grain.
const T = (pts: Pt[], w: number, bias = 1) => taperedPath(pts, w, bias)
const C = (a: Pt, b: Pt, c: Pt, d: Pt, n = 9) => cubic(a, b, c, d, n)
const arcDots = (cx: number, cy: number, r: number, n: number, from: number, to: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = ((from + ((to - from) * i) / (n - 1)) * Math.PI) / 180
    return `M${+(cx + r * Math.cos(a)).toFixed(1)},${+(cy + r * Math.sin(a)).toFixed(1)}h0`
  }).join('')

type Motif = { fills: [string, string][]; lines: string[]; dots: string; ink?: string }
const MOTIF: Record<'diwali' | 'ganesh' | 'gudi' | 'wedding', Motif> = {
  diwali: {
    fills: [
      ['M16 62Q50 92 84 62Z', 'var(--color-marigold)'],
      [T(C([50, 60], [36, 52], [44, 38], [50, 22]), 18, 0.35), 'var(--color-turmeric)'],
      [T(C([50, 58], [45, 52], [47, 46], [50, 40]), 7, 0.4), '#d0473b'],
    ],
    lines: [T(C([18, 64], [32, 78], [68, 78], [82, 64], 12), 2.6), T(C([26, 71], [38, 82], [62, 82], [74, 71], 10), 1.2)],
    dots: arcDots(50, 62, 40, 9, 200, 340),
  },
  ganesh: {
    fills: [['M50 16C62 31 77 45 75 63C73 80 27 80 25 63C23 45 38 31 50 16Z', 'var(--color-paper)']],
    lines: [T(C([50, 22], [50, 40], [50, 60], [50, 78]), 2.6), T(C([43, 30], [35, 48], [36, 64], [40, 77]), 2.2), T(C([57, 30], [65, 48], [64, 64], [60, 77]), 2.2)],
    dots: arcDots(50, 50, 42, 11, 20, 160),
    ink: 'var(--color-kumkum)',
  },
  gudi: {
    fills: [
      ['M50 32L77 55L50 67Z', 'var(--color-turmeric)'],
      ['M41 28C41 18 59 18 59 28Z', 'var(--color-marigold)'],
    ],
    lines: [T(C([50, 28], [50, 50], [51, 72], [50, 94]), 3.4), T(C([50, 36], [58, 44], [66, 50], [74, 55]), 1.4), T(C([42, 30], [36, 34], [32, 40], [30, 46]), 2.4, 0.4), T(C([58, 30], [64, 34], [68, 40], [70, 46]), 2.4, 0.4)],
    dots: arcDots(50, 30, 13, 7, 20, 160),
  },
  wedding: {
    fills: [
      ['M28 52Q28 84 50 84Q72 84 72 52Z', 'var(--color-marigold)'],
      ['M32 44H68V52H32Z', 'var(--color-turmeric)'],
      ['M43 22A7 7 0 1 1 57 22A7 7 0 1 1 43 22Z', '#8a5a2b'],
    ],
    lines: [T(C([50, 44], [44, 36], [36, 32], [27, 27]), 4.4, 0.4), T(C([50, 44], [56, 36], [64, 32], [73, 27]), 4.4, 0.4), T(C([50, 44], [49, 38], [50, 33], [50, 29]), 3.4, 0.4), T(C([30, 66], [40, 72], [60, 72], [70, 66]), 1.4)],
    dots: arcDots(50, 64, 30, 9, 20, 160),
    ink: '#9dc79e',
  },
}

/** Festival symbols: diya (Diwali), modak (Ganesh), gudi (Gudi Padwa), kalash (weddings). */
export function FestivalMotif({ kind, className = '' }: { kind: keyof typeof MOTIF; className?: string }) {
  const m = MOTIF[kind]
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" className={`festival-motif ${className}`}>
      <g className="fx" filter="url(#powder)">
        {m.fills.map(([d, fill]) => (
          <path key={d} d={d} fill={fill} />
        ))}
        <path d={m.lines.join('')} fill={m.ink ?? 'var(--color-paper)'} />
        <path d={m.dots} stroke="var(--color-paper)" strokeWidth="2.2" strokeLinecap="round" opacity={0.85} />
      </g>
    </svg>
  )
}
