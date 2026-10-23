'use client'

import { RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { CartLine } from '@/lib/cart'
import { cartActions } from './cart-store'

/** Puts the same pieces back in the cart (prices and stock are checked again there) and opens it. */
export function OrderAgain({ lines, label, cartHref }: { lines: CartLine[]; label: string; cartHref: string }) {
  const router = useRouter()
  if (lines.length === 0) return null
  return (
    <button
      type="button"
      onClick={() => {
        for (const line of lines) cartActions.add(line)
        router.push(cartHref)
      }}
      className="press inline-flex h-13 items-center justify-center gap-2 rounded-ui border-[1.5px] border-charcoal px-6 font-semibold hover:bg-charcoal hover:text-paper sm:justify-self-start"
    >
      <RotateCcw aria-hidden="true" className="size-5" />
      {label}
    </button>
  )
}
