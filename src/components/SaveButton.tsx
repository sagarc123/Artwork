'use client'

import { Heart } from 'lucide-react'
import { savedActions, useSaved } from './cart-store'
import { useHydrated } from './local-store'

/** "Save" / "Saved" toggle with a heart and words (never icon-only). Keeps the piece on this device. */
export function SaveButton({ slug, title, labels, className = '' }: { slug: string; title: string; labels: { save: string; saved: string }; className?: string }) {
  const list = useSaved()
  // Server HTML and hydration show "Save"; the real state appears right after, without a layout jump.
  const on = useHydrated() && list.includes(slug)
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`${on ? labels.saved : labels.save}: ${title}`}
      onClick={() => savedActions.toggle(slug)}
      className={`press inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border-[1.5px] border-charcoal bg-surface px-3 font-semibold text-charcoal aria-pressed:border-kumkum aria-pressed:text-kumkum ${className}`}
    >
      <Heart aria-hidden="true" className={`size-5 ${on ? 'tab-bloom fill-kumkum' : ''}`} />
      {on ? labels.saved : labels.save}
    </button>
  )
}
