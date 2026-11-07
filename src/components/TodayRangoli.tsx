'use client'

import { Share2 } from 'lucide-react'
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { localToday } from '@/lib/dates'
import { rangoliToday, type Festival } from '@/lib/rangoli'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { RangoliArt } from './RangoliArt'

// Today's rangoli in the everyday hero plate. The design depends on the visitor's own date, which the server cannot know (and a page cached
// for a day would show yesterday's). So the server sends the stable plate (the photo or drawn stand-in), and the browser draws today's
// rangoli over it after hydration: useSyncExternalStore gives "" on the server and during hydration, then the local date. No mismatch, no layout shift.

const subscribe = () => () => {}
/** The visitor's local date (YYYY-MM-DD), "" until the browser has taken over. */
const useToday = () => useSyncExternalStore(subscribe, () => localToday(), () => '')

/** The art, drawn over `children` (the server's plate). Renders just the children until the date is known. */
export function TodayRangoli({ festivals, children }: { festivals: Festival[]; children?: ReactNode }) {
  const today = useToday()
  if (!today) return children
  const { rangoli: r } = rangoliToday(today, festivals)
  return (
    <>
      {children}
      <div className="rgw" aria-hidden="true">
        <RangoliArt rangoli={r} />
      </div>
    </>
  )
}

/** "Today's rangoli · 6 Nov · Diwali" with a share button (the phone's share sheet, or the text copied). Nothing until the date is known. */
export function TodayCaption({ festivals, locale, t }: { festivals: Festival[]; locale: Locale; t: Dictionary['home']['today'] }) {
  const today = useToday()
  const [copied, setCopied] = useState<'ok' | 'failed' | null>(null)
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
      setCopied('ok')
    } catch {
      setCopied('failed') // No share sheet and no clipboard: say so, so the visitor can copy it by hand.
    }
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(null), 4000)
  }

  return (
    <div className="tcap">
      <span role="status">{copied === 'ok' ? `✓ ${t.copied}` : copied === 'failed' ? t.copyFailed : caption}</span>
      <button type="button" onClick={share} aria-label={t.share}>
        <Share2 aria-hidden="true" width={20} height={20} />
      </button>
    </div>
  )
}
