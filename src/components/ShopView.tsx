import Link from 'next/link'
import { notFound } from 'next/navigation'
import { localePath, type Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { getCategories, getProducts, toShopItem } from '@/server/content'
import { PageHero } from './PageHero'
import { ShopGrid } from './ShopGrid'

/** Shop listing for /shop and /shop/[category]. */
export async function ShopView({ locale, t, categorySlug }: { locale: Locale; t: Dictionary; categorySlug?: string }) {
  const [products, categories] = await Promise.all([getProducts(locale), getCategories(locale, 'shop')])
  const current = categorySlug ? categories.find((c) => c.slug === categorySlug) : undefined
  if (categorySlug && !current) notFound()

  const items = products
    .filter((p) => !current || (typeof p.category === 'object' ? p.category.id : p.category) === current.id)
    .map((p) => toShopItem(p, locale))
  const tabs = [{ href: localePath(locale, '/shop'), name: t.shop.all, active: !current }, ...categories.map((c) => ({ href: localePath(locale, `/shop/${c.slug}`), name: c.name, active: c.id === current?.id }))]

  return (
    <>
      <PageHero title={current?.name ?? t.shop.title} sub={t.shop.intro} word="दुकान" />
      <section className="bg-paper pb-20 lg:pb-28">
        <div className="wrap grid gap-8">
          <nav aria-label={t.shop.type} className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={tab.active ? 'page' : undefined}
                className="inline-flex min-h-12 shrink-0 items-center rounded-full border-[1.5px] border-charcoal px-5 aria-[current=page]:bg-charcoal aria-[current=page]:text-paper"
              >
                {tab.name}
              </Link>
            ))}
          </nav>
          <ShopGrid items={items} t={t.shop} />
        </div>
      </section>
    </>
  )
}
