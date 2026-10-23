import { useId, type CSSProperties, type ReactNode } from 'react'
import { cubic, kolam, r1, styleFor, taperedPath, type Pt, type RangoliStyle } from '@/lib/art'
import { seededRandom } from '@/lib/seed'

// Bright powder colours (rangoli colours are louder than the site's ink colours).
const PALETTES = [
  ['#e8890c', '#f2b705', '#d0473b'],
  ['#1a8aa3', '#f2b705', '#d6457a'],
  ['#5aa16a', '#e8890c', '#d6457a'],
  ['#d0473b', '#1a8aa3', '#f2b705'],
  ['#d6457a', '#f2b705', '#1a8aa3'],
]
/** Lighter partner of each colour, for the inner petal (marigold → turmeric and so on). */
const LIGHT: Record<string, string> = { '#e8890c': '#f2b705', '#f2b705': '#f7dc6f', '#d0473b': '#e8890c', '#1a8aa3': '#7fc3d3', '#d6457a': '#f39ab8', '#5aa16a': '#b5d86b' }
const LEAF = ['#4f8f45', '#2e6b3c']

type Kind = 'fill' | 'line' | 'dots' | 'trace' | 'spill'
/** One layer of powder. `wedge` layers are drawn once and repeated round the centre with <use>. */
type Layer = { d: string; kind: Kind; ring: number; color?: string; wedge?: boolean; n?: number; w?: number; outline?: boolean; pour?: string }
type Rand = () => number

const P = (r: number, deg: number): Pt => {
  const a = ((deg - 90) * Math.PI) / 180
  return [r * Math.cos(a), r * Math.sin(a)]
}
const xy = ([x, y]: Pt) => `${r1(x)},${r1(y)}`
const dots = (pts: Pt[]) => pts.map((p) => `M${xy(p)}h0`).join('')
/** A ring of colour between two radii (inner circle drawn the other way round, so it stays a hole). */
const annulus = (R: number, r: number) => {
  const [a, b] = [r1(R), r1(r)]
  return `M0,${-a}A${a} ${a} 0 1 1 0,${a}A${a} ${a} 0 1 1 0,${-a}ZM0,${-b}A${b} ${b} 0 1 0 0,${b}A${b} ${b} 0 1 0 0,${-b}Z`
}
const pickOf = (rand: Rand) => <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)]

/** A ring of dots between rings, each nudged a little off true like a fingertip. */
function dotRing(rand: Rand, r: number, n: number, ring: number, w = 1.5, offset = 0): Layer {
  const pts = Array.from({ length: n }, (_, j): Pt => {
    const [x, y] = P(r, offset + (j * 360) / n)
    return [x + (rand() - 0.5) * 0.8, y + (rand() - 0.5) * 0.8]
  })
  return { d: dots(pts), kind: 'dots', ring, n, w }
}

/** 30–42 stray grains near the lines, as powder always spills. */
function spill(rand: Rand, color: string, accent: string): Layer[] {
  const count = 30 + Math.floor(rand() * 12)
  const pts = Array.from({ length: count }, () => P(5 + rand() * 42, rand() * 360))
  const half = Math.floor(count * 0.6)
  return [
    { d: dots(pts.slice(0, half)), kind: 'spill', ring: 99, color, w: 0.55 },
    { d: dots(pts.slice(half)), kind: 'spill', ring: 99, color: accent, w: 0.7 },
  ]
}

// ─── Sanskar Bharti: free-hand tapered strokes (drop, petal, kairi, shankh, wave, fan) folded 8–16 times. ───

type Motif = (r0: number, r1: number, c: number, a: number, rand: Rand, ring: number, color: string | null) => Layer[]
const line = (d: string, ring: number): Layer => ({ d, kind: 'line', ring, wedge: true })
const fill = (d: string, ring: number, color: string): Layer => ({ d, kind: 'fill', ring, color, wedge: true })
const cap = (L: number, r: number, a: number, k: number) => Math.min(k * L, ((r * a * Math.PI) / 180) * 0.7)

const MOTIFS: Record<string, Motif> = {
  drop: (r0, r1_, c, a, rand, ring, color) => {
    const L = r1_ - r0
    const d = taperedPath(cubic(P(r0 + 0.1 * L, c), P(r0 + 0.4 * L, c - a * 0.2), P(r0 + 0.75 * L, c + a * 0.15), P(r1_ - 0.08 * L, c), 7), Math.min(3, cap(L, r0 + L / 2, a, 0.42)), 0.45)
    const side = a > 8 ? [-1, 1].map((s) => taperedPath(cubic(P(r0 + 0.25 * L, c + s * a * 0.3), P(r0 + 0.5 * L, c + s * a * 0.55), P(r0 + 0.7 * L, c + s * a * 0.7), P(r1_ - 0.25 * L, c + s * a * 0.75), 7), Math.min(1.3, 0.16 * L), 0.5)) : []
    return [color ? fill(d, ring, color) : line(d, ring), ...side.map((s) => line(s, ring))]
  },
  petal: (r0, r1_, c, a, rand, ring, color) => {
    const L = r1_ - r0
    const [b, t] = [P(r0 + 0.05 * L, c), P(r1_ - 0.05 * L, c)]
    const side = (s: number) => [b, P(r0 + 0.3 * L, c + s * a * 0.85), P(r0 + 0.8 * L, c + s * a * 0.6), t] as const
    const w = Math.min(1.7, 0.24 * L)
    const out = [-1, 1].map((s) => line(taperedPath(cubic(...side(s), 8), w, 0.7), ring))
    const [, l1, l2] = side(-1)
    const [, q1, q2] = side(1)
    if (color) out.unshift(fill(`M${xy(b)}C${xy(l1)} ${xy(l2)} ${xy(t)}C${xy(q2)} ${xy(q1)} ${xy(b)}Z`, ring, color))
    return out
  },
  kairi: (r0, r1_, c, a, rand, ring) => {
    const L = r1_ - r0
    const s = rand() < 0.5 ? 1 : -1
    return [line(taperedPath(cubic(P(r0 + 0.15 * L, c - s * a * 0.55), P(r1_, c - s * a * 0.95), P(r1_, c + s * a * 0.85), P(r0 + 0.45 * L, c + s * a * 0.15), 10), Math.min(2.6, cap(L, r0 + L / 2, a, 0.35)), 0.5), ring)]
  },
  shankh: (r0, r1_, c, a, rand, ring) => {
    const L = r1_ - r0
    const [cx, cy] = P(r0 + 0.5 * L, c)
    const R = Math.min(0.45 * L, cap(L, r0 + L / 2, a, 0.6))
    const start = rand() * Math.PI * 2
    const pts = Array.from({ length: 14 }, (_, i): Pt => {
      const t = i / 13
      const ang = start + t * Math.PI * 3.4
      return [cx + R * (1 - 0.85 * t) * Math.cos(ang), cy + R * (1 - 0.85 * t) * Math.sin(ang)]
    })
    return [line(taperedPath(pts, Math.min(2.2, 0.32 * L), 0.4), ring)]
  },
  wave: (r0, r1_, c, a, rand, ring) => {
    const L = r1_ - r0
    const pts = Array.from({ length: 9 }, (_, i) => P(r0 + L / 2 + 0.28 * L * Math.sin((i / 8) * Math.PI * 2), c - a + (i / 8) * 2 * a))
    return [line(taperedPath(pts, Math.min(2.1, 0.3 * L)), ring)]
  },
  fan: (r0, r1_, c, a, rand, ring) => {
    const L = r1_ - r0
    return [-0.6, 0, 0.6].map((s) => line(taperedPath(cubic(P(r0 + 0.1 * L, c), P(r0 + 0.4 * L, c + s * a * 0.3), P(r0 + 0.7 * L, c + s * a * 0.6), P(r1_ - 0.05 * L, c + s * a), 7), Math.min(1.4, 0.2 * L), 0.5), ring))
  },
}

function sanskar(rand: Rand, pal: string[]) {
  const pick = pickOf(rand)
  const k = pick([8, 12, 16])
  const step = 360 / k
  const count = 6 + Math.floor(rand() * 3)
  // Rings get narrower and busier towards the edge, as a hand works outwards.
  const ws = Array.from({ length: count }, (_, i) => 1 - i * 0.07)
  const scale = 38 / ws.reduce((x, y) => x + y)
  const wedge: Layer[] = []
  const beds: Layer[] = []
  const full: Layer[] = [{ d: 'M0,0h0', kind: 'dots', ring: 0, n: 1, w: 4.6, color: pick(pal) }]
  // One or two rings get a bed of poured colour under the white strokes, as sanskar bharti often does.
  const bedRings = new Set([1 + Math.floor(rand() * (count - 2)), rand() < 0.5 ? 1 + Math.floor(rand() * (count - 2)) : -1])
  let r = 5
  let prev = ''
  for (let i = 0; i < count; i++) {
    const r0 = r
    const rEnd = (r += ws[i] * scale)
    const outer = i === count - 1
    const bed = bedRings.has(i) ? pick(pal) : null
    if (bed) beds.push({ d: annulus(rEnd, r0), kind: 'fill', ring: i + 1, color: bed })
    const names = Object.keys(MOTIFS).filter((m) => m !== prev && !(i === 0 && (m === 'shankh' || m === 'wave')))
    const m = outer ? 'wave' : i === 0 ? 'drop' : pick(names)
    prev = m
    const reps = outer || i >= count / 2 ? 2 : 1
    const color = rand() < (m === 'petal' ? 0.7 : 0.4) ? pick(pal.filter((c) => c !== bed)) : null
    for (let j = 0; j < reps; j++) wedge.push(...MOTIFS[m](r0, rEnd, (j - (reps - 1) / 2) * (step / reps), step / reps / 2, rand, i + 1, color))
    if (!outer && rand() < 0.55) full.push(dotRing(rand, rEnd, k * reps * 2, i + 1, 1.3, step / reps / 2))
  }
  full.push(dotRing(rand, r + 1.6, k * 4, count + 1, 1.2))
  return { k, layers: [...beds, ...wedge, ...full, ...spill(rand, 'currentColor', pick(pal))] }
}

// ─── Phool: overlapping petal rings (each petal darker at the tip, lighter at the base) and a ring of leaves. ───

function phool(rand: Rand, pal: string[]) {
  const pick = pickOf(rand)
  const k = pick([8, 12])
  const step = 360 / k
  const rings = 4 + Math.floor(rand() * 2)
  const layers: Layer[] = []
  // Leaves sit underneath, between the outer petals.
  const leafAt = (r0: number, L: number, c: number, a: number) => {
    const [b, t] = [P(r0, c), P(r0 + L, c)]
    const half = (s: number) => `M${xy(b)}C${xy(P(r0 + 0.3 * L, c + s * a))} ${xy(P(r0 + 0.75 * L, c + s * a * 0.7))} ${xy(t)}Z`
    layers.push(fill(half(-1), 0, LEAF[0]), fill(half(1), 0, LEAF[1]), line(taperedPath(cubic(b, P(r0 + 0.3 * L, c), P(r0 + 0.6 * L, c), t, 6), 0.45), 0))
  }
  leafAt(28, 18, step / 2, step * 0.42)
  for (let i = rings - 1; i >= 0; i--) {
    const r0 = 2.5 + i * 6.6
    const L = 11 + i * 0.7
    const reps = i >= 2 ? 2 : 1
    const a = step / reps / 2
    const off = i % 2 ? a : 0
    const outer = pal[i % pal.length]
    const inner = LIGHT[outer] ?? '#f2b705'
    for (let j = 0; j < reps; j++) {
      const c = off + (j - (reps - 1) / 2) * 2 * a
      const petal = (len: number, wide: number) => {
        const [b, t] = [P(r0, c), P(r0 + len, c)]
        return `M${xy(b)}C${xy(P(r0 + 0.35 * len, c - wide))} ${xy(P(r0 + 0.9 * len, c - wide * 0.7))} ${xy(t)}C${xy(P(r0 + 0.9 * len, c + wide * 0.7))} ${xy(P(r0 + 0.35 * len, c + wide))} ${xy(b)}Z`
      }
      layers.push({ ...fill(petal(L, a * 1.1), i + 1, outer), pour: `p${i}` }, { ...fill(petal(L * 0.6, a * 0.6), i + 1, inner), pour: `p${i}` })
      if (i % 2 === 0) layers.push(line(taperedPath(cubic(P(r0 + 0.15 * L, c), P(r0 + 0.4 * L, c), P(r0 + 0.7 * L, c), P(r0 + 0.95 * L, c), 6), 0.5, 0.6), i + 1))
    }
  }
  layers.push({ d: 'M0,0h0', kind: 'dots', ring: 0, n: 1, w: 5, color: '#f2b705' }, { d: 'M0,0h0', kind: 'dots', ring: 0, n: 1, w: 1.8, color: '#a6261d' })
  layers.push(dotRing(rand, 47.5, k * 3, rings + 1, 1.2))
  return { k, layers: [...layers, ...spill(rand, pick(pal), LEAF[0])] }
}

// ─── Poster: solid bands of colour, each edged with a thin white line. ───

function poster(rand: Rand, pal: string[]) {
  const pick = pickOf(rand)
  const k = pick([8, 12, 16])
  const step = 360 / k
  const n = 5 + Math.floor(rand() * 3)
  const colours = [...pal, LIGHT[pal[0]]]
  const layers: Layer[] = []
  let prevShape = ''
  for (let i = 0; i < n; i++) {
    const R = 46 - (i * 37) / (n - 1)
    const shape = pick(['scallop', 'star', 'circle'].filter((s) => s !== prevShape))
    prevShape = shape
    const lobes = i < 2 ? k * 2 : k
    let d: string
    if (shape === 'circle') d = `M0,${-r1(R)}A${r1(R)} ${r1(R)} 0 1 1 0,${r1(R)}A${r1(R)} ${r1(R)} 0 1 1 0,${-r1(R)}Z`
    else {
      d = `M${xy(P(R * 0.9, 0))}`
      for (let j = 0; j < lobes; j++) {
        const t = (j * 360) / lobes
        d += shape === 'scallop' ? `Q${xy(P(R * 1.08, t + 180 / lobes))} ${xy(P(R * 0.9, t + 360 / lobes))}` : `L${xy(P(R, t + 180 / lobes))} ${xy(P(R * 0.86, t + 360 / lobes))}`
      }
      d += 'Z'
    }
    layers.push({ d, kind: 'fill', ring: n - i, color: colours[i % colours.length], outline: true })
    if (i === 1) for (const c of [0, step / 2]) layers.push(...MOTIFS.drop(R - 9, R - 2, c, step / 4, rand, n - i, null))
  }
  // Dots are pressed in last, on top of the dry colour.
  for (let i = 1; i < n; i += 2) layers.push(dotRing(rand, 46 - ((i - 0.5) * 37) / (n - 1), k * 2, n - i, 1.2))
  layers.push({ d: 'M0,0h0', kind: 'dots', ring: 0, n: 1, w: 3, color: 'currentColor' })
  return { k, layers: [...layers, ...spill(rand, 'currentColor', pick(pal))] }
}

// ─── Kolam: one unbroken line looping round a grid of dots. ───

function kolamStyle(rand: Rand, pal: string[]) {
  const m = 3 + Math.floor(rand() * 3)
  const [a, b] = rand() < 0.5 ? [m, m + 1] : [m + 1, m]
  const s = 84 / (2 * Math.max(a, b) + 1.8)
  const { d, dots: pts } = kolam(a, b, s)
  // Coloured diamonds under every other dot, poured after the line.
  const cells = pts
    .map((p, i) => ({ p, i, c: pal[i % pal.length] }))
    .filter(({ i }) => (Math.floor(i / b) + (i % b)) % 2 === 0)
  const byColour = pal.map((c) => ({
    d: cells
      .filter((x) => x.c === c)
      .map(({ p: [x, y] }) => `M${xy([x, y - s * 0.72])}L${xy([x + s * 0.72, y])} ${xy([x, y + s * 0.72])} ${xy([x - s * 0.72, y])}Z`)
      .join(''),
    c,
  }))
  const layers: Layer[] = [
    ...byColour.filter((x) => x.d).map((x): Layer => ({ d: x.d, kind: 'fill', ring: 0, color: x.c })),
    { d, kind: 'trace', ring: 1, w: Math.max(0.9, s * 0.2) },
    { d: dots(pts), kind: 'dots', ring: 0, n: pts.length, w: s * 0.32 },
  ]
  return { k: 8, layers: [...layers, ...spill(rand, 'currentColor', pal[0])] }
}

const DRAW: Record<RangoliStyle, (rand: Rand, pal: string[]) => { k: number; layers: Layer[] }> = { sanskar, phool, poster, kolam: kolamStyle }

function Shape({ l }: { l: Layer }) {
  if (l.kind === 'fill') return <path d={l.d} fill={l.color} stroke={l.outline ? 'currentColor' : undefined} strokeWidth={l.outline ? 0.6 : undefined} />
  if (l.kind === 'line') return <path d={l.d} fill="currentColor" />
  if (l.kind === 'trace')
    return (
      <>
        <path d={l.d} fill="none" stroke="currentColor" strokeWidth={l.w! * 2} opacity={0.3} pathLength={1} />
        <path d={l.d} fill="none" stroke="currentColor" strokeWidth={l.w} pathLength={1} />
      </>
    )
  return <path d={l.d} fill="none" stroke={l.color ?? 'currentColor'} strokeWidth={l.w} strokeLinecap="round" opacity={l.kind === 'spill' ? 0.5 : undefined} />
}

const r3 = (n: number) => +n.toFixed(3)

type Props = {
  /** Same seed, same rangoli (use a product/course slug). */
  seed?: string
  /** sanskar (white free-hand strokes), kolam (one line round a dot grid), phool (petal rings) or poster (solid bands). Default: from the seed. */
  style?: RangoliStyle
  /** "dark" = white powder lines on a charcoal floor. */
  tone?: 'light' | 'dark'
  /** Draw itself in: dots → lines → colour. Only for the hero and a few big places. */
  animate?: boolean
  className?: string
}

/** Code-drawn powder rangoli used until real photos exist. Decorative: hidden from screen readers. */
export function GenerativeRangoli({ seed = 'siddesh', style, tone = 'light', animate = false, className = '' }: Props) {
  const uid = `r${useId().replace(/[^\w-]/g, '')}`
  const rand = seededRandom(seed)
  const pal = PALETTES[Math.floor(rand() * PALETTES.length)]
  const { k, layers } = DRAW[style ?? styleFor(seed)](rand, pal)
  const step = 360 / k
  // Each wedge sits a degree or so off true: one hand, not a stamp.
  const rots = Array.from({ length: k }, (_, i) => r1(i * step + (i ? (rand() - 0.5) * 2.6 : 0)))

  // Group layers: still = consecutive runs (keeps paint order, least HTML); drawing in = one group per ring (lines, dots) or colour (fills).
  const groups: { key: string; ls: Layer[] }[] = []
  for (const l of layers) {
    const key = animate
      ? `${l.wedge ? 'w' : 'x'}${l.kind === 'fill' ? (l.pour ?? l.color) : l.kind === 'spill' ? 's' : `${l.kind}${l.ring}`}`
      : `${l.wedge ? 'w' : 'x'}`
    const last = groups[groups.length - 1]
    const g = animate ? groups.find((x) => x.key === key) : last?.key === key ? last : undefined
    if (g) g.ls.push(l)
    else groups.push({ key, ls: [l] })
  }

  // Timing for the drawing-in: dots ring by ring, then lines one hand going round, then colour poured by colour.
  const timing = (ls: Layer[]): { cls: string; style: CSSProperties } | null => {
    if (!animate) return null
    const kind = ls[0].kind
    const order = (pred: (g: Layer[]) => boolean) => groups.map((g) => g.ls).filter(pred)
    const idx = (list: Layer[][]) => list.indexOf(ls)
    // A lone centre dot has no area to sweep or pour into: it is simply there.
    if (kind === 'dots' && ls[0].n === 1) return null
    if (kind === 'dots') {
      const list = order((g) => g[0].kind === 'dots')
      return { cls: 'g-sweep g-steps', style: { '--t': `${r3(0.05 + idx(list) * 0.12)}s`, '--d': '.45s', '--n': ls[0].n ?? 1 } as CSSProperties }
    }
    if (kind === 'line' || kind === 'trace') {
      const list = order((g) => g[0].kind === 'line' || g[0].kind === 'trace')
      const d = 2 / list.length
      return { cls: kind === 'trace' ? 'g-trace' : 'g-sweep', style: { '--t': `${r3(0.45 + idx(list) * d)}s`, '--d': `${r3(d)}s` } as CSSProperties }
    }
    const fills = order((g) => g[0].kind === 'fill')
    const i = kind === 'spill' ? fills.length : idx(fills)
    return { cls: 'g-pour', style: { '--t': `${r3(2.3 + i * 0.26)}s`, '--d': '.55s' } as CSSProperties }
  }

  // Easing for one hand going round: steady, easing off at the end of each wedge.
  const hand = `linear(${Array.from({ length: k }, (_, j) => `${r3(j / k)} ${r1((100 * j) / k)}%, ${r3((j + 0.78) / k)} ${r1((100 * (j + 0.6)) / k)}%`).join(', ')}, 1)`

  const out: ReactNode[] = []
  const defs: ReactNode[] = []
  groups.forEach((g, gi) => {
    const tm = timing(g.ls)
    const body = g.ls.map((l, i) => <Shape key={i} l={l} />)
    if (g.ls[0].wedge) {
      const id = `${uid}-${gi}`
      defs.push(
        <g key={gi} id={id}>
          {body}
        </g>,
      )
      out.push(
        <g key={gi} className={tm?.cls} style={tm?.style}>
          {rots.map((r, i) => (
            <use key={i} href={`#${id}`} transform={r ? `rotate(${r})` : undefined} />
          ))}
        </g>,
      )
    } else
      out.push(
        <g key={gi} className={tm?.cls} style={tm?.style}>
          {body}
        </g>,
      )
  })

  return (
    <svg
      viewBox="-50 -50 100 100"
      aria-hidden="true"
      focusable="false"
      className={`grangoli grangoli--${tone} ${animate ? 'grangoli--draw' : ''} ${className}`}
      style={animate ? ({ '--ease-hand': hand } as CSSProperties) : undefined}
    >
      <defs>{defs}</defs>
      {/* One powder filter for the whole rangoli (grainy edges + speckle), never per path. Off on slow phones. */}
      <g className="fx" filter="url(#powder)">
        {out}
      </g>
    </svg>
  )
}
