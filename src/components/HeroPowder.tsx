'use client'

import { useEffect } from 'react'

// Powder you can touch, on the everyday home hero only. Desktop: a trail of grains follows the pointer. Phones: dragging a finger over the rangoli
// plate draws a powder line (the plate has touch-action: pan-y, so vertical scrolling and taps still work). One canvas, one loop that runs only while
// grains are alive, nothing while the hero is off screen. The canvas sits under the text column (globals.css), so it can never cover text or a button,
// and grains are not started over them. None under "Stop animations" or reduced motion; fewer under lite.

const PAL = ['#C8281E', '#F2A20C', '#D9468F', '#4FA04A', '#2FA3BD', '#F2A20C']
type Grain = { x: number; y: number; vx: number; vy: number; age: number; life: number; s: number; c: number }

export function HeroPowder() {
  useEffect(() => {
    const root = document.documentElement
    const hero = document.querySelector<HTMLElement>('.ws-hero')
    if (!hero || hero.getClientRects().length === 0) return
    if (root.dataset.motion === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lite = root.dataset.fx === 'lite'
    const cap = lite ? 50 : 170
    const cv = document.createElement('canvas')
    cv.className = 'ws-powder'
    cv.setAttribute('aria-hidden', 'true')
    hero.append(cv)
    const c = cv.getContext('2d')
    if (!c) return void cv.remove()
    let W = 0
    let H = 0
    let grains: Grain[] = []
    let raf = 0
    let last = 0
    let onScreen = true
    let prev: [number, number] | null = null
    const dpr = Math.min(devicePixelRatio || 1, 1.5)
    const fit = () => {
      const r = hero.getBoundingClientRect()
      W = r.width
      H = r.height
      cv.width = Math.round(W * dpr)
      cv.height = Math.round(H * dpr)
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    fit()

    const spawn = (x: number, y: number, n: number) => {
      for (let i = 0; i < n && grains.length < cap; i++) {
        const a = Math.random() * Math.PI * 2
        const v = 8 + Math.random() * 26
        grains.push({ x: x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 6, vx: Math.cos(a) * v, vy: Math.sin(a) * v + 10, age: 0, life: 1.5 + Math.random() * 0.9, s: 1.6 + Math.random() * 2.4, c: Math.random() < 0.5 ? 0 : 1 + ((Math.random() * 4) | 0) })
      }
      if (!raf && onScreen) {
        last = performance.now()
        raf = requestAnimationFrame(loop)
      }
    }
    function loop(now: number) {
      raf = 0
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      c!.clearRect(0, 0, W, H)
      grains = grains.filter((g) => g.age < g.life)
      const byColour: [number, number, number][][] = PAL.map(() => [])
      for (const g of grains) {
        g.age += dt
        if (g.age < 0.35) {
          g.x += g.vx * dt
          g.y += g.vy * dt
          g.vx *= 0.9
          g.vy *= 0.9
        }
        const a = g.age < 0.35 ? 1 : Math.max(0, Math.min(1, 1 - (g.age - 0.35 - (g.life - 0.35) * 0.4) / ((g.life - 0.35) * 0.6)))
        byColour[g.c].push([g.x, g.y, g.s * (g.age < 0.35 ? 1 : 0.8) * (0.4 + 0.6 * a)])
      }
      byColour.forEach((list, ci) => {
        if (!list.length) return
        c!.fillStyle = PAL[ci]
        c!.beginPath()
        for (const [x, y, s] of list) {
          c!.moveTo(x + s, y)
          c!.arc(x, y, s, 0, Math.PI * 2)
        }
        c!.fill()
      })
      if (grains.length && onScreen) raf = requestAnimationFrame(loop)
    }

    const blocked = (t: EventTarget | null) => !!(t as Element | null)?.closest?.('.ws-hero-text, a, button, .tcap')
    const move = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      if (e.pointerType === 'mouse') {
        if (blocked(e.target)) return void (prev = null)
      } else if (!(e.target as Element | null)?.closest('.ws-stage') || blocked(e.target)) return void (prev = null)
      if (prev) {
        const dx = x - prev[0]
        const dy = y - prev[1]
        // One grain per few pixels travelled (the distance builds up over small moves).
        const n = e.pointerType === 'mouse' ? Math.min(8, Math.floor(Math.hypot(dx, dy) / (lite ? 30 : 14))) : Math.max(1, Math.floor(Math.hypot(dx, dy) / (lite ? 12 : 6)))
        if (!n) return
        for (let i = 0; i < n; i++) spawn(prev[0] + (dx * i) / n, prev[1] + (dy * i) / n, e.pointerType === 'mouse' ? (Math.random() < 0.5 ? 2 : 1) : 1)
      }
      prev = [x, y]
    }
    const end = () => void (prev = null)
    hero.addEventListener('pointermove', move)
    hero.addEventListener('pointerleave', end)
    hero.addEventListener('pointerup', end)
    hero.addEventListener('pointercancel', end)
    addEventListener('resize', fit)
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting
      if (!onScreen) {
        grains = []
        cancelAnimationFrame(raf)
        raf = 0
        c.clearRect(0, 0, W, H)
      }
    })
    io.observe(hero)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      removeEventListener('resize', fit)
      hero.removeEventListener('pointermove', move)
      hero.removeEventListener('pointerleave', end)
      hero.removeEventListener('pointerup', end)
      hero.removeEventListener('pointercancel', end)
      cv.remove()
    }
  }, [])
  return null
}
