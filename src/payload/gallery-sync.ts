import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionBeforeValidateHook, PayloadRequest } from 'payload'
import type { Category, Product } from '../payload-types'

const LOCALES = ['en', 'mr', 'hi'] as const
type Localized = Partial<Record<(typeof LOCALES)[number], string | null>>
const idOf = (v: unknown) => (v && typeof v === 'object' ? (v as { id: number }).id : (v as number | null | undefined))
/** Set on writes made here, so the artwork save doesn't come back round. */
const SYNC = { gallerySync: true }

type Row = { id?: string | null; label?: string | null; price?: number | null; stock?: number | null }

/**
 * Originals show a single Price and a Sold switch. They become the one size row checkout and stock code use.
 * Stock only changes when the switch itself changed, so saving an old form never brings back a piece that just sold.
 */
export const originalFromSimpleFields: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  if (!data || (data.type ?? originalDoc?.type) !== 'original') return data
  if (data.originalPrice === undefined && data.sold === undefined) return data
  const saved: Row | undefined = originalDoc?.variants?.[0]
  const first: Row = (data.variants as Row[] | undefined)?.[0] ?? saved ?? {}
  const wasSold = (saved?.stock ?? 1) <= 0
  const sold = data.sold === undefined ? wasSold : Boolean(data.sold)
  data.variants = [
    {
      ...first,
      label: first.id && first.label ? first.label : 'Original',
      price: data.originalPrice ?? first.price,
      stock: sold === wasSold && saved ? saved.stock : sold ? 0 : 1,
    },
  ]
  return data
}

/** Photos without a description get the piece's title, so every image has alt text. */
export async function fillAlt(req: PayloadRequest, images: unknown, title: string | undefined | null) {
  const ids = (Array.isArray(images) ? images : []).map(idOf).filter((id): id is number => typeof id === 'number')
  if (!ids.length || !title) return
  await req.payload.update({
    collection: 'media',
    where: { and: [{ id: { in: ids } }, { or: [{ alt: { exists: false } }, { alt: { equals: '' } }] }] },
    data: { alt: title },
    req,
    context: SYNC,
  })
}

/** The gallery category for a shop category: the same one if shared, else the gallery one with the same English name (made if missing). */
async function galleryCategory(req: PayloadRequest, categoryId: number) {
  const cat = (await req.payload.findByID({ collection: 'categories', id: categoryId, locale: 'all', depth: 0, req })) as unknown as Omit<Category, 'name'> & { name: Localized }
  if (cat.scope !== 'shop') return cat.id
  const nameEn = (cat.name.en ?? '').trim()
  const { docs } = await req.payload.find({ collection: 'categories', locale: 'en', where: { scope: { in: ['artwork', 'both'] } }, limit: 200, depth: 0, req })
  const match = docs.find((d) => d.name.trim().toLowerCase() === nameEn.toLowerCase())
  if (match) return match.id
  const made = await req.payload.create({ collection: 'categories', locale: 'en', data: { name: nameEn, slug: '', scope: 'artwork', order: cat.order ?? 0 }, req, context: SYNC })
  for (const locale of ['mr', 'hi'] as const) {
    if (cat.name[locale]) await req.payload.update({ collection: 'categories', id: made.id, locale, data: { name: cat.name[locale]! }, req, context: SYNC })
  }
  return made.id
}

/**
 * "Add a painting" once: every product keeps a matching gallery entry (title in each language, photos, story, year,
 * medium, festival, category). Untick "Show in gallery" to take it off the gallery page.
 */
export const syncGallery: CollectionAfterChangeHook<Product> = async ({ doc, req, context }) => {
  if (context.gallerySync) return doc
  const published = doc._status === 'published'
  const { docs } = await req.payload.find({ collection: 'artworks', where: { product: { equals: doc.id } }, limit: 1, depth: 0, draft: true, req })
  const existing = docs[0]

  if (doc.showInGallery === false) {
    if (existing && existing._status === 'published') {
      await req.payload.update({ collection: 'artworks', id: existing.id, data: { _status: 'draft' }, req, context: SYNC })
    }
    return doc
  }
  // A draft edit of a live piece waits until it is published.
  if (existing && !published && existing._status === 'published') return doc

  const all = (await req.payload.findByID({ collection: 'products', id: doc.id, locale: 'all', depth: 0, draft: true, req })) as unknown as Omit<Product, 'title' | 'story'> & {
    title: Localized
    story?: Localized | null
  }
  await fillAlt(req, all.images, all.title.en)
  const shared = {
    product: doc.id,
    forSale: true,
    images: (all.images ?? []).map(idOf).filter((id): id is number => typeof id === 'number'),
    year: all.year,
    medium: idOf(all.medium) ?? null,
    festival: idOf(all.festival) ?? null,
    category: await galleryCategory(req, idOf(all.category)!),
    _status: published ? ('published' as const) : ('draft' as const),
  }
  let artworkId = existing?.id
  for (const locale of LOCALES) {
    const title = all.title[locale]
    if (!title && locale !== 'en') continue
    const data = { ...shared, title: title ?? doc.title, story: all.story?.[locale] ?? undefined }
    if (artworkId) await req.payload.update({ collection: 'artworks', id: artworkId, locale, data, draft: !published, req, context: SYNC })
    // Created in English first; the empty slug is filled from the English title (and made unique) by the slug field.
    else artworkId = (await req.payload.create({ collection: 'artworks', locale, data: { ...data, slug: '' }, draft: !published, req, context: SYNC })).id
  }
  return doc
}

/** A deleted product leaves its gallery entry up, no longer for sale. */
export const unlinkGallery: CollectionAfterDeleteHook = async ({ id, req }) => {
  await req.payload.update({ collection: 'artworks', where: { product: { equals: id } }, data: { forSale: false, product: null }, req, context: SYNC })
}
