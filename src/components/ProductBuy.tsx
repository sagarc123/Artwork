'use client'

import { MessageCircle, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState, type MouseEvent, type ReactNode, type RefObject } from 'react'
import type { Dictionary } from '@/i18n/dictionaries'
import { formatPrice, whatsappLink } from '@/lib/site'
import { flyToCart } from './cart-fly'
import { cartActions } from './cart-store'
import { pinch } from './pinch'
import { SoldBadge } from './SoldBadge'

type Variant = { id: string; label: string; price: number; compareAtPrice?: number | null; stock: number }
type Frame = { id: string; label: string; extraPrice: number }
type Props = {
  slug: string
  title: string
  /** Prints and originals get WhatsApp as a second (outline) button; downloads keep it as a link. */
  physical: boolean
  variants: Variant[]
  framing: Frame[]
  t: Dictionary['shop']
  cart: Dictionary['cart']
  cartHref: string
  /** Delivery date and COD line, shown just above the buttons. */
  promise?: ReactNode
}

const btn = 'press inline-flex items-center justify-center gap-2 rounded-ui font-semibold'
const primary = `${btn} text-white`
const outline = `${btn} border-[1.5px] border-leaf text-leaf hover:bg-leaf hover:text-white`

/** True while `ref` is out of reach: scrolled away above, or still below the fold (the bottom 140px are the bar and tab bar). */
function useOutOfReach(ref: RefObject<HTMLElement | null>) {
  const [past, setPast] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setPast(!e.isIntersecting), { rootMargin: '0px 0px -140px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return past
}

/** Size and frame choice with a live price; buy here or on WhatsApp, whichever the buyer trusts. */
export function ProductBuy({ slug, title, physical, variants, framing, t, cart, cartHref, promise }: Props) {
  const [added, setAdded] = useState(false)
  const [v, setV] = useState(Math.max(0, variants.findIndex((x) => x.stock > 0)))
  const [f, setF] = useState(-1)
  const actions = useRef<HTMLDivElement>(null)
  const barShown = useOutOfReach(actions)
  const variant = variants[v]
  const frame = f >= 0 ? framing[f] : null
  const total = variant.price + (frame?.extraPrice ?? 0)
  const was = variant.compareAtPrice && variant.compareAtPrice > variant.price ? variant.compareAtPrice + (frame?.extraPrice ?? 0) : null
  const soldOut = variants.every((x) => x.stock <= 0)
  const message = `${t.waOrder}: ${title} — ${variant.label}${frame ? `, ${frame.label}` : ''} (${formatPrice(total)})`
  const similarHref = whatsappLink(`${t.similarMessage}\n${title}`)
  const [flash, setFlash] = useState(false)
  const add = (e: MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget
    // Everyday: the picture flies to the cart first and the cart updates as it lands (at once when motion is off).
    // The cart updates at once (so opening it right away never shows it empty); the picture flying there is only decoration.
    cartActions.add({ slug, variantId: variant.id, frameId: frame?.id, qty: 1 })
    pinch(button, 'cart')
    setAdded(true)
    setFlash(document.documentElement.dataset.season !== 'festive')
    setTimeout(() => setFlash(false), 1800)
    // The product picture flies from itself, or from the button when the picture has scrolled out of view.
    const main = document.querySelector('.art-main > div')
    const box = main?.getBoundingClientRect()
    const onScreen = box && box.bottom > 0 && box.top < innerHeight
    void flyToCart(main, onScreen ? main : button)
  }

  const option = 'flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-ui border-[1.5px] border-border px-4 has-checked:border-charcoal has-checked:bg-charcoal/5 has-disabled:opacity-50'

  return (
    <div className="grid gap-6">
      {soldOut ? (
        <p className="flex flex-wrap items-center gap-3">
          <s className="text-h2 text-muted">{formatPrice(total)}</s>
          <SoldBadge label={t.sold} />
        </p>
      ) : (
        <p className="price-pill text-h2 font-semibold">
          {formatPrice(total)}
          {was && <s className="ml-3 text-h3 font-normal text-muted">{formatPrice(was)}</s>}
        </p>
      )}

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

      {framing.length > 0 && !soldOut && (
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
        // Sold: a calm note, and asking for a similar piece becomes the main action.
        <div ref={actions} className="grid gap-3">
          <p className="font-heading text-h3-sm">{t.soldHome}</p>
          <a href={similarHref} target="_blank" rel="noopener noreferrer" className={`${primary} h-13 bg-leaf px-6 hover:bg-leaf/90`}>
            <MessageCircle aria-hidden="true" className="size-6" />
            {t.soldSimilar}
          </a>
        </div>
      ) : (
        <div ref={actions} className="grid gap-3">
          {promise}
          {/* One primary per view: Add to cart is filled; WhatsApp is the outline alternative. */}
          <div className={`grid gap-3 ${physical ? 'sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2' : ''}`}>
            <button type="button" onClick={add} data-done={flash || undefined} className={`${primary} h-13 bg-kumkum px-6 hover:bg-kumkum/90`}>
              <ShoppingCart aria-hidden="true" className="size-6" />
              {flash ? cart.addedShort : cart.add}
            </button>
            {physical && (
              <a href={whatsappLink(message)} target="_blank" rel="noopener noreferrer" className={`${outline} h-13 px-6`}>
                <MessageCircle aria-hidden="true" className="size-6" />
                {t.order}
              </a>
            )}
          </div>
          {/* Always in the page so screen readers announce it when it fills. */}
          <div role="status" className="grid gap-3 empty:hidden">
            {added && (
              <>
                <p className="font-semibold text-leaf">{cart.added} ✓</p>
                <Link href={cartHref} className={`${btn} h-13 border-[1.5px] border-charcoal px-6 hover:bg-charcoal hover:text-paper`}>
                  {cart.view}
                </Link>
              </>
            )}
          </div>
          {!physical && (
            <a href={whatsappLink(message)} target="_blank" rel="noopener noreferrer" className="ink-link inline-flex min-h-11 items-center gap-2 justify-self-start font-semibold text-leaf">
              <MessageCircle aria-hidden="true" className="size-5" />
              {t.order}
            </a>
          )}
        </div>
      )}

      {/* Phones and tablets: price and the main action stay in reach once the buy box above has scrolled away. Sits on the tab bar. */}
      <div
        role="region"
        aria-label={t.buyBar}
        inert={!barShown}
        className={`fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-border/25 bg-surface/95 backdrop-blur transition-[translate,opacity] duration-200 lg:hidden ${barShown ? '' : 'pointer-events-none translate-y-4 opacity-0'}`}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-2">
          {soldOut ? (
            <>
              <SoldBadge label={t.sold} />
              <a href={similarHref} target="_blank" rel="noopener noreferrer" className={`${outline} min-h-12 px-4 py-2 text-left`}>
                <MessageCircle aria-hidden="true" className="size-5 shrink-0" />
                {t.soldSimilar}
              </a>
            </>
          ) : (
            <>
              <p className="grid leading-tight">
                <span className="text-h3-sm font-semibold">{formatPrice(total)}</span>
                {was && <s className="text-muted">{formatPrice(was)}</s>}
              </p>
              {added ? (
                <Link href={cartHref} className="press inline-flex h-12 items-center justify-center rounded-ui border-[1.5px] border-charcoal px-5 font-semibold">
                  {cart.view}
                </Link>
              ) : (
                <button type="button" onClick={add} className={`${primary} h-12 bg-kumkum px-5 hover:bg-kumkum/90`}>
                  <ShoppingCart aria-hidden="true" className="size-5" />
                  {cart.add}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
