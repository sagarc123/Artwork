'use client'

import { MessageCircle, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import type { Dictionary } from '@/i18n/dictionaries'
import { formatPrice, whatsappLink } from '@/lib/site'
import { cartActions } from './cart-store'
import { pinch } from './pinch'

type Variant = { id: string; label: string; price: number; compareAtPrice?: number | null; stock: number }
type Frame = { id: string; label: string; extraPrice: number }
type Props = { slug: string; title: string; variants: Variant[]; framing: Frame[]; t: Dictionary['shop']; cart: Dictionary['cart']; cartHref: string }

/** Size and frame choice with a live price; ordering continues on WhatsApp until online payment arrives. */
export function ProductBuy({ slug, title, variants, framing, t, cart, cartHref }: Props) {
  const [added, setAdded] = useState(false)
  const [v, setV] = useState(Math.max(0, variants.findIndex((x) => x.stock > 0)))
  const [f, setF] = useState(-1)
  const variant = variants[v]
  const frame = f >= 0 ? framing[f] : null
  const total = variant.price + (frame?.extraPrice ?? 0)
  const soldOut = variants.every((x) => x.stock <= 0)
  const message = `${t.waOrder}: ${title} — ${variant.label}${frame ? `, ${frame.label}` : ''} (${formatPrice(total)})`

  const option = 'flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-ui border-[1.5px] border-border px-4 has-checked:border-charcoal has-checked:bg-charcoal/5 has-disabled:opacity-50'

  return (
    <div className="grid gap-6">
      <p className="text-h2 font-semibold">
        {formatPrice(total)}
        {variant.compareAtPrice && variant.compareAtPrice > variant.price && <s className="ml-3 text-h3 font-normal text-muted">{formatPrice(variant.compareAtPrice)}</s>}
      </p>

      {variants.length > 1 && (
        <fieldset className="grid gap-2">
          <legend className="mb-2 font-semibold">{t.size}</legend>
          {variants.map((x, i) => (
            <label key={x.label} className={option}>
              <span className="flex items-center gap-3">
                <input type="radio" name="variant" checked={v === i} disabled={x.stock <= 0} onChange={() => setV(i)} className="size-5 accent-charcoal" />
                {x.label}
              </span>
              <span>{x.stock <= 0 ? t.sold : formatPrice(x.price)}</span>
            </label>
          ))}
        </fieldset>
      )}

      {framing.length > 0 && (
        <fieldset className="grid gap-2">
          <legend className="mb-2 font-semibold">{t.frame}</legend>
          {[{ id: '', label: t.noFrame, extraPrice: 0 }, ...framing].map((x, i) => (
            <label key={x.label} className={option}>
              <span className="flex items-center gap-3">
                <input type="radio" name="frame" checked={f === i - 1} onChange={() => setF(i - 1)} className="size-5 accent-charcoal" />
                {x.label}
              </span>
              {x.extraPrice > 0 && <span>+{formatPrice(x.extraPrice)}</span>}
            </label>
          ))}
        </fieldset>
      )}

      {soldOut ? (
        <p className="rounded-ui bg-kumkum px-4 py-3 font-semibold text-white">{t.sold}</p>
      ) : (
        <div className="grid gap-3">
          <button
            type="button"
            onClick={(e) => {
              cartActions.add({ slug, variantId: variant.id, frameId: frame?.id, qty: 1 })
              pinch(e.currentTarget, 'cart')
              setAdded(true)
            }}
            className="press inline-flex h-13 items-center justify-center gap-2 rounded-ui bg-kumkum px-6 font-semibold text-white hover:bg-kumkum/90"
          >
            <ShoppingCart aria-hidden="true" className="size-6" />
            {cart.add}
          </button>
          {added && (
            <p role="status" className="flex flex-wrap items-center gap-x-3 font-semibold text-leaf">
              {cart.added} ✓
              <Link href={cartHref} className="ink-link text-peacock">
                {cart.view}
              </Link>
            </p>
          )}
          <a href={whatsappLink(message)} target="_blank" rel="noopener noreferrer" className="ink-link inline-flex min-h-11 items-center gap-2 justify-self-start font-semibold text-leaf">
            <MessageCircle aria-hidden="true" className="size-5" />
            {t.order}
          </a>
        </div>
      )}
    </div>
  )
}
