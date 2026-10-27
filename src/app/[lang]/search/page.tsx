import { MessageCircle, Search } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { UnfinishedKolam } from '@/components/EmptyState'
import { MediaImage } from '@/components/MediaImage'
import { PageHero } from '@/components/PageHero'
import { ShopGrid } from '@/components/ShopGrid'
import { alternates, localePath, type Locale } from '@/i18n/config'
import { getDictionary, getLocale, type Dictionary } from '@/i18n/dictionaries'
import { cleanQuery, MAX_QUERY, searchById } from '@/lib/search'
import { whatsappLink } from '@/lib/site'
import { festivalLook, getGallery, getFestivals, getProducts, toGalleryItem, toShopItem } from '@/server/content'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.searchPage.metaTitle, robots: { index: false, follow: true }, alternates: alternates(await getLocale(), '/search') }
}

/** Plain GET form: works without JavaScript. */
function SearchForm({ locale, t, q = '' }: { locale: Locale; t: Dictionary['searchPage']; q?: string }) {
  return (
    <form role="search" action={localePath(locale, '/search')} className="grid gap-3 sm:flex">
      <label htmlFor="q" className="sr-only">
        {t.label}
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={q}
        maxLength={MAX_QUERY}
        placeholder={t.placeholder}
        className="h-14 w-full min-w-0 rounded-ui border border-border bg-surface px-4 text-h3-sm sm:flex-1"
      />
      <button type="submit" className="press inline-flex h-14 items-center justify-center gap-2 rounded-ui border-[1.5px] border-charcoal px-6 font-semibold hover:bg-charcoal hover:text-paper">
        <Search aria-hidden="true" className="size-5" />
        {t.button}
      </button>
    </form>
  )
}

const name = (rel: unknown) => (rel && typeof rel === 'object' && 'name' in rel ? String((rel as { name: unknown }).name) : undefined)

async function Results({ searchParams, locale, t }: { searchParams: Promise<Record<string, string | string[] | undefined>>; locale: Locale; t: Dictionary }) {
  const s = t.searchPage
  const q = cleanQuery((await searchParams).q)
  const suggestions = (
    <div className="grid gap-3">
      <p className="font-semibold">{s.try}</p>
      <ul className="flex flex-wrap gap-2">
        {s.suggestions.map((word) => (
          <li key={word}>
            <Link
              href={`${localePath(locale, '/search')}?q=${encodeURIComponent(word)}`}
              className="inline-flex min-h-12 items-center rounded-full border-[1.5px] border-charcoal px-5 hover:bg-charcoal hover:text-paper"
            >
              {word}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
  if (!q)
    return (
      <>
        <SearchForm locale={locale} t={s} />
        {suggestions}
      </>
    )

  // The visitor's language plus English, so "peacock" also finds मोर. All reads are cached.
  const [products, productsEn, artworks, artworksEn, festivals, festivalsEn] = await Promise.all([
    getProducts(locale),
    getProducts('en'),
    getGallery(locale),
    getGallery('en'),
    getFestivals(locale),
    getFestivals('en'),
  ])
  const shop = searchById(q, products, productsEn, (p) => [p.title, p.slug, name(p.category), name(p.medium), name(p.festival)]).map((p) => toShopItem(p, locale))
  const art = searchById(q, artworks, artworksEn, (a) => [a.title, a.slug, name(a.category), name(a.medium), name(a.festival)]).map((a) => toGalleryItem(a, locale))
  const fests = searchById(q, festivals, festivalsEn, (f) => [f.name, f.slug])
  const total = shop.length + art.length + fests.length

  return (
    <>
      <SearchForm locale={locale} t={s} q={q} />
      <div aria-live="polite" className="grid gap-1">
        <h2 className="font-heading text-h2">{s.results.replace('{q}', q)}</h2>
        <p className="text-muted">{s.found.replace('{n}', String(total))}</p>
      </div>

      {total === 0 ? (
        <div className="grid gap-6 rounded-ui bg-surface p-6 shadow-frame lg:p-8">
          <UnfinishedKolam />
          <p className="font-heading text-h3">{s.none.replace('{q}', q)}</p>
          {suggestions}
          <a
            href={whatsappLink(`${t.whatsapp.message} (${q})`)}
            target="_blank"
            rel="noopener noreferrer"
            className="ink-link inline-flex min-h-11 items-center gap-2 justify-self-start font-semibold text-leaf"
          >
            <MessageCircle aria-hidden="true" className="size-5" />
            {s.whatsapp}
          </a>
        </div>
      ) : (
        <>
          {fests.length > 0 && (
            <section className="grid gap-4">
              <h3 className="font-heading text-h2">
                {s.festivals} <span className="text-muted">({fests.length})</span>
              </h3>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {fests.map((f) => (
                  <li key={f.id}>
                    <Link
                      href={localePath(locale, `/festivals/${f.slug}`)}
                      className={`card flex min-h-20 items-center rounded-ui p-5 font-heading text-h3 text-paper grain-dark ${festivalLook(f.slug).floor}`}
                    >
                      {f.name} →
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {shop.length > 0 && (
            <section className="grid gap-4">
              <h3 className="font-heading text-h2">
                {s.shop} <span className="text-muted">({shop.length})</span>
              </h3>
              <ShopGrid items={shop} t={t.shop} controls={false} />
            </section>
          )}
          {art.length > 0 && (
            <section className="grid gap-4">
              <h3 className="font-heading text-h2">
                {s.artwork} <span className="text-muted">({art.length})</span>
              </h3>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-x-8">
                {art.map((a) => (
                  <li key={a.id}>
                    <Link href={a.productHref ?? localePath(locale, '/artwork')} className="card grid gap-3">
                      <span className="block bg-surface p-2 shadow-frame">
                        <MediaImage media={a.image} alt={a.title} ratio="4/5" seed={a.seed} medium={a.medium} floor={a.floor} sizes="(min-width: 1024px) 25vw, 50vw" />
                      </span>
                      <span className="font-heading text-h3-sm">{a.title}</span>
                      <span className="font-semibold text-peacock">{a.productHref ? t.gallery.buy : s.seeArtwork} →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  )
}

export default async function SearchPage({ searchParams }: PageProps<'/[lang]/search'>) {
  const locale = await getLocale()
  const t = await getDictionary()
  return (
    <>
      <PageHero title={t.searchPage.title} word="शोध" />
      <section className="bg-paper pb-20 lg:pb-28">
        <div className="wrap grid gap-10">
          {/* The query is only known per request: the page shell around it stays static. */}
          <Suspense fallback={<SearchForm locale={locale} t={t.searchPage} />}>
            <Results searchParams={searchParams} locale={locale} t={t} />
          </Suspense>
        </div>
      </section>
    </>
  )
}
