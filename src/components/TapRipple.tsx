'use client'

import { useEffect } from 'react'

const COLORS = ['#a6261d', '#e8890c', '#f2b705', '#0b5e73', '#2e6b3c']

/** A small burst of rangoli powder where a link or button is tapped. Off when motion is reduced. */
export function TapRipple() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const root = document.documentElement
      if (root.dataset.motion === 'off' || root.dataset.fx === 'lite') return
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
      // Keyboard "clicks" have detail 0: no burst.
      if (e.detail === 0 || !(e.target as Element).closest('a, button, [data-ripple]')) return
      const burst = document.createElement('span')
      burst.className = 'tap-burst'
      burst.style.cssText = `left:${e.clientX}px;top:${e.clientY}px`
      const start = Math.floor(Math.random() * COLORS.length)
      for (let i = 0; i < 6; i++) {
        const dot = document.createElement('i')
        dot.style.cssText = `--a:${i * 60 + Math.random() * 20}deg;--c:${COLORS[(start + i) % COLORS.length]}`
        burst.append(dot)
      }
      document.body.append(burst)
      setTimeout(() => burst.remove(), 700)
    }
    document.addEventListener('click', onClick, { passive: true })
    return () => document.removeEventListener('click', onClick)
  }, [])
  return null
}
