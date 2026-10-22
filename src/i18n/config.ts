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
  | { action: 'redirect'; to: string }
  | { action: 'rewrite'; to: string }

/**
 * Decides what the proxy does with an incoming page path.
 * - `/en/...` is never public: redirect to the unprefixed URL.
 * - `/mr/...`, `/hi/...` pass through.
 * - Unprefixed paths serve English, unless the visitor chose Marathi/Hindi before.
 */
export function resolveLocaleRoute(pathname: string, cookieLocale?: string): LocaleRoute {
  const first = pathname.split('/')[1]
  if (first === defaultLocale) return { action: 'redirect', to: stripLocale(pathname) }
  if (isLocale(first)) return { action: 'next' }
  if (isLocale(cookieLocale) && cookieLocale !== defaultLocale) {
    return { action: 'redirect', to: localePath(cookieLocale, pathname) }
  }
  return { action: 'rewrite', to: pathname === '/' ? '/en' : `/en${pathname}` }
}
