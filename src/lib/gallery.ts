import type { Artwork, Product } from '../payload-types'

type Shared = 'title' | 'slug' | 'story' | 'year' | 'images' | 'category' | 'medium' | 'festival' | 'createdAt'

/** One piece on the gallery wall: a gallery-only artwork, or a shop piece that also shows there. */
export type GalleryDoc = Pick<Artwork, Shared> & { id: string; order: number; shopSlug?: string }

/**
 * The gallery wall: artworks plus the shop pieces ticked "Show in gallery" (read live, not copied), by Position
 * (shop pieces count as 0), newest first within the same position.
 */
export function galleryDocs(artworks: Pick<Artwork, Shared | 'id' | 'order' | 'product'>[], products: Pick<Product, Shared | 'id' | 'showInGallery'>[]): GalleryDoc[] {
  const pick = ({ title, slug, story, year, images, category, medium, festival, createdAt }: Pick<Artwork, Shared>) => ({ title, slug, story, year, images, category, medium, festival, createdAt })
  return [
    ...artworks.map((a) => ({ ...pick(a), id: `a${a.id}`, order: a.order ?? 0, shopSlug: a.product && typeof a.product === 'object' ? a.product.slug : undefined })),
    ...products.filter((p) => p.showInGallery).map((p) => ({ ...pick(p), id: `p${p.id}`, order: 0, shopSlug: p.slug })),
  ].sort((x, y) => x.order - y.order || y.createdAt.localeCompare(x.createdAt))
}
