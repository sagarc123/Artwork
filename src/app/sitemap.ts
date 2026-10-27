import type { MetadataRoute } from 'next'
import { localePath, locales } from '@/i18n/config'
import { site } from '@/lib/site'
import { getCategories, getSlugs } from '@/server/content'

// Built pages only: no cart, checkout, order, track, search or wishlist (private or empty to Google), no "coming soon" pages.
const PAGES = ['/', '/shop', '/artwork', '/festivals', '/events', '/custom-portraits', '/about', '/contact', '/help', '/policies/shipping', '/policies/returns', '/policies/privacy', '/policies/terms']
const HREFLANG = { en: 'en-IN', mr: 'mr-IN', hi: 'hi-IN' } as const

/** Every public page in English, Marathi and Hindi, each listing its other languages (hreflang). Content reads are cached. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, festivals, categories] = await Promise.all([getSlugs('products'), getSlugs('festivals'), getCategories('en', 'shop')])
  const real = (slugs: string[]) => slugs.filter((s) => s !== '_') // getSlugs' stand-in for "none yet"
  const paths = [
    ...PAGES,
    ...categories.map((c) => `/shop/${c.slug}`),
    ...real(products).map((s) => `/shop/p/${s}`),
    ...real(festivals).map((s) => `/festivals/${s}`),
  ]
  const url = (locale: (typeof locales)[number], path: string) => new URL(localePath(locale, path), site.url).toString()
  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: url(locale, path),
      alternates: { languages: { ...Object.fromEntries(locales.map((l) => [HREFLANG[l], url(l, path)])), 'x-default': url('en', path) } },
    })),
  )
}
