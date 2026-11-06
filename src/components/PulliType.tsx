'use client'

import { useEffect } from 'react'
import { canAutoplay } from '@/lib/motion'
import { pulli } from './pulli'

// Home page only. Plays the pulli-type intro on the elements marked [data-pulli] (the real text stays in the page), once per page view.
// The head script arms it (<html data-pl>) only when motion is on, so calm modes and no-JS show plain text from the first frame, and
// stands down if this never runs. Everything here clears data-pl again, so the text can never stay see-through.

let played = false
const INK = { ink: '--color-charcoal', peacock: '--color-peacock' } as const

export function PulliType() {
  useEffect(() => {
    const root = document.documentElement
    if (root.dataset.pl === undefined) return
    root.dataset.plLive = '' // running: the head script's failsafe stands down
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    const els = [...document.querySelectorAll<HTMLElement>('[data-pulli]')].filter((el) => el.getClientRects().length > 0)
    const go =
      !played &&
      els.length > 0 &&
      canAutoplay({ reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches, motion: root.dataset.motion, fx: root.dataset.fx, saveData: conn?.saveData, effectiveType: conn?.effectiveType })
    if (!go) {
      delete root.dataset.pl
      return
    }
    const stop = new AbortController()
    const phone = innerWidth < 640
    const style = getComputedStyle(root)
    // Start the big headline first, the tagline half a second behind it.
    const runs = els.map((el, i) => {
      const small = el.dataset.pulli !== 'ink'
      const run = () => pulli(el, { duration: small ? (phone ? 1400 : 1700) : phone ? 1900 : 2500, step: small ? (phone ? 6 : 7) : phone ? 7 : 9, ink: style.getPropertyValue(INK[el.dataset.pulli === 'peacock' ? 'peacock' : 'ink']) }, stop.signal)
      return i === 0 ? run() : new Promise((r) => setTimeout(r, 500)).then(run)
    })
    // A resized window no longer fits the lattice: show the text.
    addEventListener('resize', () => stop.abort('resize'), { signal: stop.signal })
    Promise.all(runs).then(() => {
      if (stop.signal.aborted) return
      played = true
      delete root.dataset.pl
    })
    return () => stop.abort('unmount')
  }, [])
  return null
}
