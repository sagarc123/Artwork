'use client'

import { Share2 } from 'lucide-react'
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { localToday } from '@/lib/dates'
import { rangoliToday, type Festival } from '@/lib/rangoli'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'

// Today's rangoli in the everyday hero plate. The design depends on the visitor's own date, which the server cannot know (and a page cached
// for a day would show yesterday's). So the server sends the stable plate (the photo or drawn stand-in), and the browser draws today's
// rangoli over it after hydration: useSyncExternalStore gives "" on the server and during hydration, then the local date. No mismatch, no layout shift.

const subscribe = () => () => {}
/** The visitor's local date (YYYY-MM-DD), "" until the browser has taken over. */
const useToday = () => useSyncExternalStore(subscribe, () => localToday(), () => '')

const idx = (i: number) => ({ '--i': i }) as CSSProperties

/** The art, drawn over `children` (the server's plate). Renders just the children until the date is known. */
export function TodayRangoli({ festivals, children }: { festivals: Festival[]; children?: ReactNode }) {
  const today = useToday()
  if (!today) return children
  const { rangoli: r } = rangoliToday(today, festivals)
  let f = 0
  return (
    <>
      {children}
      <div className="rgw" aria-hidden="true">
        <svg className="rg" viewBox="-100 -100 200 200" width="200" height="200" focusable="false" style={{ '--tm': 1.35 } as CSSProperties}>
          <g>
            {r.dots.map((d, i) => (
              <circle key={i} className="d" cx={d.x} cy={d.y} r={d.r} style={idx(i)} />
            ))}
          </g>
          <g className="gl">
            {r.lines.map((d, i) => (
              <path key={i} d={d} pathLength={1} />
            ))}
          </g>
          <g>
            {r.shapes.map((s, i) => (
              <g key={i} className="f" style={idx(f++)}>
                {s.kind === 'dot' && <circle r={s.r} fill={s.fill} />}
                {s.kind === 'petal' && <ellipse transform={`rotate(${s.angle.toFixed(1)}) translate(0,${-s.at})`} rx={s.rx} ry={s.ry} fill={s.fill} />}
                {s.kind === 'diya' && (
                  <g transform={`rotate(${s.angle.toFixed(1)}) translate(0,-92)`}>
                    <ellipse rx="5" ry="2.6" fill={s.fill} />
                    <path d="M0 -2.4 C3 -7 0 -9 0 -11 C-1 -8 -3 -6 0 -2.4Z" fill="#FFE7A8" />
                  </g>
                )}
              </g>
            ))}
          </g>
        </svg>
      </div>
    </>
  )
}

/** "Today's rangoli · 6 Nov · Diwali" with a share button (the phone's share sheet, or the text copied). Nothing until the date is known. */
export function TodayCaption({ festivals, locale, t }: { festivals: Festival[]; locale: Locale; t: Dictionary['home']['today'] }) {
  const today = useToday()
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  if (!today) return null
  const { festival } = rangoliToday(today, festivals)
  const [y, m, d] = today.split('-').map(Number)
  const date = new Date(y, m - 1, d).toLocaleDateString({ en: 'en-IN', mr: 'mr-IN', hi: 'hi-IN' }[locale], { day: 'numeric', month: 'short' })
  const caption = [t.label, date, festival].filter(Boolean).join(' · ')

  async function share() {
    const text = t.shareText.replace('{caption}', caption)
    const url = new URL(location.pathname, location.origin).toString()
    try {
      if (navigator.share) return await navigator.share({ title: text, text, url })
    } catch (e) {
      if ((e as Error).name === 'AbortError') return // closed the sheet
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1800)
    } catch {
      // No share sheet and no clipboard: nothing more to try.
    }
  }

  return (
    <div className="tcap">
      <span role="status">{copied ? `✓ ${t.copied}` : caption}</span>
      <button type="button" onClick={share} aria-label={t.share}>
        <Share2 aria-hidden="true" width={20} height={20} />
      </button>
    </div>
  )
}
