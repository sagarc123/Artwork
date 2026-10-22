import type { CSSProperties } from 'react'
import { seededRandom } from '@/lib/seed'

const FILLS = ['var(--color-kumkum)', 'var(--color-marigold)', 'var(--color-peacock)', 'var(--color-turmeric)', 'var(--color-leaf)']
const RINGS = [10, 20, 30, 41]

const pt = (r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180
  return `${+(r * Math.cos(a)).toFixed(2)},${+(r * Math.sin(a)).toFixed(2)}`
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

  const dots = RINGS.flatMap((r, i) => {
    const n = i === 0 ? k : k * 2
    return Array.from({ length: n }, (_, j) => ({ p: pt(r, (j * 360) / n), i }))
  })

  // One wedge of petals between rings, repeated k times around the centre.
  const motif: { d: string; fill?: string }[] = []
  for (let i = 0; i < RINGS.length - 1; i++) {
    if (i > 0 && rand() < 0.2) continue
    const [r1, r2] = [RINGS[i], RINGS[i + 1]]
    const off = pick([0, step / 2])
    const w = 3 + rand() * 7
    const mid = (r1 + r2) / 2
    motif.push({ d: `M${pt(r1, off)}Q${pt(mid, off - w)} ${pt(r2, off)}Q${pt(mid, off + w)} ${pt(r1, off)}Z`, fill: pick(FILLS) })
  }
  motif.push({ d: `M${pt(41, 0)}Q${pt(49, step / 2)} ${pt(41, step)}` }) // loop on the rim, like a fingertip stroke
  const centre = pick(FILLS)

  return (
    <svg
      viewBox="-50 -50 100 100"
      aria-hidden="true"
      focusable="false"
      className={`grangoli grangoli--${tone} ${animate ? 'grangoli--draw' : ''} ${className}`}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {dots.map(({ p, i }, n) => {
        const [cx, cy] = p.split(',')
        return <circle key={n} className="g-dot" cx={cx} cy={cy} r="1.1" style={{ '--i': i } as CSSProperties} />
      })}
      {Array.from({ length: k }, (_, w) => (
        <g key={w} transform={`rotate(${w * step})`} style={{ '--w': w } as CSSProperties}>
          {motif.map((m, j) => (
            <g key={j} style={{ '--j': j, '--fill': m.fill } as CSSProperties}>
              {m.fill && <path className="g-fill" d={m.d} />}
              <path className="g-line" d={m.d} pathLength={1} />
            </g>
          ))}
        </g>
      ))}
      <circle className="g-fill" r="5.5" style={{ '--j': 0, '--w': 0, '--fill': centre } as CSSProperties} />
      <circle className="g-line" r="5.5" pathLength={1} style={{ '--j': 0, '--w': 0 } as CSSProperties} />
    </svg>
  )
}
