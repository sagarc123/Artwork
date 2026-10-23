'use client'

import { Languages, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState, useSyncExternalStore } from 'react'
import { LOCALE_COOKIE, localeNames, localePath, locales, stripLocale, type Locale } from '@/i18n/config'

function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`
}

function useSwitchLocale(current: Locale) {
  const pathname = usePathname()
  return (target: Locale) => {
    rememberLocale(target)
    // Full navigation: the proxy and <html lang> both depend on the locale.
    if (target !== current) window.location.assign(localePath(target, stripLocale(pathname)) + location.search + location.hash)
  }
}

/** Compact switcher for the header, menu drawer and account page. */
export function LanguageSwitcher({ current, label }: { current: Locale; label: string }) {
  const switchTo = useSwitchLocale(current)
  return (
    <div role="group" aria-label={label} className="flex items-center gap-1">
      <Languages aria-hidden="true" className="mr-1 size-5 text-muted" />
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={l === current}
          onClick={() => switchTo(l)}
          className="min-h-11 rounded-ui px-3 text-charcoal hover:bg-charcoal/5 aria-pressed:bg-charcoal aria-pressed:text-paper"
        >
          {localeNames[l]}
        </button>
      ))}
    </div>
  )
}

const noop = () => () => {}
const hasChoice = () => document.cookie.split('; ').some((c) => c.startsWith(`${LOCALE_COOKIE}=`))

/** Slim, non-blocking strip on a first visit (no language chosen yet). Choosing or closing it is remembered. */
export function LanguageStrip({ current, label, close }: { current: Locale; label: string; close: string }) {
  // Hidden in the server HTML; shown after hydration only when no choice was made.
  const chosen = useSyncExternalStore(noop, hasChoice, () => true)
  const [closed, setClosed] = useState(false)
  const switchTo = useSwitchLocale(current)
  if (chosen || closed) return null

  return (
    <div role="region" aria-label={label} className="border-b border-border/25 bg-turmeric/25">
      <div className="wrap flex flex-wrap items-center gap-x-3 gap-y-1 py-1">
        <div className="flex flex-wrap items-center gap-1">
          {(['mr', 'hi', 'en'] as const).map((l) => (
            <button key={l} type="button" lang={l} aria-pressed={l === current} onClick={() => switchTo(l)} className="min-h-11 rounded-ui px-3 font-semibold underline-offset-4 hover:underline aria-pressed:bg-charcoal aria-pressed:text-paper">
              {localeNames[l]}
            </button>
          ))}
        </div>
        <span className="text-muted">{label}</span>
        <button
          type="button"
          onClick={() => {
            rememberLocale(current)
            setClosed(true)
          }}
          className="ml-auto grid min-h-11 min-w-11 place-items-center rounded-ui hover:bg-charcoal/5"
        >
          <X aria-hidden="true" className="size-5" />
          <span className="sr-only">{close}</span>
        </button>
      </div>
    </div>
  )
}
