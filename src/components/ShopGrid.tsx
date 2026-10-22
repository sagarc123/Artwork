'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Dictionary } from '@/i18n/dictionaries'
import type { Media } from '@/payload-types'
import { formatPrice } from '@/lib/site'
import { MediaImage } from './MediaImage'
import type { Floor } from './PhotoPlaceholder'

export type ShopItem = {
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
  floor: Floor
  createdAt: string
}

type Sort = 'newest' | 'low' | 'high'

/** Product grid with type filter and sort. Runs in the browser: the whole catalogue is small. */
export function ShopGrid({ items, t }: { items: ShopItem[]; t: Dictionary['shop'] }) {
  const [type, setType] = useState<'all' | ShopItem['type']>('all')
  const [sort, setSort] = useState<Sort>('newest')

  const shown = items
    .filter((i) => type === 'all' || i.type === type)
    .sort((a, b) => (sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price : b.createdAt.localeCompare(a.createdAt)))

  if (items.length === 0) return <p className="rounded-ui bg-surface p-8 text-center text-muted">{t.empty}</p>

  return (
    <div className="grid gap-8">
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

      <p aria-live="polite" className="text-muted">
        {shown.length} {t.count}
      </p>

      {shown.length === 0 ? (
        <p className="rounded-ui bg-surface p-8 text-center text-muted">{t.emptyFilter}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">
          {shown.map((item) => (
            <li key={item.href}>
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
                  {item.sold && <span className="absolute top-4 left-4 rounded-ui bg-kumkum px-2 font-semibold text-white">{t.sold}</span>}
                </span>
                <span className="font-heading text-h3-sm">{item.title}</span>
                <span className="text-muted">{item.meta}</span>
                <span className="font-semibold">
                  {item.hasMorePrices && <span className="font-normal text-muted">{t.from} </span>}
                  {formatPrice(item.price)}
                  {item.compareAt && item.compareAt > item.price && <s className="ml-2 font-normal text-muted">{formatPrice(item.compareAt)}</s>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
