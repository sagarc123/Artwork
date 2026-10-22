'use client'

import { useCart } from './cart-store'

/** Little number on the cart icon. */
export function CartCount() {
  const count = useCart().reduce((n, l) => n + l.qty, 0)
  if (!count) return null
  return (
    <span className="tab-bloom absolute -top-1 -right-2 grid min-w-6 place-items-center rounded-full bg-kumkum px-1.5 text-[0.875rem] leading-6 font-semibold text-white">
      {count}
    </span>
  )
}
