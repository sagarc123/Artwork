// The kolam thread: one line down the right-hand gutter of the home page, with a small loop beside each section heading and a ring around the
// footer's WhatsApp button. Pure geometry (no DOM), so it can be tested: it is given the boxes of everything on the page and keeps clear of them.

export type Box = { l: number; t: number; r: number; b: number }
export type KolamInput = {
  /** Page width (without the scrollbar) and the y range the thread covers. */
  width: number
  y0: number
  y1: number
  /** Everything with content (text lines, controls, pictures), in page coordinates. */
  boxes: Box[]
  /** y of each section heading: a loop goes beside it. */
  marks: number[]
  /** The footer button the thread ends around, if the thread can reach it. */
  ring?: Box | null
  /** Phones: a slim line along the edge, no loops or ring. */
  slim?: boolean
  /** Right edge of the page's content column: the thread never comes inside it, even where nothing is in the way. */
  floor?: number
}

const STEP = 8
const MIN_FREE = 10
const f = (n: number) => +n.toFixed(1)

/** The gutter at height y: from the right-most edge of any content nearby to the page edge. */
function gutter(boxes: Box[], width: number, y: number, floor = 0) {
  let edge = floor
  for (const b of boxes) if (b.t < y + 16 && b.b > y - 16 && b.r > width / 2) edge = Math.max(edge, b.r)
  return { edge, free: width - edge }
}

export function kolamPath(o: KolamInput): { d: string; ring: boolean; loops: number } {
  const { width: W, boxes, slim } = o
  const marks = slim ? [] : [...o.marks].sort((a, b) => a - b)
  let yEnd = o.y1
  let ringGeo: { bx: number; by: number; ew: number; eh: number } | null = null
  const ring = o.ring && !slim ? o.ring : null
  if (ring) {
    // Reachable only when the button sits at the gutter (right-aligned) and the ring clears everything else.
    const bx = (ring.l + ring.r) / 2
    const by = (ring.t + ring.b) / 2
    const inside = (x: Box) => x.l >= ring.l - 1 && x.r <= ring.r + 1 && x.t >= ring.t - 1 && x.b <= ring.b + 1
    for (const m of [10, 7, 4]) {
      const g = { bx, by, ew: (ring.r - ring.l) / 2 + m, eh: (ring.b - ring.t) / 2 + m }
      const box = { l: bx - g.ew - 2, r: bx + g.ew + 2, t: by - g.eh - 2, b: by + g.eh + 2 }
      if (box.r <= W - 3 && !boxes.some((x) => x.l < box.r && x.r > box.l && x.t < box.b && x.b > box.t && !inside(x))) {
        ringGeo = g
        break
      }
    }
    if (ringGeo) yEnd = Math.min(yEnd, by)
  }

  const amp = slim ? 2.5 : 6
  let d = ''
  let open = false
  let loops = 0
  let m = 0
  for (let y = o.y0; y <= yEnd; y += STEP) {
    const { free } = gutter(boxes, W, y, o.floor)
    if (free < MIN_FREE) {
      open = false // no room here: the line rests and picks up again where there is
      continue
    }
    const cx = W - free / 2
    const a = Math.max(0, Math.min(amp, free / 2 - 3))
    d += `${open ? 'L' : 'M'}${f(cx + a * Math.sin(y * 0.05))} ${f(y)}`
    open = true
    while (m < marks.length && marks[m] <= y) {
      const r = Math.min(13, free / 2 - 3 - a)
      if (r >= 4) {
        d += `a${f(r)} ${f(r)} 0 1 1 0 ${f(2 * r)}a${f(r)} ${f(r)} 0 1 1 0 ${f(-2 * r)}`
        loops++
      }
      m++
    }
  }
  if (ringGeo && open) {
    const { bx, by, ew, eh } = ringGeo
    // Across the clear gutter to the ring's right-hand point, once round, and back to it.
    d += `L${f(bx + ew)} ${f(by)}A${f(ew)} ${f(eh)} 0 1 1 ${f(bx - ew)} ${f(by)}A${f(ew)} ${f(eh)} 0 1 1 ${f(bx + ew)} ${f(by)}`
  }
  return { d, ring: !!ringGeo && open, loops }
}
