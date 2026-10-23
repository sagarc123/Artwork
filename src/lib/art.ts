// Pure helpers for the code-drawn stand-ins (rangoli, sketches, washes). No React, so node:test can run them.
import { hashString } from './seed.ts'

export type Pt = [number, number]
export type RangoliStyle = 'sanskar' | 'kolam' | 'phool' | 'poster'
export type Medium = 'rangoli' | 'drawing' | 'portrait' | 'painting' | 'artist'

export const STYLES: RangoliStyle[] = ['sanskar', 'phool', 'kolam', 'poster']

/** One decimal is plenty at these sizes and keeps page HTML small. */
export const r1 = (n: number) => +n.toFixed(1)
const xy = ([x, y]: Pt) => `${r1(x)},${r1(y)}`

/** Points along a cubic Bézier (n ≥ 2). */
export function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, n = 9): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1)
    const u = 1 - t
    const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]
  })
}

/**
 * A powder stroke as a filled shape: the outline of a centre line whose width is w(t) = sin(π·t^bias)·max.
 * bias < 1 puts the fat end near the start (a fingertip pressed, then pulled), like a hand-poured line.
 */
export function taperedPath(line: Pt[], max: number, bias = 1, min = 0.1): string {
  const n = line.length
  if (n < 2) return ''
  const left: Pt[] = []
  const right: Pt[] = []
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const w = (min + (max - min) * Math.sin(Math.PI * t ** bias)) / 2
    const [ax, ay] = line[Math.max(0, i - 1)]
    const [bx, by] = line[Math.min(n - 1, i + 1)]
    const len = Math.hypot(bx - ax, by - ay) || 1
    const nx = -(by - ay) / len, ny = (bx - ax) / len
    left.push([line[i][0] + nx * w, line[i][1] + ny * w])
    right.push([line[i][0] - nx * w, line[i][1] - ny * w])
  }
  const pts = [...left, ...right.reverse()].map(xy)
  return `M${pts[0]}L${pts.slice(1).join(' ')}Z`
}

/**
 * One continuous kolam line around an m×n dot grid (m, n coprime → a single loop).
 * The line runs diagonally between the dots and loops round the dots on the edge, like a billiard ball.
 * Returns the line and the dot centres, scaled by `s` and centred on 0,0.
 */
export function kolam(m: number, n: number, s = 1): { d: string; dots: Pt[] } {
  // Doubled grid: dots at even (x, y); the line only ever visits points where x + y is odd.
  const W = 2 * m - 1, H = 2 * n - 1
  const at = (x: number, y: number): Pt => [(x - (W - 1) / 2) * s, (y - (H - 1) / 2) * s]
  const pts: { p: Pt; edge: boolean }[] = []
  let [x, y, dx, dy] = [-1, 0, 1, 1]
  do {
    const edgeX = x === -1 || x === W
    const edgeY = y === -1 || y === H
    // Push turning points outwards so the line rounds the edge dot instead of touching it.
    const push = 0.9
    pts.push({ p: at(x + (x === -1 ? -push : x === W ? push : 0), y + (y === -1 ? -push : y === H ? push : 0)), edge: edgeX || edgeY })
    if (x + dx < -1 || x + dx > W) dx = -dx
    if (y + dy < -1 || y + dy > H) dy = -dy
    x += dx
    y += dy
  } while (!(x === -1 && y === 0 && dx === 1 && dy === 1) && pts.length < 4 * m * n + 8)

  // Smooth curve through the midpoints (quadratic B-spline); straight runs collapse to one L.
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const N = pts.length
  const near = (i: number) => pts[(i + N - 1) % N].edge || pts[i].edge || pts[(i + 1) % N].edge
  let d = `M${xy(mid(pts[N - 1].p, pts[0].p))}`
  let skipped = false
  for (let i = 0; i < N; i++) {
    const next = pts[(i + 1) % N].p
    if (!near(i)) {
      skipped = true
      continue
    }
    if (skipped) d += `L${xy(mid(pts[(i + N - 1) % N].p, pts[i].p))}`
    skipped = false
    d += `Q${xy(pts[i].p)} ${xy(mid(pts[i].p, next))}`
  }
  const dots: Pt[] = []
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) dots.push(at(2 * i, 2 * j))
  return { d: `${d}Z`, dots }
}

/** Default rangoli style for a seed. */
export const styleFor = (seed: string) => STYLES[hashString(seed) % STYLES.length]

/** Styles for a row of stand-ins: each keeps its own unless the previous one already uses it. */
export function noRepeat(styles: RangoliStyle[]): RangoliStyle[] {
  const out: RangoliStyle[] = []
  for (const s of styles) {
    const prev = out[out.length - 1]
    out.push(s === prev ? STYLES[(STYLES.indexOf(s) + 1) % STYLES.length] : s)
  }
  return out
}

const PORTRAIT = /portrait|\baaji\b|grand(mother|father)|\bfaces?\b|पोर्ट्रेट|व्यक्तिचित्र|आजी|दादी/i
const DRAWING = /draw|sketch|charcoal|pencil|graphite|रेखा|स्केच|चारकोल|पेन्सिल|पेंसिल/i
const PAINTING = /paint|acrylic|water ?colou?r|\boil\b|canvas|gouache|रंगचित्र|पेंटिंग|ॲक्रिलिक|एक्रिलिक|जलरंग/i
const RANGOLI = /rangoli|kolam|festival|diwali|ganesh|gudi|wedding|mandap|रांगोळी|रंगोली/i

/** Which stand-in fits a piece, from its category, medium and title (any language). Unknown → picked by seed. */
export function pickMedium(texts: (string | null | undefined)[], seed: string): Exclude<Medium, 'artist'> {
  const text = texts.filter(Boolean).join(' ')
  if (PORTRAIT.test(text)) return 'portrait'
  if (DRAWING.test(text)) return 'drawing'
  if (PAINTING.test(text)) return 'painting'
  if (RANGOLI.test(text)) return 'rangoli'
  // ponytail: mostly rangoli for unknowns, the artist's main work; add a 'medium' field to Media if this guesses wrong.
  return (['rangoli', 'rangoli', 'drawing', 'painting'] as const)[hashString(seed) % 4]
}
