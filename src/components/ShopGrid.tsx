'use client'

import Link from 'next/link'
import { useState, ViewTransition } from 'react'
import type { Dictionary } from '@/i18n/dictionaries'
import type { Media } from '@/payload-types'
import { noRepeat, styleFor, type Medium } from '@/lib/art'
import { formatPrice, whatsappLink } from '@/lib/site'
import { EmptyState } from './EmptyState'
import { MediaImage } from './MediaImage'
import type { Floor } from './PhotoPlaceholder'
import { SaveButton } from './SaveButton'
import { SoldBadge } from './SoldBadge'
import { RimBadge, thaliFor } from './Thali'

export type ShopItem = {
  slug: string
  href: string
  title: string
  type: 'original' | 'print' | 'digital'
  price: number
  hasMorePrices: boolean
  compareAt?: number | null
  sold: boolean
  meta: string
  image: Media | null
  seed: string
  medium: Medium
  floor: Floor
  createdAt: string
}

type Sort = 'newest' | 'low' | 'high'
const FILTER_FROM = 20

/** Product grid with type filter and sort (`controls={false}`: just the cards). Runs in the browser: the whole catalogue is small. */
export function ShopGrid({ items, t, controls = true }: { items: ShopItem[]; t: Dictionary['shop']; controls?: boolean }) {
  const [type, setType] = useState<'all' | ShopItem['type']>('all')
  const [sort, setSort] = useState<Sort>('newest')

  const shown = items
    .filter((i) => type === 'all' || i.type === type)
    .sort((a, b) => (sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price : b.createdAt.localeCompare(a.createdAt)))

  // Neighbouring rangoli stand-ins never share a style.
  const styles = noRepeat(shown.map((i) => styleFor(i.seed)))

  if (items.length === 0) return <EmptyState title={t.empty} />

  return (
    <div className="grid gap-8">
      {controls && (
        <>
          {/* A short list reads faster without filters: they appear once there are more than 20 pieces. */}
          {items.length > FILTER_FROM && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div role="group" aria-label={t.type} className="flex flex-wrap gap-2">
                {(['all', 'original', 'print', 'digital'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={type === v}
                    onClick={() => setType(v)}
                    className="min-h-12 rounded-full border-[1.5px] border-charcoal px-5 aria-pressed:bg-charcoal aria-pressed:text-paper"
                  >
                    {v === 'all' ? t.all : t.types[v]}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-3">
                <span className="font-semibold">{t.sort}</span>
                <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-12 rounded-ui border border-border bg-surface px-3">
                  {(Object.keys(t.sorts) as Sort[]).map((s) => (
                    <option key={s} value={s}>
                      {t.sorts[s]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <p aria-live="polite" className="text-muted">
            {shown.length} {shown.length === 1 ? t.countOne : t.count}
          </p>
        </>
      )}

      {shown.length === 0 ? (
        <p className="rounded-ui bg-surface p-8 text-center text-muted">{t.emptyFilter}</p>
      ) : (
        <ul className="pin-in grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">
          {shown.map((item, i) => (
            <li key={item.href} className="rv relative">
              <Link href={item.href} className="card art-card grid gap-3">
                <span className="tape relative block bg-surface p-2 shadow-frame lg:p-3">
                  {/* The artwork morphs into the product page's main image (same name there). */}
                  <ViewTransition name={`art-${item.slug}`} share="morph" default="none">
                  <MediaImage
                    media={item.image}
                    alt={item.title}
                    ratio="4/5"
                    seed={item.seed}
                    medium={item.medium}
                    style={styles[i]}
                    floor={item.floor}
                    sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
                    className={item.sold ? 'opacity-70 grayscale-[.3]' : ''}
                  />
                  </ViewTransition>
                  {item.sold && <SoldBadge label={t.sold} className="look-festive max-sm:hidden absolute top-4 left-4" />}
                  <RimBadge category={thaliFor(item.medium)} seed={item.seed} className="look-everyday" />
                </span>
                <span className="kind look-everyday">{t.types[item.type]}</span>
                <span className="font-heading text-h3-sm">{item.title}</span>
                <span className="text-muted">{item.meta}</span>
                {item.sold ? (
                  // Beside the price, not over the photo: the Save button owns that corner and the words can be long in Marathi.
                  <span className="flex flex-wrap items-center gap-2">
                    <s className="text-muted">{formatPrice(item.price)}</s>
                    <SoldBadge label={t.sold} className="[:root[data-season=festive]_&]:sm:hidden" />
                  </span>
                ) : item.price <= 0 ? null : (
                  <span className="price-pill font-semibold">
                    {item.hasMorePrices && <span className="font-normal text-muted">{t.from} </span>}
                    {formatPrice(item.price)}
                    {item.compareAt && item.compareAt > item.price && <s className="ml-2 font-normal text-muted">{formatPrice(item.compareAt)}</s>}
                  </span>
                )}
              </Link>
              {/* No price yet: ask on WhatsApp (a link can't sit inside the card's link). */}
              {item.price <= 0 && !item.sold && (
                <a href={whatsappLink(`${t.askPrice}: ${item.title}`)} target="_blank" rel="noopener noreferrer" className="card-btn mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-ui border-[1.5px] border-charcoal px-4 font-semibold">
                  {t.askPrice}
                </a>
              )}
              {/* Outside the link (a button can't sit inside one); over the photo's top-right corner. */}
              <SaveButton slug={item.slug} title={item.title} labels={t} className="absolute top-3 right-3 lg:top-4 lg:right-4" />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
