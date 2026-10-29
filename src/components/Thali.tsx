import type { CSSProperties, ReactNode } from 'react'
import { seededRandom } from '@/lib/seed'

// The "thali": a round plate with a rim of jittered dots, the art inside, and the Bindu (open ring + kumkum dot) as its centre construction.
// Everyday look only (festive hides these via .look-everyday). Rims come from a seeded generator, so server and browser draw the same dots.

export type ThaliCategory = 'rangoli' | 'portrait' | 'painting' | 'course'

const KUMKUM = '#A6261D'
const PEACOCK = '#0B5E73'
/** Rim colours per kind of art (haldi/kumkum, white/indigo, teal/marigold, leaf/haldi) and the soft disc under the rim. */
const LOOK: Record<ThaliCategory, { rim: [string, string]; disc: string }> = {
  rangoli: { rim: ['#F2B705', KUMKUM], disc: '#FFF1D2' },
  portrait: { rim: ['#FFFFFF', '#3B3F8F'], disc: '#E4E4F4' },
  painting: { rim: [PEACOCK, '#F2A20C'], disc: '#DCEEF2' },
  course: { rim: ['#2E6B3C', '#F2B705'], disc: '#E4F0E1' },
}

const pt = (r: number, deg: number) => [60 + r * Math.cos((deg * Math.PI) / 180), 60 + r * Math.sin((deg * Math.PI) / 180)] as const
const f1 = (n: number) => n.toFixed(1)

function Rim({ n, seed, colours, r, base, jit, sjit }: { n: number; seed: string; colours: [string, string]; r: number; base: number; jit: number; sjit: number }) {
  const rand = seededRandom(seed)
  // .rim: the dots pop in one by one on load (--i) and the badge's rim turns on hover (globals.css).
  return (
    <g className="rim">
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = pt(r + (rand() * 2 - 1) * jit, (i * 360) / n + (rand() * 2 - 1) * 1.6)
        return <circle key={i} cx={f1(x)} cy={f1(y)} r={(base + (rand() * 2 - 1) * sjit).toFixed(2)} fill={colours[i % 2]} style={{ '--i': i } as CSSProperties} />
      })}
    </g>
  )
}

/** The open ring (320° of it) and, in the gap, the kumkum dot. */
function Bindu({ r, w, dot }: { r: number; w: number; dot: number }) {
  const [x0, y0] = pt(r, -15)
  const [x1, y1] = pt(r, 305)
  const [gx, gy] = pt(r, -35)
  return (
    <>
      <path className="bm-ring" d={`M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 1 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`} fill="none" stroke={PEACOCK} strokeWidth={w} strokeLinecap="round" />
      <circle cx={f1(gx)} cy={f1(gy)} r={dot} fill={KUMKUM} />
    </>
  )
}

/**
 * A plate. `children` (a photo or a stand-in) sit inside the round opening; `width` is any CSS length.
 * Decorative frame: the art inside carries the alt text.
 */
export function Thali({ category, seed, children, width = '100%', n = 20, className = '' }: { category: ThaliCategory; seed: string; children?: ReactNode; width?: string; n?: number; className?: string }) {
  const { rim, disc } = LOOK[category]
  return (
    <div className={`thali relative aspect-square ${className}`} style={{ width }}>
      <svg aria-hidden="true" focusable="false" viewBox="0 0 120 120" className="absolute inset-0 size-full overflow-visible">
        <circle cx="60" cy="60" r="58" fill={disc} />
        <Rim n={n} seed={seed} colours={rim} r={52.5} base={3.6} jit={1.1} sjit={0.55} />
        <circle cx="60" cy="60" r="45" fill="#fff" stroke="#F1E6D0" strokeWidth="1.5" />
      </svg>
      <div className="absolute inset-[13.3%] overflow-hidden rounded-full bg-white">{children}</div>
      <svg aria-hidden="true" focusable="false" viewBox="0 0 120 120" className="pointer-events-none absolute inset-0 size-full">
        <Bindu r={45.5} w={2.2} dot={3.8} />
      </svg>
    </div>
  )
}

/** A small plate for the corner of a card: white disc, a dozen dots, a thick open ring and the kumkum dot. */
export function RimBadge({ category, seed, className = '' }: { category: ThaliCategory; seed: string; className?: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 120 120" className={`rim-badge ${className}`}>
      <circle cx="60" cy="60" r="58" fill={LOOK[category].disc} />
      <Rim n={12} seed={seed} colours={LOOK[category].rim} r={50} base={7.5} jit={2} sjit={1.2} />
      <Bindu r={27} w={7} dot={9} />
    </svg>
  )
}

/** Which plate colours suit a piece of work. */
export const thaliFor = (medium: string): ThaliCategory => (medium === 'portrait' || medium === 'drawing' ? 'portrait' : medium === 'painting' ? 'painting' : 'rangoli')
