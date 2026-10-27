'use client'

import { useSaved } from './cart-store'

/** Little number on the "Saved" icon, styled like CartCount. The hidden word makes the link read "Saved, 2 saved". */
export function SavedCount({ label }: { label: string }) {
  const count = useSaved().length
  if (!count) return null
  return (
    // Keyed by the count so the badge presses in again each time it changes.
    <span key={count} className="tab-bloom absolute -top-1 -right-2 grid min-w-6 place-items-center rounded-full bg-accent px-1.5 text-base leading-6 font-semibold text-white">
      {count}
      <span className="sr-only"> {label}</span>
    </span>
  )
}
