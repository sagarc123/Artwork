// "Pinch of powder": a few grains fall from the button and a short trail drifts to the header icon.
// Only on real commits (add to cart, save, send), never on every tap. Text confirmations stay; this only decorates.

const COLOURS = ['#e8890c', '#f2b705', '#d0473b', '#1a8aa3', '#5aa16a']

/** Drop ≤10 grains from `from` (uses its position, so it works from the keyboard too); trail towards the visible [data-pinch=to] icon. */
export function pinch(from: Element, to?: 'cart' | 'saved') {
  const root = document.documentElement
  if (root.dataset.motion === 'off' || root.dataset.fx === 'lite' || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const b = from.getBoundingClientRect()
  const [x, y] = [b.left + b.width / 2, b.top + b.height / 2]
  const target = to ? [...document.querySelectorAll(`[data-pinch="${to}"]`)].map((e) => e.getBoundingClientRect()).find((r) => r.width > 0) : undefined

  const box = document.createElement('span')
  box.className = 'pinch'
  box.setAttribute('aria-hidden', 'true')
  box.style.cssText = `left:${x}px;top:${y}px`
  const grain = (css: string, cls = '') => {
    const g = document.createElement('i')
    if (cls) g.className = cls
    g.style.cssText = css
    box.append(g)
  }
  for (let i = 0; i < 7; i++) grain(`--x:${(Math.random() - 0.5) * b.width * 0.7}px;--y:${b.height / 2 + 6 + Math.random() * 16}px;--c:${COLOURS[i % 5]};animation-delay:${i * 18}ms`)
  if (target)
    for (let i = 0; i < 3; i++) grain(`--x:${target.left + target.width / 2 - x}px;--y:${target.top + target.height / 2 - y}px;--c:${COLOURS[(i + 1) % 5]};animation-delay:${80 + i * 60}ms`, 'pinch-trail')
  document.body.append(box)
  setTimeout(() => box.remove(), 700)
}
