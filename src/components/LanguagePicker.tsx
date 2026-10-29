'use client'

import { Languages } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { LOCALE_COOKIE, LOCALE_STORE, localeNames, localePath, locales, offerLanguageChoice, stripLocale, type Locale } from '@/i18n/config'
import { BrandMark } from './Art'

function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`
  try {
    localStorage.setItem(LOCALE_STORE, locale)
  } catch {} // storage blocked: the cookie still remembers
}

function useSwitchLocale(current: Locale) {
  const pathname = usePathname()
  return (target: Locale) => {
    rememberLocale(target)
    // Full navigation: the proxy and <html lang> both depend on the locale.
    if (target !== current) window.location.assign(localePath(target, stripLocale(pathname)) + location.search + location.hash)
  }
}

/** Compact switcher for the header, menu drawer and footer. */
export function LanguageSwitcher({ current, label }: { current: Locale; label: string }) {
  const switchTo = useSwitchLocale(current)
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1">
      <Languages aria-hidden="true" className="mr-1 size-5 text-muted" />
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={l === current}
          onClick={() => switchTo(l)}
          className="min-h-11 min-w-11 rounded-ui px-3 text-charcoal hover:bg-charcoal/5 aria-pressed:bg-charcoal aria-pressed:text-paper"
        >
          {localeNames[l]}
        </button>
      ))}
    </div>
  )
}

/** Phones and tablets: a slim top row of plain links, the same three languages as the desktop bar. */
export function LanguageLinks({ current, label }: { current: Locale; label: string }) {
  const switchTo = useSwitchLocale(current)
  return (
    <div role="group" aria-label={label} className="flex items-center justify-end gap-x-1 text-[1rem]">
      {locales.map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden="true" className="text-muted">·</span>}
          <button
            type="button"
            lang={l}
            aria-current={l === current ? 'true' : undefined}
            onClick={() => switchTo(l)}
            className="min-h-11 min-w-11 px-2 text-charcoal aria-[current=true]:font-bold aria-[current=true]:underline aria-[current=true]:underline-offset-4"
          >
            {localeNames[l]}
          </button>
        </span>
      ))}
    </div>
  )
}

type Labels = { label: string; close: string; choices: Record<Locale, string> }

/**
 * One-time full-screen language choice on a first visit. Not in the server HTML: it mounts after the page has loaded
 * (so it never delays the first paint or shifts the layout), and never for crawlers. Choosing or closing it is remembered.
 * Native <dialog>: focus stays inside, Esc closes it.
 */
export function LanguageChooser({ current, labels }: { current: Locale; labels: Labels }) {
  const ref = useRef<HTMLDialogElement>(null)
  const switchTo = useSwitchLocale(current)
  const [show, setShow] = useState(false)
  const returnTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    let stored: string | null = null
    try {
      stored = localStorage.getItem(LOCALE_STORE)
    } catch {}
    if (!offerLanguageChoice(document.cookie, stored, navigator.userAgent)) return
    const open = () => setShow(true)
    if (document.readyState === 'complete') open()
    else window.addEventListener('load', open, { once: true })
    return () => window.removeEventListener('load', open)
  }, [])

  useEffect(() => {
    if (!show) return
    returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    ref.current?.showModal()
    // The page's language (from the browser's preference) is the one ready to confirm.
    ref.current?.querySelector<HTMLButtonElement>(`button[lang="${current}"]`)?.focus()
  }, [show, current])

  if (!show) return null
  return (
    <dialog
      ref={ref}
      aria-labelledby="lang-title"
      // Esc or "Not now" keeps the current language.
      onClose={() => {
        rememberLocale(current)
        // Focus goes back to where it was (or the page's main area), never to the bare body.
        const back = returnTo.current?.isConnected && returnTo.current !== document.body ? returnTo.current : document.getElementById('main')
        back?.focus()
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-paper p-0 text-charcoal"
    >
      <div className="grain flex min-h-full flex-col">
        <div aria-hidden="true" className="paithani" />
        <div className="mx-auto grid w-full max-w-md flex-1 content-center gap-8 px-5 py-10">
          <BrandMark thali animate={false} className="size-14 justify-self-center" />
          <h2 id="lang-title" className="text-center font-heading text-h2">
            {/* The label is the same line in Marathi, Hindi and English. */}
            {labels.label.split(' · ').map((part, i) => (
              <span key={part} lang={(['mr', 'hi', 'en'] as const)[i]} className="block">
                {part}
              </span>
            ))}
          </h2>
          <ul className="grid gap-3">
            {(['mr', 'hi', 'en'] as const).map((l) => (
              <li key={l}>
                <button
                  type="button"
                  lang={l}
                  aria-current={l === current ? 'true' : undefined}
                  onClick={() => {
                    switchTo(l)
                    if (l === current) ref.current?.close()
                  }}
                  className="press grid min-h-18 w-full content-center rounded-ui border-[1.5px] border-charcoal bg-surface px-6 py-3 text-left hover:bg-charcoal hover:text-paper aria-[current=true]:bg-charcoal aria-[current=true]:text-paper"
                >
                  <span className="font-heading text-h3">{localeNames[l]}</span>
                  <span>{labels.choices[l]}</span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => ref.current?.close()} className="min-h-11 justify-self-center px-4 font-semibold text-peacock underline underline-offset-4">
            {labels.close}
          </button>
        </div>
      </div>
    </dialog>
  )
}
