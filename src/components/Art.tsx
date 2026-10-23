// Hand-made-looking art pieces drawn in code (no image files). All decorative: aria-hidden.
import type { CSSProperties, ReactNode } from 'react'
import { cubic, taperedPath, type Pt, type RangoliStyle } from '@/lib/art'
import { GenerativeRangoli } from './GenerativeRangoli'
import { PhotoStandIn, SketchStandIn } from './StandIns'

/** Threshold between two "floors": a woven paithani border and a row of powder dots. */
export function Threshold({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`relative ${className}`}>
      <div className="paithani" />
      <div className="powder-dots" />
    </div>
  )
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

/** A small heap of rangoli powder in one colour. */
export function PowderHeap({ color, className = '' }: { color: string; className?: string }) {
  return <span aria-hidden="true" className={`powder-heap ${className}`} style={{ '--heap': color } as CSSProperties} />
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

// Brand seal: an eight-petal flower rangoli (white powder petals, marigold between) on a kumkum disc,
// ringed with turmeric dots. Fixed paths so it reads the same everywhere, down to 32px.
const SEAL_PETALS =
  'M0,-3Q-3.77,-7.74 0,-13.2Q3.77,-7.74 0,-3ZM2.12,-2.12Q2.8,-8.14 9.33,-9.33Q8.14,-2.8 2.12,-2.12ZM3,0Q7.74,-3.77 13.2,0Q7.74,3.77 3,0ZM2.12,2.12Q8.14,2.8 9.33,9.33Q2.8,8.14 2.12,2.12ZM0,3Q3.77,7.74 0,13.2Q-3.77,7.74 0,3ZM-2.12,2.12Q-2.8,8.14 -9.33,9.33Q-8.14,2.8 -2.12,2.12ZM-3,0Q-7.74,3.77 -13.2,0Q-7.74,-3.77 -3,0ZM-2.12,-2.12Q-8.14,-2.8 -9.33,-9.33Q-2.8,-8.14 -2.12,-2.12Z'
const SEAL_INNER =
  'M1.91,-4.62Q0.07,-8.3 4.21,-10.16Q5.82,-5.92 1.91,-4.62ZM4.62,-1.91Q5.92,-5.82 10.16,-4.21Q8.3,-0.07 4.62,-1.91ZM4.62,1.91Q8.3,0.07 10.16,4.21Q5.92,5.82 4.62,1.91ZM1.91,4.62Q5.82,5.92 4.21,10.16Q0.07,8.3 1.91,4.62ZM-1.91,4.62Q-0.07,8.3 -4.21,10.16Q-5.82,5.92 -1.91,4.62ZM-4.62,1.91Q-5.92,5.82 -10.16,4.21Q-8.3,0.07 -4.62,1.91ZM-4.62,-1.91Q-8.3,-0.07 -10.16,-4.21Q-5.92,-5.82 -4.62,-1.91ZM-1.91,-4.62Q-5.82,-5.92 -4.21,-10.16Q-0.07,-8.3 -1.91,-4.62Z'
const SEAL_DOTS =
  'M3.12,-15.69h0M8.89,-13.3h0M13.3,-8.89h0M15.69,-3.12h0M15.69,3.12h0M13.3,8.89h0M8.89,13.3h0M3.12,15.69h0M-3.12,15.69h0M-8.89,13.3h0M-13.3,8.89h0M-15.69,3.12h0M-15.69,-3.12h0M-13.3,-8.89h0M-8.89,-13.3h0M-3.12,-15.69h0'

/** Header and admin mark: the rangoli seal. Decorative (the name beside it is the link text). */
// Colours have fallbacks because the admin panel doesn't define every site colour variable.
export function KolamMark({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="-20 -20 40 40" className={className}>
      <circle r="19.4" fill="var(--color-kumkum, #A6261D)" />
      <path d={SEAL_INNER} fill="var(--color-marigold, #E8890C)" />
      <path d={SEAL_PETALS} fill="var(--color-paper, #FAF6EF)" />
      <path d={SEAL_DOTS} stroke="var(--color-turmeric, #F2B705)" strokeWidth="2" strokeLinecap="round" />
      <circle r="3" fill="var(--color-turmeric, #F2B705)" />
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
