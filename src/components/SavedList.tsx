'use client'

import { ShoppingCart, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import type { Dictionary } from '@/i18n/dictionaries'
import { formatPrice } from '@/lib/site'
import { cartActions, savedActions, useSaved } from './cart-store'
import { useHydrated } from './local-store'
import { MediaImage } from './MediaImage'
import type { ShopItem } from './ShopGrid'

/** A saved product. `variantId` is set when it can go straight into the cart (one size, in stock). */
export type SavedProduct = ShopItem & { variantId?: string }

type Props = { products: SavedProduct[]; t: Dictionary['savedPage']; shop: Dictionary['shop']; cart: Dictionary['cart']; shopHref: string; cartHref: string; similarHref: string }

/** /wishlist: the pieces saved on this device, with remove and add-to-cart. */
export function SavedList({ products, t, shop, cart, shopHref, cartHref, similarHref }: Props) {
  const slugs = useSaved()
  const hydrated = useHydrated()
  const [added, setAdded] = useState<string | null>(null)
  if (!hydrated) return <p className="text-muted">{t.loading}</p>

  const bySlug = new Map(products.map((p) => [p.slug, p]))
  // Pieces taken off the shop since they were saved simply drop out.
  const items = slugs.flatMap((s) => bySlug.get(s) ?? [])

  if (items.length === 0)
    return (
      <div className="grid justify-items-center gap-5 rounded-ui bg-surface p-10 text-center">
        <p className="font-heading text-h3">{t.empty}</p>
        <Link href={shopHref} className="press inline-flex h-13 items-center rounded-ui border-[1.5px] border-charcoal px-6 font-semibold hover:bg-charcoal hover:text-paper">
          {t.browse}
        </Link>
      </div>
    )

  const btn = 'press inline-flex min-h-12 items-center justify-center gap-2 rounded-ui px-4 font-semibold'
  return (
    <div className="grid gap-6">
      <p aria-live="polite" className="text-muted">
        {items.length} {t.count}
      </p>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">
        {items.map((item) => (
          <li key={item.slug} className="grid content-start gap-3">
            <Link href={item.href} className="card grid gap-3">
              <span className="tape relative block bg-surface p-2 shadow-frame lg:p-3">
                <MediaImage
                  media={item.image}
                  alt={item.title}
                  ratio="4/5"
                  seed={item.seed}
                  floor={item.floor}
                  sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
                  className={item.sold ? 'opacity-70 grayscale-[.3]' : ''}
                />
                {item.sold && <span className="absolute top-4 left-4 rounded-ui bg-kumkum px-2 font-semibold text-white">{shop.sold}</span>}
              </span>
              <span className="font-heading text-h3-sm">{item.title}</span>
              <span className="font-semibold">
                {item.hasMorePrices && <span className="font-normal text-muted">{shop.from} </span>}
                {formatPrice(item.price)}
              </span>
            </Link>
            {item.sold ? (
              <Link href={similarHref} className="ink-link inline-flex min-h-11 items-center font-semibold text-peacock">
                {t.similar} →
              </Link>
            ) : item.variantId ? (
              <button
                type="button"
                onClick={() => {
                  cartActions.add({ slug: item.slug, variantId: item.variantId!, qty: 1 })
                  setAdded(item.slug)
                }}
                className={`${btn} border-[1.5px] border-charcoal hover:bg-charcoal hover:text-paper`}
              >
                <ShoppingCart aria-hidden="true" className="size-5" />
                {cart.add}
              </button>
            ) : (
              <Link href={item.href} className={`${btn} border-[1.5px] border-charcoal hover:bg-charcoal hover:text-paper`}>
                {t.choose}
              </Link>
            )}
            {added === item.slug && (
              <p role="status" className="font-semibold text-leaf">
                {cart.added} ✓{' '}
                <Link href={cartHref} className="ink-link text-peacock">
                  {cart.view}
                </Link>
              </p>
            )}
            <button type="button" onClick={() => savedActions.remove(item.slug)} className="inline-flex min-h-11 items-center gap-1 justify-self-start text-kumkum underline underline-offset-4">
              <Trash2 aria-hidden="true" className="size-5" />
              {t.remove}
              <span className="sr-only">: {item.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
