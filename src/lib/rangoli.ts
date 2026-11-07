// Today's rangoli: one design per calendar day, drawn from the date alone (same date, same design, on every device). No DOM, no Date.now().
import { daysBetween } from './dates.ts'
import { festiveKindOf } from './festive.ts'

export type RangoliKind = 'diwali' | 'ganesh' | 'gudi'
export type Festival = { slug: string; name: string; nextDate?: string | null }
/** A festival week: 4 days before the festival through 2 days after. */
export const WEEK_BEFORE = 4
export const WEEK_AFTER = 2

const PALETTES = [
  ['#C8281E', '#F2A20C', '#0B5E73', '#B5367A'],
  ['#0B5E73', '#F2A20C', '#C8281E', '#3F7A3A'],
  ['#B5367A', '#F2A20C', '#0B5E73', '#3F7A3A'],
  ['#3F7A3A', '#C8281E', '#F2A20C', '#0B5E73'],
  ['#E4572E', '#0B5E73', '#F2A20C', '#B5367A'],
]
const FESTIVAL_PALETTES: Record<RangoliKind, string[]> = {
  diwali: ['#F2A20C', '#C8281E', '#E4572E', '#0B5E73'],
  ganesh: ['#B5367A', '#F2A20C', '#3F7A3A', '#0B5E73'],
  gudi: ['#F2A20C', '#3F7A3A', '#C8281E', '#B5367A'],
}

/** mulberry32 on an integer seed. */
function rng(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** The festival whose week `today` (YYYY-MM-DD) falls in, from the real festival dates; Diwali, Ganesh Chaturthi and Gudi Padwa only. */
export function festivalWeek(festivals: Festival[], today: string): { kind: RangoliKind; name: string } | null {
  for (const f of festivals) {
    const kind = festiveKindOf(f.slug)
    const day = f.nextDate?.slice(0, 10)
    if (!day || (kind !== 'diwali' && kind !== 'ganesh' && kind !== 'gudi')) continue
    const diff = daysBetween(day, today)
    if (diff >= -WEEK_BEFORE && diff <= WEEK_AFTER) return { kind, name: f.name }
  }
  return null
}

export type Shape =
  | { kind: 'dot'; r: number; fill: string }
  | { kind: 'petal'; angle: number; at: number; rx: number; ry: number; fill: string }
  | { kind: 'diya'; angle: number; fill: string }

export type Rangoli = {
  seed: number
  kind: RangoliKind | null
  /** Petals per ring: 6, 8, 10 or 12. */
  petals: number
  palette: string[]
  /** Pulli dots (three rings and the centre), in drawing order. Coordinates in a -100..100 box. */
  dots: { x: number; y: number; r: number }[]
  /** Three closed kolam curves as SVG path data. */
  lines: string[]
  /** Colour shapes in drawing order: the centre, petal rings, and the festival's edge motif. */
  shapes: Shape[]
}

/** The day's number, YYYYMMDD. */
export const seedOf = (today: string) => Number(today.slice(0, 10).replaceAll('-', ''))

const f1 = (n: number) => n.toFixed(1)
const at = (r: number, a: number) => [r * Math.sin(a), -r * Math.cos(a)] as const

/** The design for one day. `kind` (a festival week) swaps the palette and adds the festival's edge motif; `colours` (up to 4) is a palette of the visitor's choosing. */
export function rangoliFor(seed: number, kind: RangoliKind | null, colours?: string[]): Rangoli {
  const palette = colours?.length ? Array.from({ length: 4 }, (_, i) => colours[i % colours.length]) : kind ? FESTIVAL_PALETTES[kind] : PALETTES[(rng(seed)() * 5) | 0]
  const R = rng(seed)
  const n = [6, 8, 8, 10, 12][(R() * 5) | 0]
  const TAU = Math.PI * 2
  const dots: Rangoli['dots'] = []
  const ring = (r: number, count: number, shift: number, size: number) => {
    for (let k = 0; k < count; k++) {
      const [x, y] = at(r, ((k + shift) / count) * TAU)
      dots.push({ x: +f1(x), y: +f1(y), r: size })
    }
  }
  ring(90, n * 3, 0, 1.5)
  ring(66, n * 2, 0.5, 1.6)
  ring(42, n, 0, 1.8)
  dots.push({ x: 0, y: 0, r: 2.4 })
  const curve = (r0: number, amp: number, phase: number) => {
    let d = ''
    for (let i = 0; i <= 240; i++) {
      const a = (i / 240) * TAU
      const [x, y] = at(r0 + amp * Math.cos(n * a + phase), a)
      d += `${i ? 'L' : 'M'}${f1(x)} ${f1(y)}`
    }
    return `${d}Z`
  }
  // The order of the R() calls fixes the design: keep it.
  const lines = [curve(76, 7 + R() * 3, 0), curve(52, 8 + R() * 3, Math.PI), curve(28, 5, 0)]
  const ry1 = 14 + R() * 5
  const ry2 = 17 + R() * 5
  const ry3 = 11 + R() * 4
  const shapes: Shape[] = [
    { kind: 'dot', r: 12, fill: palette[1] },
    { kind: 'dot', r: 6, fill: palette[0] },
    { kind: 'dot', r: 2.6, fill: '#fff' },
  ]
  const petals = (count: number, shift: number, radius: number, rx: number, ry: number, fill: string) => {
    for (let k = 0; k < count; k++) shapes.push({ kind: 'petal', angle: ((k + shift) / count) * 360, at: radius, rx, ry, fill })
  }
  petals(n, 0, 27, 6.5, ry1, palette[2])
  petals(n, 0.5, 52, 8, ry2, palette[0])
  petals(n, 0, 72, 7.5, ry3, palette[1])
  petals(n * 2, 0.5, 84, 3.4, 7, palette[3])
  if (kind === 'diwali') for (let k = 0; k < 8; k++) shapes.push({ kind: 'diya', angle: (k / 8) * 360, fill: palette[2] })
  if (kind === 'ganesh') petals(8, 0.5, 91, 3.2, 8, '#FFB3D1')
  if (kind === 'gudi') petals(12, 0.5, 92, 2.6, 7, '#3F7A3A')
  return { seed, kind, petals: n, palette, dots, lines, shapes }
}

/** The seed for a chosen set of colours (their indexes in the picker): the same colours always draw the same rangoli. */
export const seedOfColours = (picked: number[]) => picked.reduce((s, i) => s * 7 + i + 3, 11)

/** Today's design from the visitor's date (YYYY-MM-DD) and the real festival dates. */
export function rangoliToday(today: string, festivals: Festival[]) {
  const week = festivalWeek(festivals, today)
  return { rangoli: rangoliFor(seedOf(today), week?.kind ?? null), festival: week?.name ?? null }
}
