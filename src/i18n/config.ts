// Shared by proxy (edge) and server code, so no server-only imports here.

export const locales = ['en', 'mr', 'hi'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'
export const LOCALE_COOKIE = 'lang'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  mr: 'मराठी',
  hi: 'हिंदी',
}

export const isLocale = (value: string | undefined): value is Locale =>
  !!value && (locales as readonly string[]).includes(value)

/** English lives at the root (`/shop`); Marathi and Hindi are prefixed (`/mr/shop`). */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  if (locale === defaultLocale) return clean
  return clean === '/' ? `/${locale}` : `/${locale}${clean}`
}

/** Canonical URL plus hreflang links for a page, for `generateMetadata`. */
export function alternates(locale: Locale, path: string) {
  return {
    canonical: localePath(locale, path),
    languages: {
      'en-IN': localePath('en', path),
      'mr-IN': localePath('mr', path),
      'hi-IN': localePath('hi', path),
      'x-default': localePath('en', path),
    },
  }
}

/** Strips any locale prefix: `/mr/shop` -> `/shop`, `/en` -> `/`. */
export function stripLocale(pathname: string): string {
  const first = pathname.split('/')[1]
  if (!isLocale(first)) return pathname || '/'
  return pathname.slice(first.length + 1) || '/'
}

export type LocaleRoute =
  | { action: 'next' }
  | { action: 'redirect'; to: string; remember?: Locale }
  | { action: 'rewrite'; to: string }

/** The visitor's best language from the browser's Accept-Language header (`mr-IN,mr;q=0.9,en;q=0.8`). */
export function preferredLocale(header: string | null | undefined): Locale {
  const ranked = (header ?? '')
    .split(',')
    .map((part, i) => {
      const [tag, ...params] = part.trim().toLowerCase().split(';')
      const q = Number(params.find((p) => p.trim().startsWith('q='))?.split('=')[1] ?? 1)
      return { lang: tag.split('-')[0], q: Number.isFinite(q) ? q : 0, i }
    })
    .filter((x) => x.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i)
  return ranked.map((x) => x.lang).find(isLocale) ?? defaultLocale
}

/**
 * Decides what the proxy does with an incoming page path.
 * - `/en/...` is never public: redirect to the unprefixed URL.
 * - `/mr/...`, `/hi/...` pass through.
 * - Unprefixed paths serve English, unless the visitor chose Marathi/Hindi before,
 *   or (first visit, no choice yet) their browser prefers Marathi/Hindi: then they go there and it is remembered.
 */
export function resolveLocaleRoute(pathname: string, cookieLocale?: string, acceptLanguage?: string | null): LocaleRoute {
  const first = pathname.split('/')[1]
  if (first === defaultLocale) return { action: 'redirect', to: stripLocale(pathname) }
  if (isLocale(first)) return { action: 'next' }
  if (isLocale(cookieLocale) && cookieLocale !== defaultLocale) {
    return { action: 'redirect', to: localePath(cookieLocale, pathname) }
  }
  const browser = isLocale(cookieLocale) ? defaultLocale : preferredLocale(acceptLanguage)
  if (browser !== defaultLocale) return { action: 'redirect', to: localePath(browser, pathname), remember: browser }
  return { action: 'rewrite', to: pathname === '/' ? '/en' : `/en${pathname}` }
}

/** localStorage key for the first-visit language choice (the cookie can be cleared or blocked on its own). */
export const LOCALE_STORE = 'lang-chosen'

/**
 * Whether to show the one-time language chooser: no choice in the cookie or this browser yet, and not a crawler.
 * A browser that prefers Marathi/Hindi already got its language from the proxy (which sets the cookie), so it never sees it.
 */
export function offerLanguageChoice(cookie: string, stored: string | null, userAgent = ''): boolean {
  if (isLocale(stored ?? undefined)) return false
  if (cookie.split(/;\s*/).some((c) => c.startsWith(`${LOCALE_COOKIE}=`) && isLocale(c.slice(LOCALE_COOKIE.length + 1)))) return false
  return !/bot|crawl|spider|slurp|lighthouse|headlesschrome|preview/i.test(userAgent)
}
