// Add to cart (everyday): a small round copy of the picture arcs to the visible cart icon, which then pops with a marigold ripple.
// Transform and opacity only; resolves immediately when motion is off, reduced or lite. Decoration: the cart itself updates either way.

const OUT = 'cubic-bezier(.22,1,.36,1)'
const POP = 'cubic-bezier(.34,1.4,.64,1)'

const still = () => {
  const r = document.documentElement
  return r.dataset.motion === 'off' || r.dataset.fx === 'lite' || r.dataset.season === 'festive' || matchMedia('(prefers-reduced-motion: reduce)').matches
}

const cartIcon = () => [...document.querySelectorAll<HTMLElement>('[data-pinch="cart"]')].find((e) => e.getBoundingClientRect().width > 0)

/** Resolves when the copy has landed (≈760ms), so the caller can add to the cart then. */
export function flyToCart(from: Element | null): Promise<void> {
  const to = cartIcon()
  if (!from || !to || still()) return Promise.resolve()
  const s = from.getBoundingClientRect()
  const t = to.getBoundingClientRect()
  const z = Math.min(88, s.width * 0.5)
  const dx = t.left + t.width / 2 - (s.left + s.width / 2)
  const dy = t.top + t.height / 2 - (s.top + s.height / 2)
  const outer = document.createElement('div')
  const inner = document.createElement('div')
  outer.setAttribute('aria-hidden', 'true')
  outer.style.cssText = `position:fixed;z-index:50;pointer-events:none;left:${s.left + s.width / 2 - z / 2}px;top:${s.top + s.height / 2 - z / 2}px;width:${z}px;height:${z}px`
  inner.style.cssText = 'width:100%;height:100%;border-radius:50%;overflow:hidden;background:#FFF4DC;box-shadow:0 0 0 4px #FDEBC0,0 0 0 6px #F2C46B,0 10px 18px rgb(14 63 76 / .25)'
  const img = from.querySelector('img, svg')?.cloneNode(true) as HTMLElement | undefined
  if (img) {
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block'
    img.removeAttribute('class')
    inner.append(img)
  }
  outer.append(inner)
  document.body.append(outer)
  const D = 760
  // x and y on two nested layers make a curve with transform only.
  inner.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${dy}px)` }], { duration: D, easing: 'cubic-bezier(.3,-.5,.6,1)', fill: 'forwards' })
  const a = outer.animate([{ transform: 'translateX(0) scale(1)', opacity: 1 }, { transform: `translateX(${dx}px) scale(.3)`, opacity: 0.9 }], { duration: D, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' })
  return a.finished.then(
    () => {
      outer.remove()
      pop(to)
    },
    () => outer.remove(),
  )
}

/** The cart icon pops and a marigold ripple spreads from it. */
function pop(to: HTMLElement) {
  to.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)', offset: 0.4 }, { transform: 'scale(1)' }], { duration: 420, easing: POP })
  const ring = document.createElement('span')
  ring.setAttribute('aria-hidden', 'true')
  ring.style.cssText = 'position:absolute;inset:-6px;border-radius:50%;border:3px solid #F2A20C;pointer-events:none;opacity:0'
  to.append(ring)
  ring.animate([{ opacity: 0.7, transform: 'scale(.9)' }, { opacity: 0, transform: 'scale(1.9)' }], { duration: 560, easing: OUT }).onfinish = () => ring.remove()
}
