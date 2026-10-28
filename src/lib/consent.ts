// Cookie-consent rules, shared by the banner, the tracker loader, the server and the tests. Pure: no cookies, no DOM.

/** Bump when the cookie wording changes: everyone is asked again, and every record keeps the version it was given under. */
export const CONSENT_VERSION = '2026-10-v1'
export const CONSENT_COOKIE = 'sm_consent'
export const CONSENT_DAYS = 180

export type Consent = { analytics: boolean; marketing: boolean }
/** Nothing optional is allowed until the visitor says so. */
export const DENIED: Consent = { analytics: false, marketing: false }

/** "2026-10-v1:a1m0": the notice version, then analytics and marketing as 1 or 0. */
export const serializeConsent = (c: Consent) => `${CONSENT_VERSION}:a${c.analytics ? 1 : 0}m${c.marketing ? 1 : 0}`

/** The saved choice, or null when there is none (or it was made under older wording): then the banner asks again. */
export function parseConsent(raw: string | null | undefined): Consent | null {
  const m = /^([\w-]{1,20}):a([01])m([01])$/.exec(raw ?? '')
  return m && m[1] === CONSENT_VERSION ? { analytics: m[2] === '1', marketing: m[3] === '1' } : null
}

/** What may run right now: the saved choice, or nothing. */
export const effectiveConsent = (raw: string | null | undefined): Consent => parseConsent(raw) ?? DENIED

// Set by the owner in the host's settings (see .env.example). Checked for shape, because they end up in a script address.
export const GA_ID = /^G-[A-Z0-9]{4,15}$/.test(process.env.NEXT_PUBLIC_GA_ID ?? '') ? process.env.NEXT_PUBLIC_GA_ID! : ''
export const META_ID = /^\d{5,20}$/.test(process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '') ? process.env.NEXT_PUBLIC_META_PIXEL_ID! : ''

export type Page = { under18Page?: boolean; under18Account?: boolean }

/**
 * The one rule for trackers and the banner. Never on under-18 learners' pages (kids and teen courses, their sample
 * lessons, the account of someone with such a seat: the page says so with `under18Page` / `under18Account`) and never
 * in the lesson player at all (a player does not know the learner's age). Consent cannot override this.
 */
export function trackingAllowed(path: string, flags: Page = {}): boolean {
  if (flags.under18Page || flags.under18Account) return false
  const p = path.replace(/^\/(mr|hi)(?=\/|$)/, '') || '/'
  return !/^\/learn(\/|$)/.test(p)
}

/** Which optional things this site has at all (set by the owner's env vars). Without any, there is nothing to ask about. */
export type Configured = { analytics: boolean; marketing: boolean }
export const hasOptional = (c: Configured) => c.analytics || c.marketing

/** Show the banner: something to ask about, no saved choice yet, and not on a page where tracking is never allowed. */
export const bannerNeeded = (c: Configured, saved: Consent | null, path: string, flags: Page = {}) => hasOptional(c) && saved === null && trackingAllowed(path, flags)
