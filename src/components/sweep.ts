// The broom sweep on screen: one fixed canvas draws the band (marigold, kumkum, peacock) with powder flying off its edge, and either paints the area
// behind it (a cover, for page changes) or clears a layer ahead of it (the splash). Geometry is in lib/broom.ts. Browser only; decoration.
import { bandWidth, frontLine, frontStart, polygon } from '@/lib/broom'

const COLS = ['#F2A20C', '#C8281E', '#0B5E73']

export type Run = {
  /** true when the sweep finished, false when it was cancelled. */
  done: Promise<boolean>
  /** Stops at once and removes everything it added (the canvas, the layer's clip). */
  cancel: () => void
}

type Opts = {
  /** cover: the area the band has passed is painted `fill` (and stays painted until cancelled). reveal: the area ahead of the band is painted, and what the band has passed shows what is underneath. */
  mode: 'cover' | 'reveal'
  dur: number
  fill?: string
  /** An element to clear instead of painting (the splash): it stays visible ahead of the band only. */
  layer?: HTMLElement | null
  /** A previous run (the cover) to drop once this one has drawn its first frame, so the screen is never uncovered in between. */
  after?: Run
}

export function sweep(o: Opts): Run {
  const W = innerWidth
  const H = innerHeight
  const sw = { W, H }
  const bw = bandWidth(W)
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  cv.setAttribute('aria-hidden', 'true')
  cv.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none;width:100vw;height:100vh'
  document.body.append(cv)
  const c = cv.getContext('2d')!
  const parts: { x: number; y: number; vx: number; vy: number; a: number; s: number; c: string }[] = []
  let cancelled = false
  let finished = false
  let raf = 0
  let resolve!: (v: boolean) => void
  const done = new Promise<boolean>((r) => (resolve = r))
  const t0 = performance.now()
  let last = t0

  const cancel = () => {
    if (finished) return
    finished = cancelled = true
    cancelAnimationFrame(raf)
    cv.remove()
    if (o.layer) o.layer.style.clipPath = ''
    resolve(false)
  }

  const paint = (now: number) => {
    const ms = now - t0
    const k = Math.min(1, Math.max(0, ms / o.dur))
    const s = frontStart(sw, k)
    const line = frontLine(sw, s, ms)
    c.clearRect(0, 0, W, H)
    if (o.layer) {
      if (o.mode === 'reveal') o.layer.style.clipPath = polygon(line, W, true)
    } else {
      c.fillStyle = o.fill ?? '#fffcf7'
      c.beginPath()
      if (o.mode === 'cover') {
        // behind the band
        line.forEach(([x, y], i) => (i ? c.lineTo(x - bw * 3, y) : c.moveTo(x - bw * 3, y)))
        c.lineTo(-8, H)
        c.lineTo(-8, 0)
      } else {
        // ahead of the band
        line.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)))
        c.lineTo(W + 8, H)
        c.lineTo(W + 8, 0)
      }
      c.closePath()
      c.fill()
    }
    // The band: three colours, each one band-width, trailing the front.
    for (let b = 2; b >= 0; b--) {
      c.fillStyle = COLS[b]
      c.beginPath()
      line.forEach(([x, y], i) => (i ? c.lineTo(x - b * bw, y) : c.moveTo(x - b * bw, y)))
      for (let i = line.length - 1; i >= 0; i--) c.lineTo(line[i][0] - (b + 1) * bw, line[i][1])
      c.closePath()
      c.fill()
    }
    // Powder thrown off the leading edge.
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    if (k < 0.96 && parts.length < 90) {
      for (let i = 0; i < 4; i++) {
        const y = Math.random() * H
        const fx = line[Math.min(line.length - 1, Math.round((y / H) * (line.length - 1)))][0]
        parts.push({ x: fx - Math.random() * bw, y, vx: 70 + Math.random() * 190, vy: (Math.random() - 0.4) * 90, a: 1, s: 1.6 + Math.random() * 3, c: COLS[(Math.random() * 3) | 0] })
      }
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 160 * dt
      p.a -= dt * 1.6
      if (p.a <= 0) {
        parts.splice(i, 1)
        continue
      }
      c.globalAlpha = p.a
      c.fillStyle = p.c
      c.fillRect(p.x, p.y, p.s, p.s)
    }
    c.globalAlpha = 1
    return k
  }

  paint(t0)
  o.after?.cancel()
  const frame = (now: number) => {
    if (cancelled) return
    const k = paint(now)
    if (k < 1) raf = requestAnimationFrame(frame)
    else {
      finished = true
      if (o.mode === 'reveal' || o.layer) {
        cv.remove() // a swept layer stays clipped away: its owner removes it
      } else {
        // a cover stays: the screen is painted solid until the next sweep takes over (or cancel)
        c.clearRect(0, 0, W, H)
        c.fillStyle = o.fill ?? '#fffcf7'
        c.fillRect(0, 0, W, H)
      }
      resolve(true)
    }
  }
  raf = requestAnimationFrame(frame)
  // `cancel` after a finished cover must still remove its canvas
  return {
    done,
    cancel: () => {
      if (finished && o.mode === 'cover' && !o.layer && cv.isConnected) cv.remove()
      cancel()
    },
  }
}
