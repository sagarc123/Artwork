import 'server-only'
import config from '@payload-config'
import { cacheLife, cacheTag } from 'next/cache'
import { getPayload } from 'payload'
import type { Locale } from '@/i18n/config'
import type { Category, Media, Product } from '@/payload-types'
import { localePath } from '@/i18n/config'
import { pickMedium } from '@/lib/art'
import { galleryDocs, type GalleryDoc } from '@/lib/gallery'
import { hashString } from '@/lib/seed'
import { pickTestimonials } from '@/lib/testimonials'
import { applySale, FREE_SHIPPING_FROM, nextSaleChange, SHIPPING_FEE } from '@/lib/cart'
import { formatPrice, site } from '@/lib/site'
import type { GalleryItem } from '@/components/Gallery'
import type { Floor } from '@/components/PhotoPlaceholder'
import type { ShopItem } from '@/components/ShopGrid'

const FLOORS: Floor[] = ['charcoal', 'peacock', 'kumkum', 'leaf', 'paper']
const RATIOS = ['4/5', '1/1', '3/4', '4/5', '4/3']
/** Stable stand-in floor colour and shape per item until real photos exist. */
const pickBy = <T,>(list: T[], seed: string) => list[hashString(seed) % list.length]
const relName = (rel: unknown) => (rel && typeof rel === 'object' && 'name' in rel ? String((rel as { name: unknown }).name) : undefined)
const relSlug = (rel: unknown) => (rel && typeof rel === 'object' && 'slug' in rel ? String((rel as { slug: unknown }).slug) : undefined)
/** Which stand-in (rangoli, sketch, wash) suits a piece, from its category, medium, festival and title. */
const mediumOf = (d: { slug: string; title: string; category?: unknown; medium?: unknown; festival?: unknown }) =>
  pickMedium([relSlug(d.category), relName(d.category), relSlug(d.medium), relName(d.medium), d.festival ? 'festival' : null, d.title, d.slug], d.slug)
const firstMedia = (images: unknown) => (Array.isArray(images) && images[0] && typeof images[0] === 'object' ? (images[0] as Media) : null)

/** Colour and symbol for a festival, from its slug. */
export function festivalLook(slug: string) {
  if (slug.includes('ganesh')) return { kind: 'ganesh', floor: 'bg-kumkum', heroFloor: 'kumkum' } as const
  if (slug.includes('gudi')) return { kind: 'gudi', floor: 'bg-peacock', heroFloor: 'peacock' } as const
  if (slug.includes('wed') || slug.includes('lagna')) return { kind: 'wedding', floor: 'bg-leaf', heroFloor: 'leaf' } as const
  return { kind: 'diwali', floor: 'bg-charcoal', heroFloor: 'charcoal' } as const
}

export function toShopItem(p: ListedProduct, locale: Locale): ShopItem {
  const prices = p.variants.map((v) => v.price)
  const size = p.widthCm && p.heightCm ? `${p.widthCm}×${p.heightCm} cm` : undefined
  return {
    slug: p.slug,
    href: localePath(locale, `/shop/p/${p.slug}`),
    title: p.title,
    type: p.type,
    price: Math.min(...prices),
    hasMorePrices: new Set(prices).size > 1,
    compareAt: p.variants[0]?.compareAtPrice,
    sold: p.variants.every((v) => v.stock - (v.reserved ?? 0) <= 0),
    meta: [relName(p.medium), size].filter(Boolean).join(' · '),
    image: firstMedia(p.images),
    seed: p.slug,
    medium: mediumOf(p),
    floor: pickBy(FLOORS, p.slug),
    createdAt: p.createdAt,
  }
}

export function toGalleryItem(a: GalleryDoc, locale: Locale): GalleryItem {
  const cat = a.category && typeof a.category === 'object' ? a.category : null
  const photo = firstMedia(a.images)
  return {
    id: a.id,
    title: a.title,
    story: a.story,
    meta: [a.year, relName(a.medium)].filter(Boolean).join(' · '),
    category: cat ? { slug: cat.slug, name: cat.name } : undefined,
    image: photo,
    seed: a.slug,
    medium: mediumOf(a),
    floor: pickBy(FLOORS, a.slug),
    // Real photos keep their own shape; stand-ins vary so the wall looks hand-hung.
    ratio: photo?.width && photo.height ? `${photo.width}/${photo.height}` : pickBy(RATIOS, a.slug),
    productHref: a.shopSlug ? localePath(locale, `/shop/p/${a.shopSlug}`) : undefined,
  }
}

// Read-only access to published content for the public pages. Cached until an admin edit refreshes the tag.
const db = () => getPayload({ config })
const published = { _status: { equals: 'published' } } as const

export async function getCategories(locale: Locale, scope: Exclude<Category['scope'], 'both'>) {
  'use cache'
  cacheLife('max')
  cacheTag('categories')
  // "Shop and gallery" categories belong to both lists.
  const { docs } = await (await db()).find({ collection: 'categories', locale, where: { scope: { in: [scope, 'both'] } }, sort: 'order', limit: 50, depth: 0 })
  return docs
}

/** The gallery wall: published artworks plus published shop pieces ticked "Show in gallery". */
export async function getGallery(locale: Locale) {
  'use cache'
  cacheLife('max')
  cacheTag('artworks', 'categories', 'mediums', 'media', 'festivals', 'products')
  const [{ docs }, products] = await Promise.all([
    (await db()).find({ collection: 'artworks', locale, where: published, sort: ['order', '-createdAt'], limit: 300, depth: 1 }),
    getProducts(locale),
  ])
  return galleryDocs(docs, products)
}

/** The festival sale as of now, and how long that stays true (so cached pages switch prices when it starts or ends). */
async function saleNow() {
  const { festivalSale } = await (await db()).findGlobal({ slug: 'commerce-settings', depth: 0 })
  const now = new Date()
  const wait = nextSaleChange(festivalSale, now)
  return { sale: festivalSale, now, seconds: wait === null ? null : Math.max(60, Math.ceil(wait / 1000)) }
}

/** What shop listings, search and the gallery read (the product page reads everything), so the cached copy stays small. */
const listed = {
  title: true,
  slug: true,
  type: true,
  variants: true,
  images: true,
  category: true,
  medium: true,
  festival: true,
  widthCm: true,
  heightCm: true,
  year: true,
  story: true,
  featured: true,
  showInGallery: true,
  createdAt: true,
} as const
export type ListedProduct = Pick<Product, 'id' | keyof typeof listed>

/** Published products, with any festival sale already in the prices (the old price becomes the crossed-out one). */
export async function getProducts(locale: Locale): Promise<ListedProduct[]> {
  'use cache'
  cacheTag('products', 'categories', 'mediums', 'media', 'festivals', 'commerce-settings')
  const [{ docs }, { sale, now, seconds }] = await Promise.all([
    (await db()).find({ collection: 'products', locale, where: published, sort: '-createdAt', limit: 500, depth: 1, select: listed }),
    saleNow(),
  ])
  if (seconds) cacheLife({ revalidate: seconds })
  else cacheLife('max')
  return applySale(docs, sale, now)
}

export async function getProduct(locale: Locale, slug: string) {
  'use cache'
  cacheTag('products', 'categories', 'mediums', 'media', 'festivals', 'commerce-settings')
  const [{ docs }, { sale, now, seconds }] = await Promise.all([
    (await db()).find({ collection: 'products', locale, where: { and: [published, { slug: { equals: slug } }] }, limit: 1, depth: 1 }),
    saleNow(),
  ])
  if (seconds) cacheLife({ revalidate: seconds })
  else cacheLife('max')
  return applySale(docs, sale, now)[0] ?? null
}

export async function getFestivals(locale: Locale) {
  'use cache'
  cacheLife('max')
  cacheTag('festivals', 'media')
  const { docs } = await (await db()).find({ collection: 'festivals', locale, sort: 'order', limit: 50, depth: 1 })
  return docs
}

/** Slugs for pre-building detail pages. Cache Components needs at least one, so "_" stands in (it 404s). */
export async function getSlugs(collection: 'products' | 'festivals') {
  'use cache'
  cacheLife('max')
  cacheTag(collection)
  const where = collection === 'products' ? published : undefined
  const { docs } = await (await db()).find({ collection, where, limit: 1000, depth: 0, select: { slug: true } })
  const slugs = docs.map((d) => d.slug).filter(Boolean)
  return slugs.length ? slugs : ['_']
}

/** Business, contact and COD details for Contact, Help and the policies. Empty site-settings fields fall back to env (src/lib/site.ts). */
export async function getBusiness() {
  'use cache'
  cacheLife('max')
  cacheTag('site-settings', 'commerce-settings')
  const payload = await db()
  const [s, c] = await Promise.all([payload.findGlobal({ slug: 'site-settings', depth: 0 }), payload.findGlobal({ slug: 'commerce-settings', depth: 0 })])
  const b = {
    brandName: s.brandName || site.brandName,
    legalName: s.business?.legalName || '',
    gstin: s.business?.gstin || '',
    address: s.business?.address || '',
    city: s.business?.city || '',
    whatsapp: s.contact?.whatsapp || site.whatsappNumber,
    phone: s.contact?.phone || site.phone,
    email: s.contact?.email || site.email,
    replyHours: s.contact?.replyHours ?? 4,
    grievanceName: s.grievanceOfficer?.name || '',
    grievanceEmail: s.grievanceOfficer?.email || '',
    social: [
      { label: 'Instagram', href: s.social?.instagram || site.instagram },
      { label: 'YouTube', href: s.social?.youtube || site.youtube },
      { label: 'Facebook', href: s.social?.facebook || site.facebook },
    ].filter((x) => x.href),
    // Only the public COD numbers leave this function (blocked pincodes stay private).
    cod: { enabled: c.cod?.enabled !== false, maxTotal: c.cod?.maxTotal ?? 5000, fee: c.cod?.fee ?? 49 },
  }
  // {slot} values for the help answers and policies (src/components/OwnerText.tsx).
  const values = {
    brand: b.brandName,
    legalName: b.legalName,
    address: b.address,
    gstin: b.gstin,
    city: b.city,
    email: b.email,
    phone: b.phone,
    grievanceName: b.grievanceName,
    grievanceEmail: b.grievanceEmail,
    codMax: formatPrice(b.cod.maxTotal),
    codFee: formatPrice(b.cod.fee),
    shipFee: formatPrice(SHIPPING_FEE),
    freeFrom: formatPrice(FREE_SHIPPING_FROM),
  }
  return { ...b, values }
}

/** Owner-set "from" prices for events and portraits (empty fields stay null, and the pages hide them). */
export async function getServicePrices(locale: Locale) {
  'use cache'
  cacheLife('max')
  cacheTag('service-prices')
  return (await db()).findGlobal({ slug: 'service-prices', locale, depth: 0 })
}

/** Reviews the customer agreed to share, for one page (see pickTestimonials): home when no topic is given. */
export async function getTestimonials(locale: Locale, topic?: 'event' | 'portrait' | 'shop') {
  'use cache'
  cacheLife('max')
  cacheTag('testimonials', 'media')
  // ponytail: reads every shared review (a handful) and picks in code; query by language and topic if there are hundreds.
  const { docs } = await (await db()).find({ collection: 'testimonials', locale, where: { permission: { equals: true } }, sort: '-createdAt', limit: 200, depth: 1 })
  return pickTestimonials(docs, locale, topic)
}
