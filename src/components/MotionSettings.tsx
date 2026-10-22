'use client'

import { Pause, Play } from 'lucide-react'
import { useEffect, useSyncExternalStore } from 'react'

const KEY = 'motion'

type Connection = { saveData?: boolean; effectiveType?: string }

/** Turns effects down on slow phones/connections. CSS reads <html data-fx="lite"> and data-motion="off". */
function isLowEnd() {
  const nav = navigator as Navigator & { connection?: Connection; deviceMemory?: number }
  const c = nav.connection
  return Boolean(
    c?.saveData ||
      (c?.effectiveType && /(^|-)(2g|3g)$/.test(c.effectiveType)) ||
      (nav.deviceMemory !== undefined && nav.deviceMemory < 4) ||
      (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency < 4),
  )
}

function readPref(): 'on' | 'off' {
  try {
    return localStorage.getItem(KEY) === 'off' ? 'off' : 'on'
  } catch {
    return 'on'
  }
}

const subscribe = (onChange: () => void) => {
  window.addEventListener(KEY, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(KEY, onChange)
    window.removeEventListener('storage', onChange)
  }
}

/** Footer switch: "Stop animations" (WCAG 2.2.2 / 2.3.3). Also applies the low-end check once per visit. */
export function MotionToggle({ stopLabel, startLabel }: { stopLabel: string; startLabel: string }) {
  const motion = useSyncExternalStore(subscribe, readPref, () => 'on' as const)

  useEffect(() => {
    if (isLowEnd()) document.documentElement.dataset.fx = 'lite'
  }, [])
  useEffect(() => {
    document.documentElement.dataset.motion = motion
  }, [motion])

  const toggle = () => {
    try {
      localStorage.setItem(KEY, motion === 'on' ? 'off' : 'on')
    } catch {
      // Private mode: nothing to remember; the switch stays as it is.
    }
    window.dispatchEvent(new Event(KEY))
  }

  const Icon = motion === 'on' ? Pause : Play
  return (
    <button type="button" onClick={toggle} aria-pressed={motion === 'off'} className="inline-flex min-h-11 items-center gap-2 text-paper/85 underline underline-offset-4 hover:text-paper">
      <Icon aria-hidden="true" className="size-5" />
      {motion === 'on' ? stopLabel : startLabel}
    </button>
  )
}
