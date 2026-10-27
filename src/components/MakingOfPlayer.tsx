'use client'

import { Pause, Play, RotateCcw } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { canAutoplay } from '@/lib/motion'

type State = 'idle' | 'playing' | 'paused' | 'done'
type Connection = { saveData?: boolean; effectiveType?: string }

type Props = {
  /** The owner's time-lapse, or null: then `children` (the drawn stand-in) plays instead. */
  video: { src: string; type: string } | null
  poster: string | null
  /** id of the caption describing the video. */
  describedBy: string
  labels: { play: string; pause: string; replay: string }
  /** Under the button, next to it (e.g. "Video coming soon"). */
  note?: ReactNode
  children: ReactNode
}

/**
 * Making-of player. Muted, inline, nothing loaded until played. It starts by itself once, when mostly in view, only on a
 * capable device with motion on (lib/motion canAutoplay); it stops on the last frame (no loop) and pauses when scrolled
 * away. The button always says what it does. The stand-in is CSS animation run by the same states (globals.css .mo).
 */
export function MakingOfPlayer({ video, poster, describedBy, labels, note, children }: Props) {
  const [state, setState] = useState<State>('idle')
  const [run, setRun] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const vid = useRef<HTMLVideoElement>(null)
  const playing = useRef(false)
  useEffect(() => {
    playing.current = state === 'playing'
  }, [state])

  const play = (fromStart = false) => {
    const v = vid.current
    if (v) {
      if (fromStart) v.currentTime = 0
      // Blocked (power saver, browser rules): stays as it was; the button still works on a tap.
      v.play().catch(() => {})
      return
    }
    if (fromStart) setRun((r) => r + 1)
    setState('playing')
  }
  const pause = () => (vid.current ? vid.current.pause() : setState((s) => (s === 'playing' ? 'paused' : s)))

  useEffect(() => {
    const el = box.current
    if (!el) return
    let tried = false
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !tried) {
          tried = true
          const d = document.documentElement.dataset
          const c = (navigator as Navigator & { connection?: Connection }).connection
          if (canAutoplay({ reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches, motion: d.motion, fx: d.fx, saveData: c?.saveData, effectiveType: c?.effectiveType })) play()
        } else if (!e.isIntersecting && playing.current) pause()
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const [Icon, label, onClick] =
    state === 'playing' ? [Pause, labels.pause, pause] : state === 'done' ? [RotateCcw, labels.replay, () => play(true)] : [Play, labels.play, () => play()]

  return (
    <div className="grid gap-3">
      <div
        ref={box}
        data-state={state}
        className="mo relative aspect-[4/5] overflow-hidden bg-charcoal sm:aspect-[4/3]"
        onAnimationEnd={(e) => (e.target as Element).classList.contains('mo-end') && setState('done')}
      >
        {video ? (
          <>
            <video
              ref={vid}
              muted
              playsInline
              preload="none"
              aria-describedby={describedBy}
              className="absolute inset-0 size-full object-contain"
              onPlay={() => setState('playing')}
              onPause={(e) => !e.currentTarget.ended && setState('paused')}
              onEnded={() => setState('done')}
            >
              <source src={video.src} type={video.type} />
            </video>
            {/* Cover until the first play: the owner's photo (lazy, sized by next/image), else the drawn stand-in at rest. */}
            {state === 'idle' && (poster ? <Image src={poster} alt="" fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" /> : children)}
          </>
        ) : (
          <div key={run} className="absolute inset-0">
            {children}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <button
          type="button"
          onClick={onClick}
          className={`press inline-flex min-h-12 items-center gap-2 rounded-ui border-[1.5px] border-charcoal px-5 font-semibold hover:bg-charcoal hover:text-paper ${video ? '' : 'mo-ctl'}`}
        >
          <Icon aria-hidden="true" className="size-5" />
          {label}
        </button>
        {note}
      </div>
    </div>
  )
}
