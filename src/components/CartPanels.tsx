'use client'

import { MessageCircle, Minus, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import type { Dictionary } from '@/i18n/dictionaries'
import type { Quote, QuoteLine } from '@/lib/cart'
import { formatPrice, site, whatsappLink } from '@/lib/site'
import type { Media } from '@/payload-types'
import { confirmPayment, getCartQuote, placeOrder, type CheckoutField } from '@/server/orders'
import { cartActions, useCart } from './cart-store'
import { MediaImage } from './MediaImage'

type T = Pick<Dictionary, 'cart' | 'checkout' | 'forms' | 'shop'>

function useQuote(locale: string) {
  const lines = useCart()
  const [quote, setQuote] = useState<Quote | null>(null)
  useEffect(() => {
    let live = true
    getCartQuote(lines, locale).then((q) => live && setQuote(q))
    return () => {
      live = false
    }
  }, [lines, locale])
  return { lines, quote }
}

const toLine = (l: QuoteLine) => ({ slug: l.slug, variantId: l.variantId, frameId: l.frameId, qty: l.qty })

function Totals({ quote, t }: { quote: Quote; t: T['cart'] }) {
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-y-2 border-t border-border/30 pt-4">
      <dt>{t.subtotal}</dt>
      <dd>{formatPrice(quote.subtotal)}</dd>
      <dt>{t.shipping}</dt>
      <dd>{quote.shipping ? formatPrice(quote.shipping) : t.free}</dd>
      <dt className="text-h3 font-semibold">{t.total}</dt>
      <dd className="text-h3 font-semibold">{formatPrice(quote.total)}</dd>
      <dd className="col-span-2 text-muted">
        {t.gst} {t.freeFrom}
      </dd>
    </dl>
  )
}

function Lines({ quote, t, editable }: { quote: Quote; t: T['cart']; editable: boolean }) {
  const btn = 'grid size-11 place-items-center rounded-ui border border-border hover:bg-charcoal/5 disabled:opacity-40'
  return (
    <ul className="grid gap-5">
      {quote.lines.map((l) => (
        <li key={l.key} className="grid grid-cols-[5rem_1fr] gap-4 sm:grid-cols-[6rem_1fr]">
          <div className="bg-surface p-1.5 shadow-frame">
            <MediaImage media={l.image as Media | null} alt={l.title} ratio="4/5" seed={l.slug} floor="charcoal" sizes="96px" />
          </div>
          <div className="grid content-start gap-1">
            <p className="font-heading text-h3-sm">{l.title}</p>
            <p className="text-muted">{[l.variantLabel, l.frameLabel].filter(Boolean).join(' · ')}</p>
            <p className="font-semibold">{formatPrice(l.lineTotal)}</p>
            {!l.available && <p className="font-semibold text-kumkum">{t.unavailable}</p>}
            {editable && (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {l.type === 'print' && (
                  <div role="group" aria-label={t.qty} className="flex items-center gap-2">
                    <button type="button" aria-label={t.less} disabled={l.qty <= 1} onClick={() => cartActions.setQty(toLine(l), l.qty - 1)} className={btn}>
                      <Minus aria-hidden="true" className="size-5" />
                    </button>
                    <span className="min-w-8 text-center font-semibold">{l.qty}</span>
                    <button type="button" aria-label={t.more} disabled={l.qty >= l.maxQty} onClick={() => cartActions.setQty(toLine(l), l.qty + 1)} className={btn}>
                      <Plus aria-hidden="true" className="size-5" />
                    </button>
                  </div>
                )}
                <button type="button" onClick={() => cartActions.remove(toLine(l))} className="ml-auto flex min-h-11 items-center gap-1 px-2 text-kumkum underline underline-offset-4">
                  <Trash2 aria-hidden="true" className="size-5" />
                  {t.remove}
                </button>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

/** /cart */
export function CartPage({ locale, t, checkoutHref, shopHref }: { locale: string; t: T; checkoutHref: string; shopHref: string }) {
  const { lines, quote } = useQuote(locale)
  if (lines.length === 0)
    return (
      <div className="grid justify-items-center gap-5 rounded-ui bg-surface p-10 text-center">
        <p className="font-heading text-h3">{t.cart.empty}</p>
        <Link href={shopHref} className="press inline-flex h-13 items-center rounded-ui bg-kumkum px-6 font-semibold text-white">
          {t.cart.browse}
        </Link>
      </div>
    )
  if (!quote) return <p className="text-muted">{t.cart.loading}</p>
  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <Lines quote={quote} t={t.cart} editable />
      </div>
      <div className="grid content-start gap-6 rounded-ui bg-surface p-6 shadow-frame lg:sticky lg:top-32 lg:col-span-5">
        <Totals quote={quote} t={t.cart} />
        {quote.ok ? (
          <Link href={checkoutHref} className="press inline-flex h-13 items-center justify-center rounded-ui bg-kumkum px-6 font-semibold text-white">
            {t.cart.toPayment}
          </Link>
        ) : (
          <p className="font-semibold text-kumkum">{t.checkout.errors.unavailable}</p>
        )}
      </div>
    </div>
  )
}

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
type RazorpayCtor = new (options: Record<string, unknown>) => { open(): void }

function loadRazorpay(): Promise<RazorpayCtor> {
  const w = window as unknown as { Razorpay?: RazorpayCtor }
  if (w.Razorpay) return Promise.resolve(w.Razorpay)
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => (w.Razorpay ? resolve(w.Razorpay) : reject(new Error('Razorpay missing')))
    s.onerror = reject
    document.body.append(s)
  })
}

/** /checkout: details → address → Razorpay (UPI shown first). */
export function CheckoutForm({ locale, t, orderPath, cartHref }: { locale: string; t: T; orderPath: string; cartHref: string }) {
  const router = useRouter()
  const { lines, quote } = useQuote(locale)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<CheckoutField[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [notReady, setNotReady] = useState<string | null>(null)

  if (lines.length === 0)
    return (
      <p className="rounded-ui bg-surface p-8 text-center">
        <Link href={cartHref} className="ink-link font-semibold text-peacock">
          {t.cart.empty}
        </Link>
      </p>
    )

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const get = (k: string) => String(f.get(k) ?? '')
    const input = {
      lines,
      locale,
      customer: { name: get('name'), phone: get('phone'), email: get('email') },
      address: { line1: get('line1'), line2: get('line2'), city: get('city'), state: get('state'), pincode: get('pincode') },
      note: get('note'),
    }
    setBusy(true)
    setMessage(null)
    const result = await placeOrder(input)
    setErrors(result.status === 'invalid' ? result.errors : [])
    if (result.status === 'not_ready' && quote) {
      const items = quote.lines.map((l) => `• ${l.title} (${[l.variantLabel, l.frameLabel].filter(Boolean).join(', ')}) × ${l.qty} — ${formatPrice(l.lineTotal)}`)
      const addr = [input.address.line1, input.address.line2, input.address.city, input.address.state, input.address.pincode].filter(Boolean).join(', ')
      setNotReady([t.shop.waOrder, ...items, `${t.cart.total}: ${formatPrice(quote.total)}`, `${input.customer.name}, ${addr}`].join('\n'))
    }
    if (result.status === 'sold_out') setMessage(`${t.checkout.errors.soldOut} ${result.title}`)
    if (result.status === 'unavailable' || result.status === 'failed') setMessage(t.checkout.errors[result.status])
    if (result.status !== 'ok') return setBusy(false)

    try {
      const Razorpay = await loadRazorpay()
      new Razorpay({
        key: result.keyId,
        order_id: result.razorpayOrderId,
        amount: result.amount,
        currency: 'INR',
        name: site.brandName,
        description: result.orderNumber,
        prefill: { name: input.customer.name, email: input.customer.email, contact: input.customer.phone },
        theme: { color: '#A6261D' },
        // UPI first: what most buyers in India use.
        config: { display: { blocks: { upi: { name: 'UPI', instruments: [{ method: 'upi' }] } }, sequence: ['block.upi'], preferences: { show_default_blocks: true } } },
        handler: async (response: RazorpayResponse) => {
          const confirmed = await confirmPayment(response)
          if (confirmed.status === 'paid') {
            cartActions.clear()
            router.push(`${orderPath}/${confirmed.publicId}`)
          } else {
            setMessage(t.checkout.errors.verify)
            setBusy(false)
          }
        },
        modal: {
          ondismiss: () => {
            setMessage(t.checkout.errors.cancelled)
            setBusy(false)
          },
        },
      }).open()
    } catch {
      setMessage(t.checkout.errors.failed)
      setBusy(false)
    }
  }

  const c = t.checkout
  const input = 'h-13 w-full rounded-ui border border-border bg-surface px-4 aria-invalid:border-2 aria-invalid:border-kumkum'
  const field = (name: CheckoutField | 'line2' | 'note', label: string, props: Record<string, unknown> = {}) => (
    <div className="grid gap-2">
      <label htmlFor={name} className="font-semibold">
        {label}
      </label>
      <input id={name} name={name} className={input} aria-invalid={errors.includes(name as CheckoutField)} aria-describedby={errors.includes(name as CheckoutField) ? `${name}-error` : undefined} {...props} />
      {errors.includes(name as CheckoutField) && (
        <p id={`${name}-error`} className="font-semibold text-kumkum">
          {c.errors[name as CheckoutField]}
        </p>
      )}
    </div>
  )

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <form onSubmit={submit} noValidate className="grid content-start gap-8 lg:col-span-7">
        <fieldset className="grid gap-5">
          <legend className="mb-2 font-heading text-h2">{c.details}</legend>
          {field('name', `${t.forms.name} ${t.forms.required}`, { autoComplete: 'name', required: true })}
          {field('phone', `${t.forms.phone} ${t.forms.required}`, { type: 'tel', inputMode: 'numeric', autoComplete: 'tel-national', required: true })}
          {field('email', `${t.forms.email} ${t.forms.optional}`, { type: 'email', autoComplete: 'email' })}
        </fieldset>
        <fieldset className="grid gap-5">
          <legend className="mb-2 font-heading text-h2">{c.address}</legend>
          {field('pincode', `${c.pincode} (${c.pincodeHint})`, { inputMode: 'numeric', maxLength: 6, autoComplete: 'postal-code', required: true })}
          {field('line1', c.line1, { autoComplete: 'address-line1', required: true })}
          {field('line2', c.line2, { autoComplete: 'address-line2' })}
          <div className="grid gap-5 sm:grid-cols-2">
            {field('city', c.city, { autoComplete: 'address-level2', required: true })}
            {field('state', c.state, { autoComplete: 'address-level1', defaultValue: 'Maharashtra', required: true })}
          </div>
          {field('note', c.note)}
        </fieldset>
        <fieldset className="grid gap-4">
          <legend className="mb-2 font-heading text-h2">{c.payment}</legend>
          <p className="text-muted">{c.safe}</p>
          {message && (
            <p role="alert" className="rounded-ui border-2 border-kumkum bg-surface p-4 font-semibold">
              {message}
            </p>
          )}
          {notReady ? (
            <div role="status" className="grid gap-4 rounded-ui border-2 border-leaf bg-surface p-5">
              <p>{c.notReady}</p>
              <a href={whatsappLink(notReady)} target="_blank" rel="noopener noreferrer" className="press inline-flex h-13 items-center justify-center gap-2 rounded-ui bg-leaf px-6 font-semibold text-white">
                <MessageCircle aria-hidden="true" className="size-6" />
                {c.sendWhatsapp}
              </a>
            </div>
          ) : (
            <button type="submit" disabled={busy || !quote?.ok} className="press h-13 rounded-ui bg-kumkum px-6 font-semibold text-white disabled:opacity-60 sm:justify-self-start">
              {busy ? c.paying : `${c.pay} · ${quote ? formatPrice(quote.total) : ''}`}
            </button>
          )}
        </fieldset>
      </form>
      <aside className="grid content-start gap-6 rounded-ui bg-surface p-6 shadow-frame lg:sticky lg:top-32 lg:col-span-5">
        <h2 className="font-heading text-h2">{c.summary}</h2>
        {quote ? (
          <>
            <Lines quote={quote} t={t.cart} editable={false} />
            <Totals quote={quote} t={t.cart} />
          </>
        ) : (
          <p className="text-muted">{t.cart.loading}</p>
        )}
      </aside>
    </div>
  )
}
