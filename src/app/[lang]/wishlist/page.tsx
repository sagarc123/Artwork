import type { Metadata } from 'next'
import { PageHero } from '@/components/PageHero'
import { SavedList, type SavedProduct } from '@/components/SavedList'
import { alternates, localePath } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { getProducts, toShopItem } from '@/server/content'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.savedPage.metaTitle, robots: { index: false, follow: true }, alternates: alternates(await getLocale(), '/wishlist') }
}

export default async function WishlistPage() {
  const locale = await getLocale()
  const t = await getDictionary()
  // ponytail: the saved slugs live in the browser, so the (small, cached) catalogue goes along and is filtered there.
  // Move to a server lookup by slug when the shop grows past a few hundred pieces.
  const products: SavedProduct[] = (await getProducts(locale)).map((p) => {
    const only = p.variants.length === 1 ? p.variants[0] : undefined
    return { ...toShopItem(p, locale), variantId: only && only.stock - (only.reserved ?? 0) > 0 ? (only.id ?? undefined) : undefined }
  })

  return (
    <>
      <PageHero title={t.savedPage.title} sub={t.savedPage.sub} word="आवड" />
      <section className="bg-paper pb-20 lg:pb-28">
        <div className="wrap">
          <SavedList
            products={products}
            t={t.savedPage}
            shop={t.shop}
            cart={t.cart}
            shopHref={localePath(locale, '/shop')}
            cartHref={localePath(locale, '/cart')}
            similarHref={localePath(locale, '/contact')}
          />
        </div>
      </section>
    </>
  )
}
