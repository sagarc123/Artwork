import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ViewTransition } from 'react'
import { DeliveryCheck } from '@/components/DeliveryCheck'
import { DeliveryPromise } from '@/components/DeliveryPromise'
import { MediaImage } from '@/components/MediaImage'
import { Breadcrumbs } from '@/components/JsonLd'
import { ReviewList } from '@/components/ReviewList'
import { ProductBuy } from '@/components/ProductBuy'
import { SaveButton } from '@/components/SaveButton'
import { ShareButton } from '@/components/ShareButton'
import { ShopGrid } from '@/components/ShopGrid'
import { alternates, localePath } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import type { Media } from '@/payload-types'
import { site } from '@/lib/site'
import { getBusiness, getDeliveryRules, getProduct, getProducts, getReviews, getSlugs, toShopItem } from '@/server/content'

// Unknown slugs must wait for the full render so notFound() can still send a real 404 (not the streamed App Shell).
export const ensureStatic = 'navigation'
// Allowed to wait on navigation: unknown slugs must render fully so notFound() sends a real 404.
export const instant = false

export async function generateStaticParams() {
  return (await getSlugs('products')).map((slug) => ({ slug }))
}

async function load(params: PageProps<'/[lang]/shop/p/[slug]'>['params']) {
  const { slug } = await params
  const locale = await getLocale()
  const product = await getProduct(locale, slug)
  if (!product) notFound()
  return { product, locale }
}

const name = (rel: unknown) => (rel && typeof rel === 'object' && 'name' in rel ? String((rel as { name: unknown }).name) : undefined)

export async function generateMetadata({ params }: PageProps<'/[lang]/shop/p/[slug]'>): Promise<Metadata> {
  const { product, locale } = await load(params)
  const title = product.seo?.title || product.title
  const description = product.seo?.description || product.story?.slice(0, 155) || undefined
  return {
    title,
    description,
    alternates: alternates(locale, `/shop/p/${product.slug}`),
    // A page's openGraph replaces the layout's whole object, so repeat its defaults.
    // The share picture comes from ./opengraph-image.tsx.
    openGraph: { siteName: site.brandName, type: 'website', title, description },
  }
}

export default async function ProductPage({ params }: PageProps<'/[lang]/shop/p/[slug]'>) {
  const { product, locale } = await load(params)
  const t = await getDictionary()
  const s = t.shop
  const images = (Array.isArray(product.images) ? product.images : []).filter((m): m is Media => typeof m === 'object')
  const categoryId = typeof product.category === 'object' ? product.category.id : product.category
  const related = (await getProducts(locale))
    .filter((p) => p.id !== product.id && (typeof p.category === 'object' ? p.category.id : p.category) === categoryId)
    .slice(0, 4)
    .map((p) => toShopItem(p, locale))
  const { medium } = toShopItem(product, locale)
  const available = product.variants.some((v) => v.stock - (v.reserved ?? 0) > 0)
  const physical = product.type !== 'digital'
  // Same rule as checkout (src/lib/cart.ts codBlock): prints and originals, within the COD limit.
  const [{ cod }, { rules }, reviews] = await Promise.all([getBusiness(), getDeliveryRules(), getReviews('product', product.id)])
  const codOk = physical && cod.enabled && Math.min(...product.variants.map((v) => v.price)) + cod.fee <= cod.maxTotal

  // Structured data so Google can show price and availability.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.story ?? undefined,
    image: images.flatMap((m) => (m.url ? [new URL(m.url, site.url).toString()] : [])),
    brand: { '@type': 'Brand', name: site.brandName },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'INR',
      lowPrice: Math.min(...product.variants.map((v) => v.price)),
      highPrice: Math.max(...product.variants.map((v) => v.price)),
      availability: available ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
    },
    // Only from real, approved reviews, and only once there is one.
    aggregateRating: reviews.count ? { '@type': 'AggregateRating', ratingValue: reviews.average, reviewCount: reviews.count, bestRating: 5, worstRating: 1 } : undefined,
  }

  return (
    <article className="bg-paper grain pb-20 lg:pb-28">
      <Breadcrumbs locale={locale} items={[[t.nav.home, '/'], [t.nav.shop, '/shop'], [product.title, `/shop/p/${product.slug}`]]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      {/* Two columns from tablets up, so price and Add to cart sit beside the photo instead of a screen below it. */}
      <div className="wrap grid gap-4 pt-4 md:grid-cols-12 md:gap-8 lg:gap-12 lg:pt-10">
        <Link href={localePath(locale, '/shop')} className="ink-link inline-flex min-h-11 items-center gap-2 justify-self-start font-semibold text-peacock md:col-span-12">
          <ArrowLeft aria-hidden="true" className="size-5" />
          {s.back}
        </Link>

        <div className="grid content-start gap-4 md:col-span-6 lg:col-span-7">
          {/* Phones: small, so title and price show on the first screen (the buy bar below carries Add to cart). */}
          <div className="tape art-main relative mx-auto w-full max-w-[calc(32svh*0.8)] bg-surface p-3 shadow-frame md:max-w-none lg:p-5">
            {/* Shares its name with the card that opened it (shop, home, gallery), so the artwork morphs across. */}
            <ViewTransition name={`art-${product.slug}`} share="morph" default="none">
              <MediaImage media={images[0]} alt={product.title} ratio="4/5" seed={product.slug} medium={medium} floor="charcoal" sizes="(min-width: 1024px) 55vw, (min-width: 768px) 50vw, 100vw" priority />
            </ViewTransition>
          </div>
          {images.length > 1 && (
            <ul className="grid grid-cols-3 gap-3">
              {images.slice(1).map((m) => (
                <li key={m.id} className="bg-surface p-2 shadow-frame">
                  <MediaImage media={m} alt={m.alt || product.title} ratio="1/1" seed={`${product.slug}-${m.id}`} medium={medium} sizes="20vw" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid content-start gap-4 md:col-span-6 md:gap-6 lg:sticky lg:top-32 lg:col-span-5">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="font-semibold text-accent max-[359px]:sr-only">{s.types[product.type]}</p>
            <div className="flex flex-wrap justify-end gap-2 max-[359px]:w-full">
              <ShareButton label={s.share} shortLabel={s.shareShort} text={s.shareText} links={[{ title: product.title, href: localePath(locale, `/shop/p/${product.slug}`) }]} />
              <SaveButton slug={product.slug} title={product.title} labels={s} />
            </div>
          </div>
          <h1 className="font-heading text-h1">{product.title}</h1>
          <ProductBuy
            slug={product.slug}
            title={product.title}
            physical={physical}
            promise={
              physical ? (
                <div className="grid gap-4">
                  <DeliveryPromise locale={locale} deliveredBy={s.deliveredBy} cod={codOk ? s.codAvailable : null} days={[rules.minDays, rules.maxDays]} />
                  <DeliveryCheck locale={locale} t={s.delivery} codOk={codOk} />
                </div>
              ) : undefined
            }
            variants={product.variants.map((v) => ({ id: v.id!, label: v.label, price: v.price, compareAtPrice: v.compareAtPrice, stock: v.stock - (v.reserved ?? 0) }))}
            framing={(product.framing ?? []).map((f) => ({ id: f.id!, label: f.label, extraPrice: f.extraPrice }))}
            t={s}
            cart={t.cart}
            cartHref={localePath(locale, '/cart')}
          />
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-border/30 pt-6">
            {name(product.medium) && (
              <>
                <dt className="text-muted">{s.medium}</dt>
                <dd>{name(product.medium)}</dd>
              </>
            )}
            {product.widthCm && product.heightCm && (
              <>
                <dt className="text-muted">{s.dimensions}</dt>
                <dd>
                  {product.widthCm} × {product.heightCm} cm
                </dd>
              </>
            )}
            {product.year && (
              <>
                <dt className="text-muted">{s.year}</dt>
                <dd>{product.year}</dd>
              </>
            )}
          </dl>
          {[
            [s.shipping, s.shippingBody],
            [s.returns, s.returnsBody],
          ].map(([title, body]) => (
            <details key={title} className="group border-t border-border/30 pt-4">
              <summary className="flex min-h-11 cursor-pointer items-center justify-between font-semibold">
                {title}
                <span aria-hidden="true" className="transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 text-muted">{body}</p>
            </details>
          ))}
        </div>

        <ReviewList data={reviews} kind="product" locale={locale} t={t.reviews} className="md:col-span-12" />

        {product.story && (
          <section className="grid max-w-[65ch] gap-4 md:col-span-12 lg:col-span-7">
            <h2 className="font-heading text-h2">{s.story}</h2>
            <p className="font-heading text-h3 leading-relaxed">“{product.story}”</p>
          </section>
        )}
      </div>

      {/* Outside the grid above, so the sticky buy panel stops before it. */}
      {related.length > 0 && (
        <section className="wrap mt-20 grid gap-8 lg:mt-28">
          <h2 className="font-heading text-h1">{s.related}</h2>
          <ShopGrid items={related} t={s} controls={false} />
        </section>
      )}
    </article>
  )
}
