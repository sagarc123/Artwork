import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FestivalMotif, Threshold } from '@/components/Art'
import { ButtonLink } from '@/components/ButtonLink'
import { Breadcrumbs } from '@/components/JsonLd'
import { EmptyState } from '@/components/EmptyState'
import { Gallery } from '@/components/Gallery'
import { photoSrc } from '@/components/MediaImage'
import { PageHero } from '@/components/PageHero'
import { RemindMe } from '@/components/RemindMe'
import { ShareButton } from '@/components/ShareButton'
import { ShopGrid } from '@/components/ShopGrid'
import { alternates, localePath } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { festivalLook, getGallery, getFestivals, getProducts, getSlugs, toGalleryItem, toShopItem } from '@/server/content'

// Unknown slugs must wait for the full render so notFound() can still send a real 404 (not the streamed App Shell).
export const ensureStatic = 'navigation'
// Allowed to wait on navigation: unknown slugs must render fully so notFound() sends a real 404.
export const instant = false

export async function generateStaticParams() {
  return (await getSlugs('festivals')).map((slug) => ({ slug }))
}

const idOf = (rel: unknown) => (rel && typeof rel === 'object' ? (rel as { id: unknown }).id : rel)

async function load(params: PageProps<'/[lang]/festivals/[slug]'>['params']) {
  const { slug } = await params
  const locale = await getLocale()
  const festival = (await getFestivals(locale)).find((f) => f.slug === slug)
  if (!festival) notFound()
  return { festival, locale }
}

export async function generateMetadata({ params }: PageProps<'/[lang]/festivals/[slug]'>): Promise<Metadata> {
  const { festival, locale } = await load(params)
  const t = await getDictionary()
  return { title: festival.name, description: (festival.intro?.trim().length ?? 0) > 20 ? festival.intro! : t.festivalsPage.metaDesc, alternates: alternates(locale, `/festivals/${festival.slug}`) }
}

export default async function FestivalPage({ params }: PageProps<'/[lang]/festivals/[slug]'>) {
  const { festival, locale } = await load(params)
  const t = await getDictionary()
  const look = festivalLook(festival.slug)
  const [artworks, products] = await Promise.all([getGallery(locale), getProducts(locale)])
  const gallery = artworks.filter((a) => idOf(a.festival) === festival.id).map((a) => toGalleryItem(a, locale))
  const shop = products.filter((p) => idOf(p.festival) === festival.id).map((p) => toShopItem(p, locale))
  const date = festival.nextDate ? new Intl.DateTimeFormat(`${locale}-IN`, { dateStyle: 'long' }).format(new Date(festival.nextDate)) : null

  return (
    <>
      <Breadcrumbs locale={locale} items={[[t.nav.home, '/'], [t.festivalsPage.metaTitle, '/festivals'], [festival.name, `/festivals/${festival.slug}`]]} />
      {/* Wedding: a marigold garland sways in across the top of the page, once. */}
      {look.kind === 'wedding' && (
        <div aria-hidden="true" className="floor floor-keep floor-leaf overflow-hidden">
          <div className="garland" />
        </div>
      )}
      {/* Festival pages keep their colour floor all year: a festival page is a festive moment. */}
      <PageHero
        keepColour
        floor={look.heroFloor}
        kicker={date ? `${t.festivalsPage.nextDate}: ${date}` : undefined}
        title={festival.name}
        sub={festival.intro ?? undefined}
        art={<FestivalMotif kind={look.kind} live="load" className="mx-auto w-64 lg:w-80" />}
      >
        <ButtonLink href={localePath(locale, '/events')} variant="light">
          {t.festivalsPage.book}
        </ButtonLink>
        <ShareButton
          label={t.festivalsPage.share}
          text={t.festivalsPage.shareText.replace('{name}', festival.name)}
          links={[{ title: festival.name, href: localePath(locale, `/festivals/${festival.slug}`) }]}
          image={photoSrc(festival.heroImage)}
          className="sm:justify-self-start"
        />
        <RemindMe
          festival={{ id: festival.id, name: festival.name, nextDate: festival.nextDate ?? null }}
          locale={locale}
          t={t.remind}
          forms={{ errors: t.forms.errors, required: t.forms.required }}
          onDark
        />
      </PageHero>
      {/* Diwali: diyas along the doorstep under the hero light one by one. */}
      {look.kind === 'diwali' && (
        <div aria-hidden="true" className="floor floor-keep floor-charcoal">
          <div className="diya-row wrap flex justify-between pt-6 pb-4">
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className={`diya ${i % 2 ? 'max-sm:hidden' : ''}`} style={{ '--i': i } as CSSProperties} />
            ))}
          </div>
        </div>
      )}
      <Threshold />
      <section className="bg-paper py-16 lg:py-24">
        <div className="wrap grid gap-8">
          <h2 className="font-heading text-h1">{t.festivalsPage.gallery}</h2>
          {gallery.length ? (
            <Gallery items={gallery} t={t.gallery} enquiryMessage={`${t.forms.waIntro} ${t.gallery.enquire}:`} />
          ) : (
            <EmptyState title={t.festivalsPage.emptyGallery} />
          )}
        </div>
      </section>
      {shop.length > 0 && (
        <section className="bg-paper grain py-16 lg:py-24">
          <div className="wrap grid gap-8">
            <h2 className="font-heading text-h1">{t.festivalsPage.shop}</h2>
            <ShopGrid items={shop} t={t.shop} />
          </div>
        </section>
      )}
    </>
  )
}
