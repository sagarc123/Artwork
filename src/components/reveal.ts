// Reveals by medium, each once as a piece scrolls in (called from EverydayMotion, which owns the observer):
//   rangoli     powder grains pour out from the centre on a canvas, then the art fades in
//   portrait    charcoal contour lines draw, then hatching, then shading (a real photo: sketch lines, then the photo through a hatch mask)
//   watercolour a turbulence edge bleed: the art spreads from a few wet spots through an SVG displacement filter
// The art is hidden by CSS only while <html data-rv> is set (the head script; its failsafe removes it), and every path here ends by
// setting data-done on the piece, which shows the art. Browser only; decoration.

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const NS = 'http://www.w3.org/2000/svg'
let uid = 0

/** Frame loop for `ms`; resolves when done or stopped. */
const run = (ms: number, step: (k: number) => void, signal: AbortSignal) =>
  new Promise<void>((done) => {
    const t0 = performance.now()
    const f = (now: number) => {
      if (signal.aborted) return done()
      const k = clamp((now - t0) / ms, 0, 1)
      step(k)
      if (k < 1) requestAnimationFrame(f)
      else done()
    }
    requestAnimationFrame(f)
  })

const wait = (ms: number, signal: AbortSignal) => new Promise<void>((r) => (signal.aborted ? r() : setTimeout(r, ms)))
const settled = (a: Animation) => a.finished.then(() => undefined, () => undefined)

/** Powder grains: at most 760 (380 on phones). They pour from the centre outwards; the canvas is removed afterwards. */
async function powder(el: HTMLElement, face: HTMLElement, signal: AbortSignal) {
  const box = face.parentElement!
  const r = box.getBoundingClientRect()
  const S = Math.round(Math.min(r.width, r.height))
  if (S < 20) return
  const cv = document.createElement('canvas')
  cv.width = cv.height = S
  cv.className = 'pcv'
  cv.setAttribute('aria-hidden', 'true')
  // Not a child of the piece: its parent may still be waiting to be hydrated, and React must not meet a node it didn't render.
  // The canvas sits on <body>, placed over the piece (and kept there every frame, since the card may still be rising into place).
  cv.style.cssText = `position:absolute;z-index:3;border-radius:50%;width:${S}px;height:${S}px`
  const place = () => {
    const b = box.getBoundingClientRect()
    cv.style.left = `${b.left + scrollX + (b.width - S) / 2}px`
    cv.style.top = `${b.top + scrollY + (b.height - S) / 2}px`
  }
  place()
  document.body.append(cv)
  const c = cv.getContext('2d')
  const T = 1900
  const R = S / 2
  const PAL = ['#C8281E', '#F2A20C', '#0B5E73', '#FFFFFF']
  const grains = Array.from({ length: innerWidth < 640 ? 380 : 760 }, () => {
    const th = Math.random() * Math.PI * 2
    const rr = Math.sqrt(Math.random()) * R * 0.97
    const q = rr / R
    return { x: R + Math.cos(th) * rr, y: R + Math.sin(th) * rr, b: q * 0.55 * T + Math.random() * 140, c: q < 0.28 ? 0 : q < 0.55 ? 1 : q < 0.82 ? 2 : Math.random() < 0.5 ? 0 : 3, s: 1.5 + Math.random() * 2.4 }
  })
  try {
    if (c) {
      await run(
        T,
        (k) => {
          const e = k * T
          place()
          c.clearRect(0, 0, S, S)
          for (let ci = 0; ci < 4; ci++) {
            c.fillStyle = PAL[ci]
            c.beginPath()
            for (const g of grains) {
              if (g.c !== ci) continue
              const p = clamp((e - g.b) / (0.5 * T), 0, 1)
              if (p <= 0) continue
              const k2 = 1 - Math.pow(1 - p, 3)
              c.rect(R + (g.x - R) * k2 - g.s / 2, R + (g.y - R) * k2 - (1 - p) * 8 * Math.sin(p * Math.PI) - g.s / 2, g.s, g.s)
            }
            c.fill()
          }
        },
        signal,
      )
    }
    el.dataset.done = '' // the art fades in under the grains
    if (!signal.aborted) await settled(cv.animate({ opacity: [1, 0] }, { duration: 800, delay: 150, fill: 'forwards' }))
  } finally {
    cv.remove()
  }
}

/** Charcoal: the stand-in's own paths draw (contour, then hatching, then the shading fades up); a photo gets sketch lines, then a hatch mask. */
async function charcoal(el: HTMLElement, face: HTMLElement, signal: AbortSignal) {
  const svg = face.querySelector<SVGSVGElement>('svg')
  if (el.hasAttribute('data-photo') || !svg) {
    const over = el.querySelector<SVGSVGElement>('.sk-over')
    const ps = [...(over?.querySelectorAll<SVGPathElement>('path') ?? [])]
    if (over) over.style.opacity = '1'
    ps.forEach((p) => (p.style.strokeDasharray = '1 2'))
    const draws = ps.map((p, i) => p.animate({ strokeDashoffset: [1.02, 0] }, { duration: 900, delay: i * 220, fill: 'both', easing: 'cubic-bezier(.4,0,.2,1)' }))
    await wait(1100, signal)
    face.dataset.hatch = ''
    el.dataset.done = ''
    const up = face.animate({ '--hw': ['0px', '9px'], opacity: [0, 1] }, { duration: 1300, fill: 'both', easing: 'cubic-bezier(.45,0,.2,1)' })
    await Promise.race([settled(up), wait(1500, signal)])
    delete face.dataset.hatch
    up.cancel()
    if (over) await settled(over.animate({ opacity: [1, 0] }, { duration: 500, fill: 'forwards' }))
    draws.forEach((a) => a.cancel())
    if (over) over.style.opacity = ''
    ps.forEach((p) => (p.style.strokeDasharray = ''))
    return
  }
  const lines = [...svg.querySelectorAll<SVGPathElement>('path[pathLength]')]
  const shade = svg.querySelector<SVGGElement>('g.fx')
  const contour = lines.filter((p) => parseFloat(p.getAttribute('stroke-width') ?? '1') > 0.5)
  const hatch = lines.filter((p) => !contour.includes(p))
  lines.forEach((p) => {
    p.style.strokeDasharray = '1 2'
    p.style.strokeDashoffset = '1.02'
  })
  if (shade) shade.style.opacity = '0'
  el.dataset.done = '' // the paper first: everything on it is still undrawn
  const an: Animation[] = []
  contour.forEach((p, i) => an.push(p.animate({ strokeDashoffset: [1.02, 0] }, { duration: 760, delay: i * 90, fill: 'both', easing: 'cubic-bezier(.4,0,.2,1)' })))
  hatch.forEach((p, i) => an.push(p.animate({ strokeDashoffset: [1.02, 0] }, { duration: 520, delay: 850 + i * 60, fill: 'both', easing: 'cubic-bezier(.4,0,.2,1)' })))
  if (shade) an.push(shade.animate({ opacity: [0, 1] }, { duration: 1100, delay: 1500, fill: 'both', easing: 'ease-in-out' }))
  await Promise.race([Promise.all(an.map(settled)), wait(3200, signal)])
  an.forEach((a) => a.cancel())
  lines.forEach((p) => {
    p.style.strokeDasharray = ''
    p.style.strokeDashoffset = ''
  })
  if (shade) shade.style.opacity = ''
}

/** Watercolour: wet spots spread under a turbulence displacement filter (unique ids; the filter is removed when done). */
async function bleed(el: HTMLElement, face: HTMLElement, signal: AbortSignal) {
  const host = face.parentElement!
  const id = `bleed${++uid}`
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('width', '0')
  svg.setAttribute('height', '0')
  svg.setAttribute('aria-hidden', 'true')
  svg.style.position = 'absolute'
  svg.innerHTML = `<filter id="${id}" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".016" numOctaves="2" seed="${uid + 3}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="46" xChannelSelector="R" yChannelSelector="G"/></filter>`
  document.body.append(svg)
  const map = svg.querySelector('feDisplacementMap')!
  const spots = [[0, 50], [100, 40], [50, 0], [50, 100], [50, 50]]
  face.style.maskImage = spots.map(([x, y], i) => `radial-gradient(ellipse at ${x}% ${y}%, #000 calc(var(--mr) * ${(1 - i * 0.12).toFixed(2)}), transparent calc(var(--mr) * ${(1 - i * 0.12).toFixed(2)} + 7%))`).join(',')
  host.style.filter = `url(#${id})`
  el.dataset.done = '' // the art is there, but fully masked
  const T = innerWidth < 640 ? 1900 : 2400
  const grow = face.animate({ '--mr': ['0%', '135%'] }, { duration: T, fill: 'both', easing: 'cubic-bezier(.45,0,.2,1)' })
  try {
    await run(T, (k) => map.setAttribute('scale', (46 * (1 - k)).toFixed(1)), signal)
  } finally {
    grow.cancel()
    face.style.maskImage = ''
    host.style.filter = ''
    svg.remove()
  }
}

/** Plays the reveal for one piece (data-med: rangoli | portrait | watercolour). Always leaves the art showing (data-done). */
export async function reveal(el: HTMLElement, signal: AbortSignal) {
  const face = el.querySelector<HTMLElement>('[data-face]')
  try {
    if (!face || el.hasAttribute('data-done')) return
    const kind = el.dataset.med
    if (kind === 'rangoli') await powder(el, face, signal)
    else if (kind === 'portrait') await charcoal(el, face, signal)
    else if (kind === 'watercolour') await bleed(el, face, signal)
  } catch {
    // Decoration: nothing to report.
  } finally {
    el.dataset.done = ''
  }
}
