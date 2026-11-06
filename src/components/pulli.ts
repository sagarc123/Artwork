// Pulli type: a headline drawn as a dot lattice. Marigold dots pop in over the text, kolam lines join them, the dots swell into ink,
// then the canvas fades out over the real text (which is always in the page: this only paints on top). Browser only; decoration.

const POP = [242, 162, 12]
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const ease = (k: number) => 1 - Math.pow(1 - k, 3)

/** "#rrggbb" or "rgb(r, g, b)" to numbers, else the fallback. */
function rgb(css: string, fallback: number[]) {
  const c = css.trim()
  const hex = /^#([0-9a-f]{6})$/i.exec(c)
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16))
  const m = /^rgba?\((\d+)[ ,]+(\d+)[ ,]+(\d+)/.exec(c)
  return m ? [+m[1], +m[2], +m[3]] : fallback
}

type Pt = { x: number; y: number; row: number; t0: number }

/** Every word of the element, with its box (page coordinates) and the style it is set in. */
function words(el: HTMLElement) {
  const out: { text: string; rect: DOMRect; cs: CSSStyleDeclaration }[] = []
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    const cs = getComputedStyle(n.parentElement!)
    for (const m of (n.nodeValue ?? '').matchAll(/\S+/g)) {
      const range = document.createRange()
      range.setStart(n, m.index)
      range.setEnd(n, m.index + m[0].length)
      const rects = range.getClientRects()
      if (rects.length === 1) out.push({ text: m[0], rect: rects[0], cs })
    }
  }
  return out
}

/**
 * Plays the animation over `el`. Resolves when the canvas is gone and the text is showing (also when stopped by `signal`).
 * `ink` is the colour the dots end in, which is the colour of the text (the text itself is see-through while this runs).
 */
export async function pulli(el: HTMLElement, o: { duration: number; step: number; ink: string }, signal: AbortSignal) {
  // Left alone when the page is being left (or React re-runs the effect): the next run owns the text.
  const show = () => {
    if (signal.reason !== 'unmount') el.setAttribute('data-pl-done', '')
  }
  try {
    await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))])
    if (signal.aborted) return show()
    const box = el.getBoundingClientRect()
    const pad = 8
    const W = Math.ceil(box.width + pad * 2)
    const H = Math.ceil(box.height + pad * 2)
    if (box.width < 8 || box.height < 8) return show()

    // 1. Paint the words into an offscreen canvas, exactly where the browser has set them.
    const off = document.createElement('canvas')
    off.width = W
    off.height = H
    const oc = off.getContext('2d', { willReadFrequently: true })
    if (!oc) return show()
    oc.fillStyle = '#000'
    oc.textBaseline = 'alphabetic'
    for (const { text, rect, cs } of words(el)) {
      oc.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
      oc.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing
      const m = oc.measureText('Hg')
      const asc = m.fontBoundingBoxAscent
      const base = rect.top + (rect.height - (asc + m.fontBoundingBoxDescent)) / 2 + asc
      oc.fillText(text, rect.left - box.left + pad, base - box.top + pad)
    }

    // 2. Sample the glyphs on a staggered lattice. Fewer, wider dots when the text is large.
    const alpha = oc.getImageData(0, 0, W, H).data
    let S = o.step
    let pts: Pt[] = []
    for (let tries = 0; tries < 4; tries++) {
      pts = []
      for (let row = 0; row < Math.floor(H / S); row++) {
        const y = row * S + S / 2
        for (let x = S / 2 + (row % 2) * (S / 2); x < W; x += S) {
          if (alpha[((y | 0) * W + (x | 0)) * 4 + 3] > 140) pts.push({ x, y, row, t0: Math.random() * 0.1 + (x / W) * 0.5 })
        }
      }
      if (pts.length < 1500) break
      S += 2
    }
    if (pts.length < 8) return show()

    // 3. Kolam lines: each dot to its three lower neighbours.
    const at = new Map(pts.map((p) => [`${p.row}:${Math.round(p.x)}`, p]))
    const edges: [Pt, Pt, number][] = []
    for (const p of pts) {
      for (const [down, dx] of [[0, S], [1, S / 2], [1, -S / 2]]) {
        const q = at.get(`${p.row + down}:${Math.round(p.x + dx)}`)
        if (q) edges.push([p, q, 0.28 + ((p.x + q.x) / 2 / W) * 0.45])
      }
    }

    // 4. The canvas sits exactly over the text box (a child of it, so it moves with it); it takes no space.
    const dpr = Math.min(devicePixelRatio || 1, 1.5)
    const cv = document.createElement('canvas')
    cv.className = 'plcv'
    cv.width = W * dpr
    cv.height = H * dpr
    cv.style.cssText = `left:${-pad}px;top:${-pad}px;width:${W}px;height:${H}px`
    cv.setAttribute('aria-hidden', 'true')
    el.append(cv)
    const c = cv.getContext('2d')
    if (!c) {
      cv.remove()
      return show()
    }
    c.scale(dpr, dpr)

    const ink = rgb(o.ink, [14, 63, 76])
    const swell = S * 0.5
    const t0 = performance.now()
    const root = document.documentElement
    await new Promise<void>((done) => {
      const frame = (now: number) => {
        // Stopped: "Stop animations" switched on, the page left, or the window resized (the lattice would no longer fit the text).
        if (signal.aborted || root.dataset.motion === 'off') return done()
        const k = clamp((now - t0) / o.duration, 0, 1)
        c.clearRect(0, 0, W, H)
        // Dots pop in marigold, then swell and turn to ink in five colour steps (one fill per step, not per dot).
        const steps: [number, number, number][][] = [[], [], [], [], []]
        for (const p of pts) {
          const a = clamp((k - p.t0) / 0.22, 0, 1)
          if (a <= 0) continue
          const ck = clamp((k - (0.55 + (p.x / W) * 0.25)) / 0.2, 0, 1)
          steps[Math.min(4, Math.floor(ck * 4.999))].push([p.x, p.y, 2.1 * ease(a) + (swell - 2.1) * ease(ck)])
        }
        // The lines join neighbouring dots, then fade as the ink floods in.
        c.lineWidth = 1.3
        c.strokeStyle = `rgba(11,94,115,${0.7 * (1 - clamp((k - 0.6) / 0.3, 0, 1))})`
        c.beginPath()
        for (const [a, b, s0] of edges) {
          const p = clamp((k - s0) / 0.2, 0, 1)
          if (p > 0) {
            c.moveTo(a.x, a.y)
            c.lineTo(a.x + (b.x - a.x) * p, a.y + (b.y - a.y) * p)
          }
        }
        c.stroke()
        steps.forEach((dots, g) => {
          if (!dots.length) return
          c.fillStyle = `rgb(${POP.map((v, i) => Math.round(v + (ink[i] - v) * (g / 4))).join(',')})`
          c.beginPath()
          for (const [x, y, r] of dots) {
            c.moveTo(x + r, y)
            c.arc(x, y, r, 0, Math.PI * 2)
          }
          c.fill()
        })
        if (k < 1) requestAnimationFrame(frame)
        else done()
      }
      requestAnimationFrame(frame)
    })

    // 5. The text comes back (a colour transition in the page's CSS) while the canvas fades; then the canvas is removed.
    show()
    if (signal.aborted) return cv.remove()
    await new Promise<void>((done) => {
      const fade = cv.animate({ opacity: [1, 0] }, { duration: 520, delay: 120, fill: 'forwards' })
      fade.onfinish = () => done()
      setTimeout(done, 900) // a hidden tab never finishes the animation
    })
    cv.remove()
  } catch {
    show() // whatever went wrong, the headline is never left see-through
    el.querySelector(':scope > .plcv')?.remove()
  }
}
