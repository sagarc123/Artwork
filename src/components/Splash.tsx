'use client'

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { localToday } from '@/lib/dates'
import { rangoliToday, type Festival } from '@/lib/rangoli'
import { rangoliPainter } from './rangoliDraw'
import { sweep, type Run } from './sweep'

// The splash, everyday look, once per session. The head script (layout.tsx) decides before first paint: it sets <html data-splash> (a solid peacock
// cover drawn by CSS, so a first-time visitor never sees an unstyled flash, and a returning one never sees a frame of it). This island mounts only
// then: today's rangoli draws itself on the peacock, the name fades in, and a broom sweep clears it to show the page, which was there all along
// (it is aria-hidden, nothing is inert, focus is never moved). Tap, click or any key skips. Failsafes: the CSS cover removes itself after 3s if this
// never mounts, the head script removes the flag, and this island ends itself after 4s at the most.

const subscribe = () => () => {}
let claimed = false
const wanted = () => claimed || document.documentElement.dataset.splash === ''

export function Splash({ festivals, name, skip }: { festivals: Festival[]; name: string; skip: string }) {
  const on = useSyncExternalStore(subscribe, wanted, () => false)
  const [ended, setEnded] = useState(false)
  const layer = useRef<HTMLDivElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  const shown = on && !ended

  // The overlay and the flag change in the same frame: the CSS cover hands over to the overlay without a gap.
  useLayoutEffect(() => {
    if (!on) return
    claimed = true
    document.documentElement.dataset.splash = 'live'
  }, [on])

  useEffect(() => {
    if (!on) return
    const root = document.documentElement
    const el = layer.current
    const phone = innerWidth < 640
    let finished = false
    let run: Run | null = null
    const timers: number[] = []
    const finish = () => {
      if (finished) return
      finished = true
      timers.forEach(clearTimeout)
      cancelAnimationFrame(raf)
      run?.cancel()
      removeEventListener('pointerdown', skipNow, true)
      removeEventListener('click', skipNow, true)
      removeEventListener('keydown', skipNow, true)
      delete root.dataset.splash
      dispatchEvent(new Event('splash-end'))
      setEnded(true)
    }
    const clear = (fast: boolean) => {
      if (finished || run) return
      run = sweep({ mode: 'reveal', dur: fast ? 340 : phone ? 440 : 560, layer: el })
      void run.done.then(finish)
    }
    function skipNow(e: Event) {
      // The first tap only skips; it does not also press whatever is underneath.
      if (e.type !== 'keydown') e.stopPropagation()
      clear(true)
    }
    addEventListener('pointerdown', skipNow, true)
    addEventListener('click', skipNow, true)
    addEventListener('keydown', skipNow, true)
    const T = phone ? 1000 : 1300
    // Today's rangoli draws itself on a canvas (dot, line, colour): a slow phone cannot animate ~130 SVG shapes.
    const canvas = cv.current
    const ctx = canvas?.getContext('2d')
    let raf = 0
    if (canvas && ctx) {
      const size = Math.round(canvas.getBoundingClientRect().width) || 300
      const dpr = Math.min(devicePixelRatio || 1, 2)
      canvas.width = canvas.height = Math.round(size * dpr)
      ctx.scale(dpr, dpr)
      const paint = rangoliPainter(ctx, rangoliToday(localToday(), festivals).rangoli, size, '#E8F1F3')
      const t0 = performance.now()
      const frame = (now: number) => {
        const k = Math.min(1, (now - t0) / (T * 1.05))
        paint(k)
        if (k < 1 && !finished) raf = requestAnimationFrame(frame)
      }
      raf = requestAnimationFrame(frame)
    }
    timers.push(window.setTimeout(() => el?.querySelector('.splash-name')?.classList.add('on'), T * 0.65))
    timers.push(window.setTimeout(() => clear(false), T + 150))
    timers.push(window.setTimeout(finish, 4000))
    return finish
  }, [on, festivals])

  if (!shown) return null
  return (
    <div ref={layer} className="splash" aria-hidden="true">
      <div className="splash-art">
        <canvas ref={cv} />
      </div>
      <p className="splash-name">{name}</p>
      <p className="splash-skip">{skip}</p>
    </div>
  )
}
