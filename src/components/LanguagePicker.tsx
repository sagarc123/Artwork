'use client'

import { Languages } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
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

/** One-time "Choose your language" screen on a visitor's first visit. */
export function FirstVisitLanguagePicker({ current }: { current: Locale }) {
  const ref = useRef<HTMLDialogElement>(null)
  const chosen = useRef(false)
  const switchTo = useSwitchLocale(current)

  useEffect(() => {
    if (!document.cookie.split('; ').some((c) => c.startsWith(`${LOCALE_COOKIE}=`))) ref.current?.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby="lang-title"
      // Closing without choosing (Esc) keeps the current language and doesn't ask again.
      onClose={() => chosen.current || rememberLocale(current)}
      className="m-auto w-[min(92vw,28rem)] rounded-sheet bg-surface p-6 text-charcoal shadow-lg backdrop:bg-charcoal/60"
    >
      <h2 id="lang-title" className="text-center font-heading text-h3">
        <span lang="en">Choose your language</span>
        <br />
        <span lang="mr">भाषा निवडा</span> · <span lang="hi">भाषा चुनें</span>
      </h2>
      <div className="mt-6 grid gap-3">
        {locales.map((l) => (
          <button
            key={l}
            type="button"
            lang={l}
            onClick={() => {
              chosen.current = true
              switchTo(l)
              ref.current?.close()
            }}
            className="h-14 rounded-ui border-[1.5px] border-charcoal text-h3 font-semibold hover:bg-charcoal hover:text-paper"
          >
            {localeNames[l]}
          </button>
        ))}
      </div>
    </dialog>
  )
}
