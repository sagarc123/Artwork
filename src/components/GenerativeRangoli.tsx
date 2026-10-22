import type { CSSProperties } from 'react'
import { seededRandom } from '@/lib/seed'

const FILLS = ['var(--color-kumkum)', 'var(--color-marigold)', 'var(--color-peacock)', 'var(--color-turmeric)', 'var(--color-leaf)']
const RINGS = [10, 20, 30, 41]

const pt = (r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180
  // One decimal is plenty at this size and keeps page HTML small (dozens of these on a listing page).
  return `${+(r * Math.cos(a)).toFixed(1)},${+(r * Math.sin(a)).toFixed(1)}`
}

type Props = {
  /** Same seed, same rangoli (use a product/course slug). */
  seed?: string
  /** "dark" = white powder lines on a charcoal floor. */
  tone?: 'light' | 'dark'
  /** Draw itself in: dots → lines → colour. Off for small/repeated uses. */
  animate?: boolean
  className?: string
}

/** Code-drawn rangoli used until real photos exist. Decorative: hidden from screen readers. */
export function GenerativeRangoli({ seed = 'siddesh', tone = 'light', animate = false, className = '' }: Props) {
  const rand = seededRandom(seed)
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)]
  const k = pick([6, 8, 8, 12]) // ponytail: ≤12-fold keeps node count low for budget phones
  const step = 360 / k

  // Each ring of dots is one path of zero-length round-capped strokes: one element instead of up to 24 circles.
  const dotRings = RINGS.map((r, i) => {
    const n = i === 0 ? k : k * 2
    return Array.from({ length: n }, (_, j) => `M${pt(r, (j * 360) / n)}h0`).join('')
  })

  // One wedge of petals between rings, repeated k times around the centre. `at(rot)` draws a petal turned by rot degrees.
  const motif: { at: (rot: number) => string; fill?: string }[] = []
  for (let i = 0; i < RINGS.length - 1; i++) {
    if (i > 0 && rand() < 0.2) continue
    const [r1, r2] = [RINGS[i], RINGS[i + 1]]
    const off = pick([0, step / 2])
    const w = 3 + rand() * 7
    const mid = (r1 + r2) / 2
    motif.push({ at: (o) => `M${pt(r1, off + o)}Q${pt(mid, off - w + o)} ${pt(r2, off + o)}Q${pt(mid, off + w + o)} ${pt(r1, off + o)}Z`, fill: pick(FILLS) })
  }
  motif.push({ at: (o) => `M${pt(41, o)}Q${pt(49, step / 2 + o)} ${pt(41, step + o)}` }) // loop on the rim, like a fingertip stroke
  const centre = pick(FILLS)
  const wedges = Array.from({ length: k }, (_, w) => w * step)

  return (
    <svg
      viewBox="-50 -50 100 100"
      aria-hidden="true"
      focusable="false"
      className={`grangoli grangoli--${tone} ${animate ? 'grangoli--draw' : ''} ${className}`}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {dotRings.map((d, i) => (
        <path key={i} className="g-dot" d={d} style={{ '--i': i } as CSSProperties} />
      ))}
      {animate
        ? // Drawing in: a group per wedge, so the wedges ink in one after another.
          wedges.map((rot, w) => (
            <g key={w} transform={`rotate(${rot})`} style={{ '--w': w } as CSSProperties}>
              {motif.map((m, j) => (
                <g key={j} style={{ '--j': j, '--fill': m.fill } as CSSProperties}>
                  {m.fill && <path className="g-fill" d={m.at(0)} />}
                  <path className="g-line" d={m.at(0)} pathLength={1} />
                </g>
              ))}
            </g>
          ))
        : // Still: one path per petal shape for all wedges, colour and outline together (far less HTML on listing pages).
          motif.map((m, j) => <path key={j} className={m.fill ? 'g-fill g-line' : 'g-line'} d={wedges.map(m.at).join('')} style={{ '--fill': m.fill } as CSSProperties} />)}
      <circle className="g-fill" r="5.5" style={{ '--j': 0, '--w': 0, '--fill': centre } as CSSProperties} />
      <circle className="g-line" r="5.5" pathLength={1} style={{ '--j': 0, '--w': 0 } as CSSProperties} />
    </svg>
  )
}
