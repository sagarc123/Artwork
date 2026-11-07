// Draws a generated rangoli (lib/rangoli.ts) on a canvas, dot → line → colour, for the splash: the same picture RangoliArt animates with CSS,
// but one canvas and a handful of fill calls per frame instead of ~130 animated SVG elements (which a slow phone cannot keep up with).
import type { Rangoli } from '@/lib/rangoli'

const clamp = (v: number) => Math.min(1, Math.max(0, v))
const out = (v: number) => 1 - Math.pow(1 - clamp(v), 3)
const pop = (v: number) => {
  const x = clamp(v)
  return x < 0.7 ? out(x / 0.7) * 1.12 : 1.12 - 0.12 * out((x - 0.7) / 0.3)
}
// Made on first use: this module is also loaded while the server prerenders, where there is no Path2D.
let flame: Path2D | undefined
const flameShape = () => (flame ??= new Path2D('M0 -2.4 C3 -7 0 -9 0 -11 C-1 -8 -3 -6 0 -2.4Z'))

/** A closed curve as points, read back from the generator's path data ("M x y L x y ... Z"). */
const points = (d: string) => [...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((m) => [+m[1], +m[2]] as const)

/** Makes a function that draws the rangoli at `k` (0 = nothing, 1 = finished) into `ctx`, a canvas `size` CSS pixels square. */
export function rangoliPainter(ctx: CanvasRenderingContext2D, r: Rangoli, size: number, ink: string) {
  const lines = r.lines.map(points)
  const dots = r.dots.length
  const shapes = r.shapes.length
  const scale = size / 200
  return (k: number) => {
    ctx.clearRect(0, 0, size, size)
    ctx.save()
    ctx.translate(size / 2, size / 2)
    ctx.scale(scale, scale)
    // 1. dots pop in over the first quarter
    ctx.fillStyle = ink
    ctx.beginPath()
    r.dots.forEach((d, i) => {
      const s = pop((k - (i / dots) * 0.16) / 0.1)
      if (s > 0) {
        ctx.moveTo(d.x + d.r * s, d.y)
        ctx.arc(d.x, d.y, d.r * s, 0, Math.PI * 2)
      }
    })
    ctx.fill()
    // 2. the lines draw round
    ctx.strokeStyle = ink
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const p = out((k - 0.14) / 0.42)
    if (p > 0) {
      for (const pts of lines) {
        const n = Math.max(2, Math.floor(pts.length * p))
        ctx.beginPath()
        ctx.moveTo(pts[0][0], pts[0][1])
        for (let i = 1; i < n; i++) ctx.lineTo(pts[i][0], pts[i][1])
        ctx.stroke()
      }
    }
    // 3. the colour blooms in, centre outwards
    r.shapes.forEach((s, i) => {
      const t = out((k - 0.4 - (i / shapes) * 0.42) / 0.18)
      if (t <= 0) return
      ctx.save()
      ctx.globalAlpha = t
      ctx.fillStyle = s.fill
      if (s.kind === 'dot') {
        ctx.beginPath()
        ctx.arc(0, 0, s.r * (0.2 + 0.8 * t), 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.rotate((s.angle * Math.PI) / 180)
        if (s.kind === 'petal') {
          ctx.translate(0, -s.at)
          ctx.scale(0.2 + 0.8 * t, 0.2 + 0.8 * t)
          ctx.beginPath()
          ctx.ellipse(0, 0, s.rx, s.ry, 0, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.translate(0, -92)
          ctx.beginPath()
          ctx.ellipse(0, 0, 5, 2.6, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#FFE7A8'
          ctx.fill(flameShape())
        }
      }
      ctx.restore()
    })
    ctx.restore()
  }
}
