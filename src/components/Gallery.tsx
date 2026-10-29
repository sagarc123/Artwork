'use client'

import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState, ViewTransition } from 'react'
import type { Dictionary } from '@/i18n/dictionaries'
import type { Media } from '@/payload-types'
import { noRepeat, styleFor, type Medium } from '@/lib/art'
import { whatsappLink } from '@/lib/site'
import { EmptyState } from './EmptyState'
import { MediaImage, photoSrc } from './MediaImage'
import { ShareButton } from './ShareButton'
import { RimBadge, thaliFor } from './Thali'
import type { Floor } from './PhotoPlaceholder'

export type GalleryItem = {
  id: number | string
  title: string
  story?: string | null
  meta?: string
  category?: { slug: string; name: string }
  image: Media | null
  seed: string
  medium: Medium
  floor: Floor
  ratio: string
  productHref?: string
}

const FILTER_FROM = 8

/**
 * Masonry wall with category tabs and a full-screen viewer (native <dialog>: Esc closes, focus stays inside).
 * `morph`: the open piece carries over into its shop page (only where no shop grid on the page uses the same name).
 */
export function Gallery({ items, t, enquiryMessage, morph }: { items: GalleryItem[]; t: Dictionary['gallery']; enquiryMessage: string; morph?: boolean }) {
  const [tab, setTab] = useState('all')
  const [open, setOpen] = useState<number | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)

  // By name: a shop piece's category and the gallery's one of the same name are one tab.
  const categories = [...new Set(items.flatMap((i) => (i.category ? [i.category.name] : [])))].map((name) => [name, name] as const)
  const shown = tab === 'all' ? items : items.filter((i) => i.category?.name === tab)
  const current = open === null ? null : shown[open]
  // Neighbouring rangoli stand-ins never share a style.
  const styles = noRepeat(shown.map((i) => styleFor(i.seed)))

  useEffect(() => {
    if (open !== null && !dialog.current?.open) dialog.current?.showModal()
  }, [open])

  const step = (d: number) => setOpen((i) => (i === null ? i : (i + d + shown.length) % shown.length))

  if (items.length === 0) return <EmptyState title={t.empty} body={t.emptyBody} />

  return (
    <>
      {/* Filter buttons, not tabs: they filter one list rather than switching panels. A short wall needs none. */}
      {categories.length >= 2 && items.length >= FILTER_FROM && (
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
      )}
      <p aria-live="polite" className="mt-4 text-muted">
        {shown.length} {shown.length === 1 ? t.countOne : t.count}
      </p>

      <ul className="mt-6 columns-2 gap-4 lg:columns-4 lg:gap-6">
        {shown.map((item, i) => (
          <li key={item.id} className="mb-4 break-inside-avoid lg:mb-6">
            <button type="button" onClick={() => setOpen(i)} className="card art-card peek grid w-full gap-2 text-left">
              <span className="relative block overflow-hidden bg-surface p-2 shadow-frame">
                <span className="peek-art block">
                  <MediaImage media={item.image} alt="" ratio={item.ratio} seed={item.seed} medium={item.medium} style={styles[i]} floor={item.floor} sizes="(min-width: 1024px) 25vw, 50vw" />
                </span>
                <span aria-hidden="true" className="peek-info">
                  <span className="peek-view">{t.view}</span>
                </span>
                <RimBadge category={thaliFor(item.medium)} seed={item.seed} className="look-everyday" />
              </span>
              {item.category && <span className="kind look-everyday">{item.category.name}</span>}
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
              <ViewTransition name={morph && current.productHref ? `art-${current.productHref.split('/').pop()}` : undefined} share="morph" default="none">
                <MediaImage media={current.image} alt={current.title} ratio={current.ratio} seed={current.seed} medium={current.medium} style={styles[open!]} floor={current.floor} sizes="(min-width: 1024px) 60vw, 100vw" className="mx-auto max-h-[70dvh] w-auto" />
              </ViewTransition>
            </div>
            <div className="grid content-start gap-4 p-6 lg:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Shares the piece's shop page, or this page; a real photo goes along as a file where the phone allows it. */}
                <ShareButton label={t.share} text={t.shareText} links={[{ title: current.title, href: current.productHref ?? '' }]} image={photoSrc(current.image)} />
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
