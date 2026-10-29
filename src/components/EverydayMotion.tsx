'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef } from 'react'

// Everyday-look motion that needs a little script (the rest is CSS in globals.css): the header shadow after a few pixels of scroll,
// scroll reveals (.rv → .rv.in, .dl → .dl.in, once), and the powder tap on primary buttons. Decoration only: nothing here blocks a click,
// and every effect stands down for reduced motion and "Stop animations". Without JS, reveals never start hidden (<html data-rv> is set by the head script).

const PRIMARY = 'a.bg-kumkum, button.bg-kumkum, .ws-wa, .ws-pop, .card-btn, .footer-ask-btn'
const COLOURS = ['#F2A20C', '#F2C46B']

const calm = () => {
  const r = document.documentElement
  return r.dataset.motion === 'off' || r.dataset.season === 'festive' || matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** 8 small marigold dots fly 26–40px from the tap point over 520ms (4 on slow phones); the nodes remove themselves. */
function powder(btn: HTMLElement, x: number | null, y: number | null) {
  if (calm()) return
  if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative'
  const r = btn.getBoundingClientRect()
  const n = document.documentElement.dataset.fx === 'lite' ? 4 : 8
  const cx = x === null ? r.width / 2 : x - r.left
  const cy = y === null ? r.height / 2 : y - r.top
  for (let i = 0; i < n; i++) {
    const d = document.createElement('i')
    d.setAttribute('aria-hidden', 'true')
    d.style.cssText = `position:absolute;left:${cx - 3.5}px;top:${cy - 3.5}px;width:7px;height:7px;border-radius:50%;pointer-events:none;z-index:3;background:${COLOURS[i % 2]}`
    const a = (i / n) * Math.PI * 2 + 0.4
    const k = 26 + (i % 3) * 7
    const [dx, dy] = [Math.cos(a) * k, Math.sin(a) * k]
    btn.append(d)
    d.animate(
      [
        { transform: 'translate(0,0) scale(.4)', opacity: 1 },
        { transform: `translate(${dx * 0.8}px,${dy * 0.8}px) scale(1)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dx}px,${dy}px) scale(.2)`, opacity: 0 },
      ],
      { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)' },
    ).onfinish = () => d.remove()
  }
}

export function EverydayMotion() {
  // Reveals belong to the first load only: after a client navigation nothing starts hidden, so the card → product morph (and back) always has its pictures.
  const path = usePathname()
  const first = useRef(path)
  useLayoutEffect(() => {
    if (path !== first.current) delete document.documentElement.dataset.rv
  }, [path])

  useEffect(() => {
    const root = document.documentElement

    // Header shadow: a 6px sentinel at the very top; when it scrolls out, the header says so.
    const sentinel = document.createElement('div')
    sentinel.setAttribute('aria-hidden', 'true')
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:6px;pointer-events:none'
    document.body.prepend(sentinel)
    const header = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) delete root.dataset.stuck
      else root.dataset.stuck = ''
    })
    header.observe(sentinel)

    // Reveals and dividers: each element is revealed once; new ones (client navigation, filters) are picked up as they appear.
    const seen = new IntersectionObserver(
      (list) =>
        list.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.classList.add('in')
          seen.unobserve(e.target)
        }),
      { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
    )
    const watch = () => document.querySelectorAll('.rv:not(.in), .dl:not(.in)').forEach((el) => seen.observe(el))
    watch()
    let queued = 0
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(queued)
      queued = requestAnimationFrame(watch)
    })
    mo.observe(document.body, { childList: true, subtree: true })

    const down = (e: PointerEvent) => {
      const b = (e.target as Element | null)?.closest<HTMLElement>(PRIMARY)
      if (b) powder(b, e.clientX, e.clientY)
    }
    const key = (e: MouseEvent) => {
      const b = (e.target as Element | null)?.closest<HTMLElement>(PRIMARY)
      if (b && e.detail === 0) powder(b, null, null) // keyboard activation
    }
    document.addEventListener('pointerdown', down)
    document.addEventListener('click', key)
    return () => {
      header.disconnect()
      seen.disconnect()
      mo.disconnect()
      sentinel.remove()
      document.removeEventListener('pointerdown', down)
      document.removeEventListener('click', key)
    }
  }, [])
  return null
}
