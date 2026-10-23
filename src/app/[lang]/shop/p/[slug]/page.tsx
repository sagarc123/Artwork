import { RichText } from '@payloadcms/richtext-lexical/react'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DeliveryPromise } from '@/components/DeliveryPromise'
import { MediaImage } from '@/components/MediaImage'
import { ProductBuy } from '@/components/ProductBuy'
import { SaveButton } from '@/components/SaveButton'
import { ShareButton } from '@/components/ShareButton'
import { ShopGrid } from '@/components/ShopGrid'
import { alternates, localePath } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import type { Media } from '@/payload-types'
import { site } from '@/lib/site'
import { getBusiness, getProduct, getProducts, getSlugs, toShopItem } from '@/server/content'

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
  const image = Array.isArray(product.images) && typeof product.images[0] === 'object' ? (product.images[0] as Media) : null
  const title = product.seo?.title || product.title
  const description = product.seo?.description || product.story?.slice(0, 155) || undefined
  return {
    title,
    description,
    alternates: alternates(locale, `/shop/p/${product.slug}`),
    // A page's openGraph replaces the layout's whole object, so repeat its defaults.
    openGraph: { siteName: site.brandName, type: 'website', title, description, images: image?.url ? [{ url: image.url, alt: image.alt }] : undefined },
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
  const { cod } = await getBusiness()
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
  }

  return (
    <article className="bg-paper grain pb-20 lg:pb-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="wrap grid gap-10 pt-6 lg:grid-cols-12 lg:gap-12 lg:pt-10">
        <Link href={localePath(locale, '/shop')} className="ink-link inline-flex min-h-11 items-center gap-2 justify-self-start font-semibold text-peacock lg:col-span-12">
          <ArrowLeft aria-hidden="true" className="size-5" />
          {s.back}
        </Link>

        <div className="grid content-start gap-4 lg:col-span-7">
          <div className="tape relative bg-surface p-3 shadow-frame lg:p-5">
            <MediaImage media={images[0]} alt={product.title} ratio="4/5" seed={product.slug} medium={medium} floor="charcoal" sizes="(min-width: 1024px) 55vw, 100vw" priority />
          </div>
          {images.length > 1 && (
            <ul className="grid grid-cols-3 gap-3">
              {images.slice(1).map((m) => (
                <li key={m.id} className="bg-surface p-2 shadow-frame">
                  <MediaImage media={m} alt={m.alt} ratio="1/1" seed={`${product.slug}-${m.id}`} medium={medium} sizes="20vw" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid content-start gap-6 lg:sticky lg:top-32 lg:col-span-5">
          <div className="flex items-center justify-between gap-4">
            <p className="font-semibold text-kumkum">{s.types[product.type]}</p>
            <div className="flex flex-wrap justify-end gap-2">
              <ShareButton label={s.share} text={s.shareText} links={[{ title: product.title, href: localePath(locale, `/shop/p/${product.slug}`) }]} />
              <SaveButton slug={product.slug} title={product.title} labels={s} />
            </div>
          </div>
          <h1 className="font-heading text-h1">{product.title}</h1>
          <ProductBuy
            slug={product.slug}
            title={product.title}
            physical={physical}
            promise={physical ? <DeliveryPromise locale={locale} deliveredBy={s.deliveredBy} cod={codOk ? s.codAvailable : null} /> : undefined}
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

        {(product.story || product.description) && (
          <section className="grid gap-4 lg:col-span-7">
            <h2 className="font-heading text-h2">{s.story}</h2>
            {product.story && <p className="font-heading text-h3 leading-relaxed">“{product.story}”</p>}
            {product.description && <RichText data={product.description} className="grid gap-4" />}
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
