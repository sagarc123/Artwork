'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { Dictionary } from '@/i18n/dictionaries'
import { rangoliFor, seedOfColours } from '@/lib/rangoli'
import { whatsappLink } from '@/lib/site'
import { RangoliArt } from './RangoliArt'
import { Thali } from './Thali'

// "Fill the thali": tap 3 of 6 powder colours, the powder flies onto an empty plate, and a rangoli in those colours draws itself
// (the same generator as today's rangoli). The result can be sent to Siddesh on WhatsApp, the colours named in the message.
// Real buttons throughout (aria-pressed chips), a status line that announces progress, and the plate fills at once under calm modes.

const COLOURS = [
  ['marigold', '#F2A20C'],
  ['kumkum', '#C8281E'],
  ['peacock', '#2FA3BD'],
  ['leaf', '#4FA04A'],
  ['rose', '#D9468F'],
  ['white', '#FFFFFF'],
] as const
type Key = (typeof COLOURS)[number][0]

/** 'none' under "Stop animations" and reduced motion, 'lite' on slow phones, else 'full'. */
function motionMode() {
  const d = document.documentElement.dataset
  return d.motion === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'none' : d.fx === 'lite' ? 'lite' : 'full'
}

/** Powder grains fly from the chip over to the plate (nodes on <body> remove themselves). */
function fly(from: DOMRect, to: DOMRect, colour: string, n: number) {
  const [x0, y0] = [from.left + from.width / 2, from.top + from.height / 2]
  const [x1, y1] = [to.left + to.width / 2, to.top + to.height / 2]
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i')
    const s = 4 + Math.random() * 5
    p.setAttribute('aria-hidden', 'true')
    p.style.cssText = `position:fixed;left:0;top:0;z-index:30;pointer-events:none;border-radius:50%;width:${s}px;height:${s}px;margin:${-s / 2}px 0 0 ${-s / 2}px;background:${colour}`
    document.body.append(p)
    const dx = (Math.random() - 0.5) * 50
    p.animate(
      [
        { transform: `translate(${x0}px,${y0}px)`, opacity: 1 },
        { transform: `translate(${(x0 + x1) / 2 + dx}px,${Math.min(y0, y1) - 40}px)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${x1 + dx * 0.4}px,${y1 + (Math.random() - 0.5) * 30}px)`, opacity: 0.1 },
      ],
      { duration: 650 + Math.random() * 250, delay: i * 30, easing: 'cubic-bezier(.4,0,.5,1)' },
    ).onfinish = () => p.remove()
  }
}

export function FillThali({ t }: { t: Dictionary['home']['fill'] }) {
  const [picked, setPicked] = useState<number[]>([])
  const [filled, setFilled] = useState(false)
  const plate = useRef<HTMLDivElement>(null)
  const first = useRef<HTMLButtonElement>(null)
  const label = useId()
  const names = picked.map((i) => t.colours[COLOURS[i][0] as Key])
  const ready = picked.length === 3

  // Three colours: the powder lands, then the rangoli draws (at once when motion is off).
  useEffect(() => {
    if (!ready) return
    const id = setTimeout(() => setFilled(true), motionMode() === 'none' ? 0 : 650)
    return () => clearTimeout(id)
  }, [ready, picked])

  const tap = (i: number, chip: HTMLElement) => {
    setFilled(false)
    if (picked.includes(i)) return setPicked(picked.filter((x) => x !== i))
    const mode = motionMode()
    if (mode !== 'none' && plate.current) fly(chip.getBoundingClientRect(), plate.current.getBoundingClientRect(), COLOURS[i][1], mode === 'lite' ? 3 : 9)
    setPicked([...picked, i].slice(-3))
  }

  const hex = picked.map((i) => COLOURS[i][1])
  const seed = seedOfColours(picked)
  const rangoli = ready && filled ? rangoliFor(seed, null, [hex[0], hex[1], hex[2], hex[seed % 3]]) : null
  const progress = ready ? t.ready.replace('{names}', names.join(', ')) : t.progress.replace('{n}', String(picked.length)).replace('{names}', names.join(', ')).replace(/:\s*$/, '')

  return (
    <div className="ws-fill rv">
      <div ref={plate} className="ws-fill-plate">
        <Thali category="rangoli" seed="fill-thali" n={20} width="100%">
          <div role="img" aria-label={ready ? names.join(', ') : t.plate} className="ws-fill-face">
            <svg viewBox="-100 -100 200 200" width="200" height="200" aria-hidden="true" focusable="false" className="ws-fill-empty" style={{ opacity: rangoli ? 0 : 1 }}>
              {[8, 16, 24].flatMap((n, r) => Array.from({ length: n }, (_, k) => ({ n, k, R: [28, 54, 80][r] }))).map(({ n, k, R }) => (
                <circle key={`${R}-${k}`} cx={(R * Math.sin((k / n) * 6.2832)).toFixed(1)} cy={(-R * Math.cos((k / n) * 6.2832)).toFixed(1)} r="1.6" fill="currentColor" opacity=".6" />
              ))}
              <circle r="9" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle r="3" fill="#C8281E" />
              {picked.map((ci, k) => (
                <circle key={ci} className="ws-slot" cx={(30 * Math.sin((k / 3) * 6.2832 + 0.4)).toFixed(1)} cy={(-30 * Math.cos((k / 3) * 6.2832 + 0.4)).toFixed(1)} r="7" fill={COLOURS[ci][1]} />
              ))}
            </svg>
            {rangoli && (
              <div className="ws-fill-art">
                <RangoliArt rangoli={rangoli} tm={0.9} />
              </div>
            )}
          </div>
        </Thali>
      </div>
      <div className="ws-fill-ctl">
        <h3 id={label} className="font-heading text-h2-sm">
          {t.title}
        </h3>
        <p className="ws-fill-hint">{t.hint}</p>
        <div role="group" aria-labelledby={label} className="ws-sws">
          {COLOURS.map(([key, swatch], i) => (
            <button key={key} ref={i === 0 ? first : undefined} type="button" aria-pressed={picked.includes(i)} onClick={(e) => tap(i, e.currentTarget)} className="ws-sw">
              <i style={{ background: swatch }} />
              <span>{t.colours[key]}</span>
            </button>
          ))}
        </div>
        <p role="status" className="ws-fill-prog">
          {picked.length ? progress : ''}
        </p>
        <div className="ws-fill-btns">
          {ready ? (
            <a href={whatsappLink(t.message.replace('{names}', names.join(', ')))} target="_blank" rel="noopener noreferrer" className="ws-wa">
              {t.send}
            </a>
          ) : (
            <button type="button" disabled className="ws-wa">
              {t.send}
            </button>
          )}
          <button
            type="button"
            className="ws-fill-again"
            onClick={() => {
              setPicked([])
              setFilled(false)
              first.current?.focus()
            }}
          >
            {t.again}
          </button>
        </div>
      </div>
    </div>
  )
}
