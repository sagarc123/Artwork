'use client'

import { Pause, Play } from 'lucide-react'
import { useEffect, useSyncExternalStore } from 'react'

const KEY = 'motion'

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

/** Footer switch: "Stop animations" (WCAG 2.2.2 / 2.3.3). CSS reads <html data-motion="off">; the slow-phone data-fx="lite" is set by the head script in layout.tsx. */
export function MotionToggle({ stopLabel, startLabel }: { stopLabel: string; startLabel: string }) {
  const motion = useSyncExternalStore(subscribe, readPref, () => 'on' as const)

  useEffect(() => {
    const root = document.documentElement
    if (root.dataset.motion !== motion) root.dataset.motion = motion
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
    <button type="button" onClick={toggle} className="inline-flex min-h-11 items-center gap-2 text-paper/85 underline underline-offset-4 hover:text-paper">
      <Icon aria-hidden="true" className="size-5" />
      {motion === 'on' ? stopLabel : startLabel}
    </button>
  )
}
