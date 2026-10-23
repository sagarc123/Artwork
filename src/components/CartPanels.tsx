'use client'

import { MessageCircle, Minus, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Dictionary } from '@/i18n/dictionaries'
import { GIFT_NOTE_MAX, giftWrapCharge, orderTotal, reconcileCart, type CartLine, type CodBlock, type Quote, type QuoteLine } from '@/lib/cart'
import { formatPrice, site, whatsappLink } from '@/lib/site'
import type { Media } from '@/payload-types'
import { confirmPayment, getCartQuote, placeOrder, type CheckoutField } from '@/server/orders'
import { lookupPincode } from '@/server/pincode'
import { DeliveryPromise } from './DeliveryPromise'
import { cartActions, useCart } from './cart-store'
import { pickMedium } from '@/lib/art'
import { MediaImage } from './MediaImage'
import { useHydrated } from './local-store'

type T = Pick<Dictionary, 'cart' | 'checkout' | 'forms' | 'shop'>
type Extra = { label: string; amount: number }


/** Quotes the cart; with a pincode, cash on delivery is checked for it too. */
function useQuote(locale: string, pincode = '') {
  const lines = useCart()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quotedFor, setQuotedFor] = useState<CartLine[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [removed, setRemoved] = useState(0)
  useEffect(() => {
    // An empty cart needs no quote. This also keeps the cart clearing after an order from firing an action from the next page.
    if (lines.length === 0) return
    let live = true
    getCartQuote(lines, locale, pincode || undefined)
      .then((q) => {
        if (!live) return
        // Pieces that left the shop (sold, unpublished, renamed) leave the cart too, so the count and the list agree.
        const fixed = reconcileCart(lines, q.lines)
        if (fixed) {
          if (fixed.removed) setRemoved((n) => n + fixed.removed)
          cartActions.replace(fixed.lines)
        }
        setQuote(q)
        setQuotedFor(lines)
        setFailed(false)
      })
      .catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [lines, locale, pincode, attempt])
  // The old quote stays on screen while a new one loads; editing waits for it.
  const pending = quotedFor !== lines
  return { lines, quote, pending, failed, removed, retry: () => setAttempt((n) => n + 1), hydrated: useHydrated() }
}

/** Says plainly that pieces were taken out of the cart, instead of a vague "check your cart". */
function RemovedNote({ count, t }: { count: number; t: T['cart'] }) {
  if (!count) return null
  return (
    <p role="status" className="rounded-ui border-2 border-marigold bg-surface p-4 font-semibold">
      {count === 1 ? t.removedOne : t.removedMany.replace('{n}', String(count))}
    </p>
  )
}

function QuoteError({ t, retry }: { t: T['checkout']['errors']; retry: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-ui border-2 border-kumkum bg-surface p-4">
      <p className="font-semibold">{t.quote}</p>
      <button type="button" onClick={retry} className="min-h-11 rounded-ui border border-border px-4 font-semibold hover:bg-charcoal/5">
        {t.retry}
      </button>
    </div>
  )
}

const toLine = (l: QuoteLine) => ({ slug: l.slug, variantId: l.variantId, frameId: l.frameId, qty: l.qty })

/** Subtotal, delivery and any extras (COD fee, gift wrap), then the total. */
function Totals({ quote, t, extras = [] }: { quote: Quote; t: T['cart']; extras?: Extra[] }) {
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-y-2 border-t border-border/30 pt-4">
      <dt>{t.subtotal}</dt>
      <dd>{formatPrice(quote.subtotal)}</dd>
      <dt>{t.shipping}</dt>
      <dd>{quote.shipping ? formatPrice(quote.shipping) : t.free}</dd>
      {extras.map((x) => (
        <div key={x.label} className="contents">
          <dt>{x.label}</dt>
          <dd>{formatPrice(x.amount)}</dd>
        </div>
      ))}
      <dt className="text-h3 font-semibold">{t.total}</dt>
      <dd className="text-h3 font-semibold">{formatPrice(quote.total + extras.reduce((sum, x) => sum + x.amount, 0))}</dd>
      <dd className="col-span-2 text-muted">
        {t.gst} {t.freeFrom}
      </dd>
    </dl>
  )
}

function Lines({ quote, t, editable, busy = false }: { quote: Quote; t: T['cart']; editable: boolean; busy?: boolean }) {
  const btn = 'grid size-11 place-items-center rounded-ui border border-border hover:bg-charcoal/5 disabled:opacity-40'
  return (
    <ul className="grid gap-5">
      {quote.lines.map((l) => (
        <li key={l.key} className="grid grid-cols-[5rem_1fr] gap-4 sm:grid-cols-[6rem_1fr]">
          <div className="self-start bg-surface p-1.5 shadow-frame">
            <MediaImage media={l.image as Media | null} alt={l.title} ratio="4/5" seed={l.slug} medium={pickMedium([l.title], l.slug)} floor="charcoal" sizes="96px" />
          </div>
          <div className="grid content-start gap-1">
            <p className="font-heading text-h3-sm">{l.title}</p>
            <p className="text-muted">{[l.variantLabel, l.frameLabel].filter(Boolean).join(' · ')}</p>
            <p className="font-semibold">
              {formatPrice(l.lineTotal)}
              {l.wasTotal && <s className="ml-2 font-normal text-muted">{formatPrice(l.wasTotal)}</s>}
            </p>
            {!l.available && <p className="font-semibold text-kumkum">{t.unavailable}</p>}
            {editable && (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {l.type === 'print' && (
                  <div role="group" aria-label={t.qty} className="flex items-center gap-2">
                    <button type="button" aria-label={t.less} disabled={busy || l.qty <= 1} onClick={() => cartActions.setQty(toLine(l), l.qty - 1)} className={btn}>
                      <Minus aria-hidden="true" className="size-5" />
                    </button>
                    <span className="min-w-8 text-center font-semibold">{l.qty}</span>
                    <button type="button" aria-label={t.more} disabled={busy || l.qty >= l.maxQty} onClick={() => cartActions.setQty(toLine(l), l.qty + 1)} className={btn}>
                      <Plus aria-hidden="true" className="size-5" />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => cartActions.remove(toLine(l))}
                  className="ml-auto flex min-h-11 items-center gap-1 px-2 text-kumkum underline underline-offset-4 disabled:opacity-40"
                >
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
  const { lines, quote, pending, failed, removed, retry, hydrated } = useQuote(locale)
  if (!hydrated) return <p className="text-muted">{t.cart.loading}</p>
  if (lines.length === 0)
    return (
      <div className="grid justify-items-center gap-5 rounded-ui bg-surface p-10 text-center">
        <RemovedNote count={removed} t={t.cart} />
        <p className="font-heading text-h3">{t.cart.empty}</p>
        <Link href={shopHref} className="press inline-flex h-13 items-center rounded-ui bg-kumkum px-6 font-semibold text-white">
          {t.cart.browse}
        </Link>
      </div>
    )
  if (!quote) return failed ? <QuoteError t={t.checkout.errors} retry={retry} /> : <p className="text-muted">{t.cart.loading}</p>
  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="grid content-start gap-5 lg:col-span-7">
        {failed && pending && <QuoteError t={t.checkout.errors} retry={retry} />}
        <RemovedNote count={removed} t={t.cart} />
        <Lines quote={quote} t={t.cart} editable busy={pending} />
      </div>
      <div className="grid content-start gap-6 rounded-ui bg-surface p-6 shadow-frame lg:sticky lg:top-32 lg:col-span-5 lg:self-start">
        <h2 className="font-heading text-h2">{t.checkout.summary}</h2>
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

/** /checkout: details → address → Razorpay (UPI shown first) or cash on delivery. */
export function CheckoutForm({ locale, t, orderPath, cartHref }: { locale: string; t: T; orderPath: string; cartHref: string }) {
  const router = useRouter()
  const [pincode, setPincode] = useState('')
  const pin = /^[1-9]\d{5}$/.test(pincode) ? pincode : ''
  const { lines, quote, pending, failed, removed, retry, hydrated } = useQuote(locale, pin)
  const [mode, setMode] = useState<'prepaid' | 'cod'>('prepaid')
  // The server may refuse COD for reasons the quote can't know (an open COD order on this phone).
  const [codRefused, setCodRefused] = useState<CodBlock | null>(null)
  const [wantsGst, setWantsGst] = useState(false)
  const [giftWrap, setGiftWrap] = useState(false)
  // City and state filled in from the pincode (India Post). Only fields the buyer hasn't changed get overwritten.
  const [filledFrom, setFilledFrom] = useState('')
  const autoFilled = useRef({ city: '', state: 'Maharashtra' })
  useEffect(() => {
    if (!pin) return
    let live = true
    lookupPincode(pin)
      .then((place) => {
        const form = formRef.current
        if (!live || !place || !form) return
        for (const name of ['city', 'state'] as const) {
          const el = form.elements.namedItem(name) as HTMLInputElement | null
          if (el && (el.value.trim() === '' || el.value === autoFilled.current[name])) el.value = autoFilled.current[name] = place[name]
        }
        setFilledFrom(pin)
      })
      .catch(() => {}) // never blocks checkout: the buyer types them
    return () => {
      live = false
    }
  }, [pin])
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<CheckoutField[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [notReady, setNotReady] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  // Bumped after a failed attempt: focus the first invalid field, or else the error message.
  const [problem, setProblem] = useState(0)
  useEffect(() => {
    if (!problem) return
    const el = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-problem]')
    el?.scrollIntoView({ block: 'center' })
    el?.focus({ preventScroll: true })
  }, [problem])
  const stop = () => {
    setBusy(false)
    setProblem((n) => n + 1)
  }

  const online = quote?.online ?? true
  const cod = quote?.cod
  const codReason = cod?.block ?? codRefused
  const payMode: 'prepaid' | 'cod' = (mode === 'cod' || !online) && cod && !codReason ? 'cod' : 'prepaid'
  const codText = (b: CodBlock) => t.checkout.codBlocked[b].replace('{max}', formatPrice(cod?.maxTotal ?? 0)).replace('{pincode}', pin)
  const physical = quote?.lines.some((l) => l.type !== 'digital') ?? false
  const giftFee = quote ? giftWrapCharge(giftWrap, quote.lines, quote.giftWrapFee ?? 0) : 0
  const codFee = payMode === 'cod' && cod ? cod.fee : 0
  const extras: Extra[] = [
    ...(codFee ? [{ label: t.checkout.codFee, amount: codFee }] : []),
    ...(giftFee ? [{ label: t.cart.giftWrap, amount: giftFee }] : []),
  ]
  const toPay = quote ? orderTotal(quote, codFee, giftFee) : 0

  if (!hydrated) return <p className="text-muted">{t.cart.loading}</p>
  if (lines.length === 0)
    return (
      <div className="grid justify-items-center gap-4 rounded-ui bg-surface p-8 text-center">
        <RemovedNote count={removed} t={t.cart} />
        <Link href={cartHref} className="ink-link font-semibold text-peacock">
          {t.cart.empty}
        </Link>
      </div>
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
      paymentMode: payMode,
      gst: wantsGst ? { gstin: get('gstin'), businessName: get('businessName') } : null,
      giftWrap,
      giftNote: giftWrap ? get('giftNote') : '',
    }
    setBusy(true)
    setMessage(null)
    let opened = false // Once Razorpay is open, its callbacks end the busy state.
    try {
      const result = await placeOrder(input)
      setErrors(result.status === 'invalid' ? result.errors : [])
      if (result.status === 'not_ready' && quote) {
        const items = quote.lines.map((l) => `• ${l.title} (${[l.variantLabel, l.frameLabel].filter(Boolean).join(', ')}) × ${l.qty} — ${formatPrice(l.lineTotal)}`)
        const addr = [input.address.line1, input.address.line2, input.address.city, input.address.state, input.address.pincode].filter(Boolean).join(', ')
        setNotReady([t.shop.waOrder, ...items, ...(giftFee ? [`${t.cart.giftWrap}: ${formatPrice(giftFee)}`] : []), `${t.cart.total}: ${formatPrice(quote.total + giftFee)}`, `${input.customer.name}, ${addr}`].join('\n'))
      }
      if (result.status === 'cod') {
        opened = true // stays busy while the order page loads
        cartActions.clear()
        return router.push(`${orderPath}/${result.publicId}`)
      }
      if (result.status === 'cod_blocked') {
        setCodRefused(result.reason)
        setMessage(codText(result.reason))
      }
      if (result.status === 'sold_out') setMessage(`${t.checkout.errors.soldOut} ${result.title}`)
      if (result.status === 'unavailable' || result.status === 'failed' || result.status === 'rate') setMessage(t.checkout.errors[result.status])
      if (result.status !== 'ok') return

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
          try {
            const confirmed = await confirmPayment(response)
            if (confirmed.status === 'paid') {
              cartActions.clear()
              return router.push(`${orderPath}/${confirmed.publicId}`)
            }
          } catch {
            // Shown as "could not confirm" below; the webhook still records the payment.
          }
          setMessage(t.checkout.errors.verify)
          stop()
        },
        modal: {
          ondismiss: () => {
            setMessage(t.checkout.errors.cancelled)
            stop()
          },
        },
      }).open()
      opened = true
    } catch {
      setMessage(t.checkout.errors.failed)
    } finally {
      if (!opened) stop()
    }
  }

  const c = t.checkout
  const input = 'h-13 w-full rounded-ui border border-border bg-surface px-4 aria-invalid:border-2 aria-invalid:border-kumkum'
  const option = 'flex cursor-pointer gap-3 rounded-ui border border-border bg-surface p-4 has-checked:border-2 has-checked:border-kumkum has-disabled:cursor-not-allowed has-disabled:opacity-60'
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
      <form ref={formRef} onSubmit={submit} noValidate className="grid content-start gap-8 lg:col-span-7">
        <fieldset className="grid gap-5">
          <legend className="mb-2 font-heading text-h2">{c.details}</legend>
          {field('name', `${t.forms.name} ${t.forms.required}`, { autoComplete: 'name', required: true })}
          {field('phone', `${t.forms.phone} ${t.forms.required}`, { type: 'tel', inputMode: 'numeric', autoComplete: 'tel-national', required: true, onChange: () => setCodRefused(null) })}
          {field('email', `${t.forms.email} ${t.forms.optional}`, { type: 'email', autoComplete: 'email' })}
        </fieldset>
        <fieldset className="grid gap-5">
          <legend className="mb-2 font-heading text-h2">{c.address}</legend>
          {field('pincode', `${c.pincode} (${c.pincodeHint})`, { inputMode: 'numeric', maxLength: 6, autoComplete: 'postal-code', required: true, onChange: (e: { target: HTMLInputElement }) => setPincode(e.target.value.trim()) })}
          {filledFrom && filledFrom === pin && (
            <p role="status" className="-mt-3 text-muted">
              {c.pincodeFilled}
            </p>
          )}
          {field('line1', c.line1, { autoComplete: 'address-line1', required: true })}
          {field('line2', c.line2, { autoComplete: 'address-line2' })}
          <div className="grid gap-5 sm:grid-cols-2">
            {field('city', c.city, { autoComplete: 'address-level2', required: true })}
            {field('state', c.state, { autoComplete: 'address-level1', defaultValue: 'Maharashtra', required: true })}
          </div>
          {field('note', c.note)}
        </fieldset>
        {physical && quote && (
          <fieldset className="grid gap-4">
            <legend className="mb-2 font-heading text-h3">{c.gift}</legend>
            <label className="flex min-h-11 items-center gap-3 font-semibold">
              <input type="checkbox" checked={giftWrap} onChange={(e) => setGiftWrap(e.target.checked)} className="size-5 accent-kumkum" />
              {c.giftWrap.replace('{fee}', formatPrice(quote.giftWrapFee ?? 0))}
            </label>
            {giftWrap && (
              <div className="grid gap-2">
                <label htmlFor="giftNote" className="font-semibold">
                  {c.giftNote}
                </label>
                <p id="giftNote-hint" className="-mt-1 text-muted">
                  {c.giftNoteHint}
                </p>
                <textarea id="giftNote" name="giftNote" rows={3} maxLength={GIFT_NOTE_MAX} aria-describedby="giftNote-hint" className="w-full rounded-ui border border-border bg-surface p-4" />
              </div>
            )}
          </fieldset>
        )}
        {/* Rarely needed, so folded away at the end; opening it is what asks for the GST invoice. */}
        <details open={wantsGst} onToggle={(e) => setWantsGst(e.currentTarget.open)} className="group rounded-ui border border-border/40 px-4">
          <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 font-semibold">
            <span>
              {c.business} <span className="font-normal text-muted">{c.businessHint}</span>
            </span>
            <span aria-hidden="true" className="text-xl transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          {wantsGst && (
            <div className="grid gap-5 pb-4 sm:grid-cols-2">
              {field('gstin', c.gstin, { maxLength: 15, autoCapitalize: 'characters', spellCheck: false, required: true })}
              {field('businessName', c.businessName, { autoComplete: 'organization', required: true })}
            </div>
          )}
        </details>
        <fieldset className="grid gap-4">
          <legend className="mb-2 font-heading text-h2">{c.payment}</legend>
          <label className={option}>
            <input type="radio" name="paymentMode" value="prepaid" checked={payMode === 'prepaid'} disabled={!online} onChange={() => setMode('prepaid')} className="mt-1 size-5 accent-kumkum" />
            <span className="grid gap-1">
              <span className="font-semibold">{c.payOnline}</span>
              <span className="text-muted">{online ? c.safe : c.payOnlineOff}</span>
            </span>
          </label>
          {cod && (
            <label className={option}>
              <input type="radio" name="paymentMode" value="cod" checked={payMode === 'cod'} disabled={!!codReason} onChange={() => setMode('cod')} className="mt-1 size-5 accent-kumkum" />
              <span className="grid gap-1">
                <span className="font-semibold">{c.cod}</span>
                <span className={codReason ? 'font-semibold text-kumkum' : 'text-muted'}>
                  {codReason ? codText(codReason) : c.codHint.replace('{fee}', formatPrice(cod.fee)).replace('{max}', formatPrice(cod.maxTotal))}
                </span>
              </span>
            </label>
          )}
          {message && (
            <p role="alert" tabIndex={-1} data-problem className="rounded-ui border-2 border-kumkum bg-surface p-4 font-semibold">
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
            <button type="submit" disabled={busy || pending || !quote?.ok} className="press h-13 rounded-ui bg-kumkum px-6 font-semibold text-white disabled:opacity-60 sm:justify-self-start">
              {payMode === 'cod'
                ? busy
                  ? c.placing
                  : c.codButton.replace('{amount}', formatPrice(toPay))
                : busy
                  ? c.paying
                  : online
                    ? c.payButton.replace('{amount}', quote ? formatPrice(toPay) : '')
                    : c.sendWhatsapp}
            </button>
          )}
        </fieldset>
      </form>
      <aside className="grid content-start gap-6 rounded-ui bg-surface p-6 shadow-frame lg:sticky lg:top-32 lg:col-span-5 lg:self-start">
        <h2 className="font-heading text-h2">{c.summary}</h2>
        {failed && (pending || !quote) && <QuoteError t={c.errors} retry={retry} />}
        {quote ? (
          <>
            <Lines quote={quote} t={t.cart} editable={false} />
            <Totals quote={quote} t={t.cart} extras={extras} />
            {physical && <DeliveryPromise locale={locale} deliveredBy={t.shop.deliveredBy} cod={cod && !codReason ? t.shop.codAvailable : null} />}
          </>
        ) : (
          !failed && <p className="text-muted">{t.cart.loading}</p>
        )}
      </aside>
    </div>
  )
}
