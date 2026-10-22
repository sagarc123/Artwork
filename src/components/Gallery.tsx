'use client'

import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { Dictionary } from '@/i18n/dictionaries'
import type { Media } from '@/payload-types'
import { whatsappLink } from '@/lib/site'
import { MediaImage } from './MediaImage'
import type { Floor } from './PhotoPlaceholder'

export type GalleryItem = {
  id: number | string
  title: string
  story?: string | null
  meta?: string
  category?: { slug: string; name: string }
  image: Media | null
  seed: string
  floor: Floor
  ratio: string
  productHref?: string
}

/** Masonry wall with category tabs and a full-screen viewer (native <dialog>: Esc closes, focus stays inside). */
export function Gallery({ items, t, enquiryMessage }: { items: GalleryItem[]; t: Dictionary['gallery']; enquiryMessage: string }) {
  const [tab, setTab] = useState('all')
  const [open, setOpen] = useState<number | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)

  const categories = [...new Map(items.filter((i) => i.category).map((i) => [i.category!.slug, i.category!.name]))]
  const shown = tab === 'all' ? items : items.filter((i) => i.category?.slug === tab)
  const current = open === null ? null : shown[open]

  useEffect(() => {
    if (open !== null && !dialog.current?.open) dialog.current?.showModal()
  }, [open])

  const step = (d: number) => setOpen((i) => (i === null ? i : (i + d + shown.length) % shown.length))

  if (items.length === 0) return <p className="rounded-ui bg-surface p-8 text-center text-muted">{t.empty}</p>

  return (
    <>
      {/* Filter buttons, not tabs: they filter one list rather than switching panels. */}
      <div role="group" aria-label={t.filter} className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-2">
        {[['all', t.all] as const, ...categories].map(([slug, name]) => (
          <button
            key={slug}
            type="button"
            aria-pressed={tab === slug}
            onClick={() => setTab(slug)}
            className="min-h-12 shrink-0 rounded-full border-[1.5px] border-charcoal px-5 aria-pressed:bg-charcoal aria-pressed:text-paper"
          >
            {name}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="mt-4 text-muted">
        {shown.length} {t.count}
      </p>

      <ul className="mt-6 columns-2 gap-4 lg:columns-4 lg:gap-6">
        {shown.map((item, i) => (
          <li key={item.id} className="mb-4 break-inside-avoid lg:mb-6">
            <button type="button" onClick={() => setOpen(i)} className="card reveal grid w-full gap-2 text-left">
              <span className="block bg-surface p-2 shadow-frame">
                <MediaImage media={item.image} alt="" ratio={item.ratio} seed={item.seed} floor={item.floor} sizes="(min-width: 1024px) 25vw, 50vw" />
              </span>
              <span className="font-heading text-h3-sm">{item.title}</span>
              <span className={item.productHref ? 'font-semibold text-leaf' : 'text-muted'}>{item.productHref ? t.forSale : t.private}</span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        aria-label={current?.title}
        onClose={() => setOpen(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') step(1)
          if (e.key === 'ArrowLeft') step(-1)
        }}
        className="m-auto max-h-[100dvh] w-full max-w-6xl bg-transparent p-0 backdrop:bg-charcoal/90"
      >
        {current && (
          <div className="grid max-h-[100dvh] overflow-y-auto bg-surface lg:grid-cols-[3fr_2fr]">
            <div className="bg-charcoal p-4 lg:p-8">
              <MediaImage media={current.image} alt={current.title} ratio={current.ratio} seed={current.seed} floor={current.floor} sizes="(min-width: 1024px) 60vw, 100vw" className="mx-auto max-h-[70dvh] w-auto" />
            </div>
            <div className="grid content-start gap-4 p-6 lg:p-8">
              <div className="flex justify-end">
                <button type="button" onClick={() => dialog.current?.close()} className="flex min-h-12 items-center gap-2 rounded-ui px-3 hover:bg-charcoal/5">
                  <X aria-hidden="true" className="size-6" />
                  {t.close}
                </button>
              </div>
              <h2 className="font-heading text-h2">{current.title}</h2>
              {current.meta && <p className="text-muted">{current.meta}</p>}
              {current.story && (
                <>
                  <h3 className="font-semibold">{t.story}</h3>
                  <p>{current.story}</p>
                </>
              )}
              {current.productHref ? (
                <Link href={current.productHref} className="press inline-flex h-13 items-center justify-center rounded-ui bg-kumkum px-6 font-semibold text-white">
                  {t.buy}
                </Link>
              ) : (
                <a
                  href={whatsappLink(`${enquiryMessage} ${current.title}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press inline-flex h-13 items-center justify-center rounded-ui border-[1.5px] border-charcoal px-6 font-semibold"
                >
                  {t.enquire}
                </a>
              )}
              <div className="mt-4 flex justify-between gap-3">
                <button type="button" onClick={() => step(-1)} className="flex min-h-12 items-center gap-1 rounded-ui px-3 hover:bg-charcoal/5">
                  <ChevronLeft aria-hidden="true" className="size-6" />
                  {t.prev}
                </button>
                <span className="self-center text-muted">
                  {open! + 1} / {shown.length}
                </span>
                <button type="button" onClick={() => step(1)} className="flex min-h-12 items-center gap-1 rounded-ui px-3 hover:bg-charcoal/5">
                  {t.next}
                  <ChevronRight aria-hidden="true" className="size-6" />
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  )
}
