'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { Dictionary } from '@/i18n/dictionaries'
import { bannerNeeded, CONSENT_COOKIE, CONSENT_DAYS, parseConsent, serializeConsent, type Configured, type Consent } from '@/lib/consent'
import { recordConsent } from '@/server/consent-actions'

export const OPEN_EVENT = 'open-cookie-settings'
export const CHANGE_EVENT = 'consent-change'

const readCookie = () => document.cookie.split('; ').find((c) => c.startsWith(`${CONSENT_COOKIE}=`))?.split('=')[1]
const subscribe = (cb: () => void) => {
  window.addEventListener(CHANGE_EVENT, cb)
  return () => window.removeEventListener(CHANGE_EVENT, cb)
}

const btn = 'press inline-flex h-12 min-w-28 items-center justify-center rounded-ui border-[1.5px] border-charcoal px-6 font-semibold hover:bg-charcoal/5'

/**
 * The cookie notice. It sits at the very top of the page (in the flow, so it never covers the bottom tab bar or the buy
 * bar), has equal Accept and Reject buttons, and "Choose" for one switch per purpose. Nothing optional runs until a yes.
 * Not a dialog: focus is never trapped, and Escape closes it (nothing is saved, so everything stays off). "Cookie settings"
 * in the footer opens it again as a card at the top of the screen.
 */
export function CookieBanner({ configured, t }: { configured: Configured; t: Dictionary['cookies'] }) {
  const path = usePathname()
  // null while rendering on the server (and the first client paint): the cookie is only read in the browser.
  const raw = useSyncExternalStore(subscribe, () => readCookie() ?? '', () => null)
  const mounted = raw !== null
  const saved = parseConsent(raw)
  const [hidden, setHidden] = useState(false)
  const [reopened, setReopened] = useState(false)
  const [panel, setPanel] = useState(false)
  const [pick, setPick] = useState<Consent>({ analytics: false, marketing: false })
  const opener = useRef<HTMLElement | null>(null)
  const box = useRef<HTMLDivElement>(null)

  function close() {
    setHidden(true)
    setReopened(false)
    setPanel(false)
    opener.current?.focus()
  }
  // "Cookie settings" in the footer: opens the choices again, as a card at the top of the screen.
  useEffect(() => {
    const open = () => {
      opener.current = document.activeElement as HTMLElement | null
      setPick(parseConsent(readCookie()) ?? { analytics: false, marketing: false })
      setReopened(true)
      setPanel(true)
      setHidden(false)
      requestAnimationFrame(() => box.current?.focus())
    }
    window.addEventListener(OPEN_EVENT, open)
    return () => window.removeEventListener(OPEN_EVENT, open)
  }, [])

  function save(c: Consent) {
    const clean: Consent = { analytics: configured.analytics && c.analytics, marketing: configured.marketing && c.marketing }
    document.cookie = `${CONSENT_COOKIE}=${serializeConsent(clean)}; Path=/; Max-Age=${CONSENT_DAYS * 86400}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
    void recordConsent(clean).catch(() => {}) // the record is for our files; the choice already works without it
    close()
  }

  const visible = mounted && !hidden && (reopened || bannerNeeded(configured, saved, path))
  if (!visible) return null
  const all = { analytics: configured.analytics, marketing: configured.marketing }
  return (
    <div
      ref={box}
      role="region"
      aria-label={t.region}
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && close()}
      className={`cookie-banner border-b border-border/30 bg-surface text-charcoal outline-none ${reopened ? 'fixed inset-x-0 top-0 z-50 max-h-dvh overflow-y-auto shadow-frame' : ''}`}
    >
      <div className="wrap grid gap-4 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="grid gap-1">
          <p className="font-semibold">{t.title}</p>
          <p className="max-w-[70ch]">{t.body}</p>
        </div>
        {!reopened && (
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={btn} onClick={() => save(all)}>
              {t.accept}
            </button>
            <button type="button" className={btn} onClick={() => save({ analytics: false, marketing: false })}>
              {t.reject}
            </button>
            <button type="button" aria-expanded={panel} aria-controls="cookie-panel" className="ink-link inline-flex min-h-12 items-center px-2 font-semibold text-peacock" onClick={() => setPanel((p) => !p)}>
              {t.choose}
            </button>
          </div>
        )}
      </div>
      {panel && (
        <form
          id="cookie-panel"
          onSubmit={(e) => {
            e.preventDefault()
            save(pick)
          }}
          className="wrap grid gap-4 border-t border-border/20 py-4"
        >
          <p className="font-semibold">{t.panelTitle}</p>
          <p className="max-w-[70ch] text-muted">{t.panelBody}</p>
          {(
            [
              ['analytics', t.analytics, t.analyticsNote],
              ['marketing', t.marketing, t.marketingNote],
            ] as const
          )
            .filter(([k]) => configured[k])
            .map(([k, label, note]) => (
              <label key={k} className="flex min-h-12 max-w-2xl items-start gap-3">
                <input type="checkbox" checked={pick[k]} onChange={(e) => setPick({ ...pick, [k]: e.target.checked })} className="mt-1 size-6 shrink-0 accent-leaf" />
                <span>
                  <span className="font-semibold">{label}</span>
                  <span className="block text-muted">{note}</span>
                </span>
              </label>
            ))}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="press h-12 rounded-ui bg-charcoal px-6 font-semibold text-paper">
              {t.save}
            </button>
            {reopened && (
              <button type="button" className={btn} onClick={close}>
                {t.close}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}

/** The footer link that opens the cookie choices again. */
export function CookieSettingsLink({ label }: { label: string }) {
  return (
    <button type="button" className="cookie-settings-link footer-link inline-flex min-h-11 items-center" onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>
      {label}
    </button>
  )
}
