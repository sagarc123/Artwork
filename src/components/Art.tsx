// Hand-made-looking art pieces drawn in code (no image files). All decorative: aria-hidden.
import type { CSSProperties, ReactNode } from 'react'
import { GenerativeRangoli } from './GenerativeRangoli'

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

/** Numbered steps with big Devanagari numerals (decorative; the list itself carries the order). */
export function StepList({ steps, className = '' }: { steps: string[]; className?: string }) {
  return (
    <ol className={`grid gap-5 ${className}`}>
      {steps.map((step, i) => (
        <li key={step} className="reveal grid grid-cols-[3.5rem_1fr] items-center gap-3">
          <span aria-hidden="true" className="font-display text-[3.25rem] leading-none text-kumkum">
            {DEVA_DIGITS[i]}
          </span>
          <span className="text-h3-sm">{step}</span>
        </li>
      ))}
    </ol>
  )
}

/** Top-down doorstep in a paper frame (so it reads on dark floors too): toran on top, a rangoli in front, a stone step and diyas. */
export function DoorstepScene({ seed, label, className = '' }: { seed: string; label?: string; className?: string }) {
  return (
    <figure className={`grid gap-2 ${className}`}>
      <div aria-hidden="true" className="bg-surface p-1.5 shadow-frame sm:p-2 lg:p-3">
        <div className="relative aspect-[4/5] overflow-hidden bg-charcoal grain-dark">
          <div className="toran absolute inset-x-0 top-0 h-6" />
          <GenerativeRangoli seed={seed} tone="dark" className="absolute top-1/2 left-1/2 w-[78%] -translate-x-1/2 -translate-y-[45%]" />
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

const PROFILE =
  'M28 100C28 82 36 74 45 70C39 64 36 55 37 45C38 31 48 22 60 23C72 24 79 34 78 46C78 52 76 56 79 60C81 63 78 65 77 67C78 71 75 73 73 73C73 78 70 81 66 81C68 86 75 89 84 93C90 96 92 100 92 100Z'

/** "Your photo" beside "drawn by hand": a flat silhouette and the same face in charcoal hatching. */
export function PortraitPair({ photoLabel, drawingLabel }: { photoLabel: string; drawingLabel: string }) {
  return (
    <div className="relative grid grid-cols-2 items-end gap-4 sm:gap-8">
      <figure className="tilt-left grid gap-3">
        <div aria-hidden="true" className="aspect-[4/5] bg-peacock p-3 shadow-frame">
          <svg viewBox="0 0 100 100" className="size-full">
            <rect width="100" height="100" fill="#e8d9c2" />
            <path d={PROFILE} fill="#5f574f" />
          </svg>
        </div>
        <figcaption className="text-paper">{photoLabel}</figcaption>
      </figure>
      <svg aria-hidden="true" viewBox="0 0 80 40" className="chalk-arrow absolute top-[38%] left-1/2 w-[18%] -translate-x-1/2">
        <path d="M4 26C24 6 52 6 72 20M72 20L60 18M72 20L66 30" pathLength={1} />
      </svg>
      <figure className="tilt-right grid gap-3">
        <div aria-hidden="true" className="aspect-[4/5] bg-paper p-3 shadow-frame grain">
          <svg viewBox="0 0 100 100" className="size-full">
            <defs>
              <pattern id="hatch" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                <line x1="0" y1="0" x2="0" y2="3" stroke="#1e1b18" strokeWidth="1.1" strokeOpacity=".75" />
              </pattern>
              <clipPath id="profile-clip">
                <path d={PROFILE} />
              </clipPath>
            </defs>
            <rect width="100" height="100" fill="url(#hatch)" clipPath="url(#profile-clip)" opacity=".85" />
            <path d={PROFILE} fill="none" stroke="#1e1b18" strokeWidth="1.2" className="sketch-line" pathLength={1} />
          </svg>
        </div>
        <figcaption className="text-paper">{drawingLabel}</figcaption>
      </figure>
    </div>
  )
}

/** Kolam dot grid with one continuous line weaving through it as the visitor scrolls. */
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
      <g className="kolam-dots">{dots}</g>
      <path d={weave} pathLength={1} />
    </svg>
  )
}

/** Festival symbols: diya (Diwali), modak (Ganesh), gudi (Gudi Padwa), kalash (weddings). */
export function FestivalMotif({ kind, className = '' }: { kind: 'diwali' | 'ganesh' | 'gudi' | 'wedding'; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" className={`festival-motif ${className}`}>
      {kind === 'diwali' && (
        <>
          <path d="M18 62Q50 88 82 62Z" fill="var(--color-marigold)" />
          <path className="diya-flame" d="M50 30C59 43 57 54 50 58C43 54 41 43 50 30Z" fill="var(--color-turmeric)" />
        </>
      )}
      {kind === 'ganesh' && (
        <>
          <path d="M50 18C61 32 76 45 74 63C72 79 28 79 26 63C24 45 39 32 50 18Z" fill="var(--color-paper)" />
          <path d="M50 22V76M40 32Q36 56 40 76M60 32Q64 56 60 76" stroke="var(--color-kumkum)" strokeWidth="2" fill="none" />
        </>
      )}
      {kind === 'gudi' && (
        <>
          <path d="M50 22V92" stroke="var(--color-paper)" strokeWidth="3" />
          <path d="M50 32L76 56L50 66Z" fill="var(--color-turmeric)" />
          <circle cx="50" cy="20" r="7" fill="var(--color-marigold)" />
        </>
      )}
      {kind === 'wedding' && (
        <>
          <path d="M30 52Q30 82 50 82Q70 82 70 52Z" fill="var(--color-marigold)" />
          <rect x="34" y="44" width="32" height="8" fill="var(--color-turmeric)" />
          <path d="M50 44C40 30 32 32 30 26M50 44C60 30 68 32 70 26M50 44V24" stroke="#9dc79e" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="50" cy="22" r="7" fill="#8a5a2b" />
        </>
      )}
    </svg>
  )
}
