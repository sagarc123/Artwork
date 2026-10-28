'use server'

import { randomBytes } from 'node:crypto'
import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { isLocale } from '@/i18n/config'
import { isPincode } from '@/lib/pincode'
import { applySale, CHILD_NAME_MAX, codBlock, GIFT_NOTE_MAX, giftWrapCharge, isCourseLine, needsSignIn, orderTotal, parsePincodes, priceCart, type CartLine, type CodBlock, type CodRules, type FestivalSale, type Quote } from '@/lib/cart'
import { isValidGstin } from '@/lib/gst'
import { normalisePhone } from '@/lib/enquiry'
import { createRazorpayOrder, razorpayConfig, verifyPaymentSignature } from '@/lib/razorpay'
import { cancelPlan } from '@/lib/orders'
import { cancelOrder, COD_HOLD_HOURS, expireHolds, holdStock, HOLD_MINUTES, markPaid, refreshProducts } from './order-service'
import { getCustomer } from './customer'
import { allow } from './rate-limit'
import { visitorId } from './visitor'

/** Accepts only well-formed cart lines from the browser. */
function cleanLines(input: unknown): CartLine[] {
  if (!Array.isArray(input)) return []
  return input.slice(0, 30).flatMap((l) => {
    if (!l || typeof l !== 'object') return []
    const { slug, variantId, frameId, qty, childName, consent } = l as Record<string, unknown>
    if (typeof slug !== 'string' || typeof variantId !== 'string' || slug.length > 120 || variantId.length > 60) return []
    return [
      {
        slug,
        variantId,
        frameId: typeof frameId === 'string' ? frameId.slice(0, 60) : undefined,
        qty: Number(qty) || 1,
        childName: typeof childName === 'string' ? childName.trim().slice(0, CHILD_NAME_MAX) : undefined,
        consent: consent === true,
      },
    ]
  })
}

async function settings(payload: Payload): Promise<{ cod: CodRules; giftWrapFee: number; sale: FestivalSale | null | undefined }> {
  const { cod, giftWrapFee, festivalSale } = await payload.findGlobal({ slug: 'commerce-settings', depth: 0 })
  // Fallbacks match the field defaults, for before the owner first saves the settings.
  return {
    cod: { enabled: cod?.enabled ?? true, maxTotal: cod?.maxTotal ?? 5000, fee: cod?.fee ?? 49, blockedPincodes: parsePincodes(cod?.blockedPincodes) },
    giftWrapFee: giftWrapFee ?? 49,
    sale: festivalSale,
  }
}

/** Current prices and stock for the browser's cart, plus which ways to pay are open (COD checked against the pincode, if given). */
export async function getCartQuote(input: unknown, locale: string, pincode?: string): Promise<Quote> {
  return (await quoteWithRules(input, locale, pincode)).quote
}

/** The quote and the shop rules it used (checkout needs both; the settings are read once). */
async function quoteWithRules(input: unknown, locale: string, pincode?: string) {
  const lines = cleanLines(input)
  const payload = await getPayload({ config })
  if (!lines.length) return { quote: { lines: [], subtotal: 0, shipping: 0, total: 0, ok: false } as Quote, rules: null, payload }
  // Throw, not an empty quote: the browser drops cart lines missing from a quote, so "busy" must never look like "all gone".
  if (!(await allow('quote', 60, 60_000))) throw new Error('Too many price checks')
  const lang = isLocale(locale) ? locale : 'en'
  const published = { _status: { equals: 'published' } } as const
  const slugs = (course: boolean) => lines.filter((l) => isCourseLine(l) === course).map((l) => l.slug)
  const [{ docs }, { docs: courses }, rules] = await Promise.all([
    payload.find({ collection: 'products', locale: lang, where: { and: [published, { slug: { in: slugs(false) } }] }, depth: 1, limit: 30 }),
    slugs(true).length ? payload.find({ collection: 'courses', locale: lang, where: { and: [published, { slug: { in: slugs(true) } }] }, depth: 1, limit: 30 }) : { docs: [] },
    settings(payload),
  ])
  // Festival sale prices, checked against the clock now: the order is charged what the quote shows.
  const quote = priceCart(lines, applySale(docs, rules.sale, new Date()), courses)
  const cod = { fee: rules.cod.fee, maxTotal: rules.cod.maxTotal, block: codBlock(rules.cod, quote.lines, quote.total, isPincode(pincode) ? pincode : '') }
  return { quote: { ...quote, cod, online: razorpayConfig() !== null, giftWrapFee: rules.giftWrapFee } as Quote, rules, payload }
}

/** One open COD order per phone: waiting for confirmation, or confirmed but not yet shipped. */
// ponytail: two COD checkouts from one phone in the same instant could both pass; the rate limit makes it rare.
async function hasOpenCod(payload: Payload, phone: string) {
  const { totalDocs } = await payload.count({
    collection: 'orders',
    where: {
      'customer.phone': { equals: phone },
      paymentMode: { equals: 'cod' },
      status: { in: ['cod_pending_confirmation', 'cod_confirmed', 'packed'] },
    },
  })
  return totalDocs > 0
}

export type CheckoutInput = {
  lines: unknown
  locale: string
  customer: { name: string; phone: string; email: string }
  address: { line1: string; line2: string; city: string; state: string; pincode: string }
  note: string
  paymentMode?: 'prepaid' | 'cod'
  giftWrap?: boolean
  /** Written on a card in the parcel; never on the invoice. */
  giftNote?: string
  /** Only when the buyer asked for a GST invoice. */
  gst?: { gstin: string; businessName: string } | null
}
export type CheckoutField = 'name' | 'phone' | 'email' | 'line1' | 'city' | 'state' | 'pincode' | 'gstin' | 'businessName'
export type CheckoutResult =
  | { status: 'invalid'; errors: CheckoutField[] }
  | { status: 'not_ready' | 'unavailable' | 'failed' | 'rate' }
  | { status: 'sold_out' | 'already_enrolled'; title: string }
  /** A course is in the cart but nobody is signed in (or consent is missing). */
  | { status: 'login' | 'consent' }
  | { status: 'cod_blocked'; reason: CodBlock }
  | { status: 'cod'; orderNumber: string; publicId: string }
  | { status: 'ok'; keyId: string; razorpayOrderId: string; amount: number; orderNumber: string; publicId: string }

const clip = (s: unknown, max: number) => (typeof s === 'string' ? s.trim().replace(/\s+/g, ' ').slice(0, max) : '')

/**
 * Creates the order and holds its stock.
 * - Online: held for 15 minutes, with a matching Razorpay order.
 * - Cash on delivery: held until staff confirm or cancel it (after a WhatsApp check with the customer).
 */
// ponytail: COD phones aren't OTP-verified yet; add it with SMS (MSG91). Until then the WhatsApp confirmation is the check.
export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const cartLines = cleanLines(input.lines)
  // Courses belong to an account: checkout step 1 is the phone sign-in, and the order uses that verified phone.
  const me = await getCustomer()
  if (needsSignIn(cartLines) && !me) return { status: 'login' }
  const courseOnly = cartLines.length > 0 && cartLines.every(isCourseLine)
  const c = { name: clip(input.customer?.name, 80), phone: normalisePhone(clip(courseOnly && me ? me.phone : input.customer?.phone, 20)), email: clip(input.customer?.email, 120) }
  const a = { line1: clip(input.address?.line1, 160), line2: clip(input.address?.line2, 160), city: clip(input.address?.city, 60), state: clip(input.address?.state, 60), pincode: clip(input.address?.pincode, 6) }
  const errors: CheckoutField[] = []
  if (c.name.length < 2) errors.push('name')
  if (!c.phone) errors.push('phone')
  if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) errors.push('email')
  // Nothing ships for a course: only the state is asked (for the GST invoice).
  if (!courseOnly && a.line1.length < 3) errors.push('line1')
  if (!courseOnly && a.city.length < 2) errors.push('city')
  if (a.state.length < 2) errors.push('state')
  if (!courseOnly && !isPincode(a.pincode)) errors.push('pincode')
  const gst = input.gst ? { gstin: clip(input.gst.gstin, 20).replace(/\s/g, '').toUpperCase(), businessName: clip(input.gst.businessName, 120) } : null
  if (gst && !isValidGstin(gst.gstin)) errors.push('gstin')
  if (gst && gst.businessName.length < 2) errors.push('businessName')
  if (errors.length) return { status: 'invalid', errors }
  if (!(await allow('order', 5, 10 * 60_000))) return { status: 'rate' }

  const cod = input.paymentMode === 'cod'
  const rzp = razorpayConfig()
  if (!cod && !rzp) return { status: 'not_ready' }

  // Also cancels this account's (or this browser's) earlier open checkouts, so retries don't pile up held stock. Never by phone alone.
  const visitor = await visitorId()
  await expireHolds({ account: me?.id, visitor })
  const { quote, rules, payload } = await quoteWithRules(input.lines, input.locale)
  if (!quote.ok || !rules || (courseOnly && quote.total === 0)) return { status: 'unavailable' }
  const seats = quote.lines.filter((l) => l.courseId)
  // Under-18 courses: the parent's tick is checked here, not just in the browser.
  if (seats.some((l) => l.consent === false)) return { status: 'consent' }
  if (seats.length && me) {
    const { docs } = await payload.find({ collection: 'enrolments', where: { and: [{ customer: { equals: me.id } }, { course: { in: seats.map((l) => l.courseId!) } }] }, limit: 1, depth: 0, select: { course: true } })
    if (docs[0]) return { status: 'already_enrolled', title: seats.find((l) => l.courseId === docs[0].course)?.title ?? '' }
  }
  const giftFee = giftWrapCharge(input.giftWrap === true, quote.lines, rules.giftWrapFee)
  let codFee = 0
  if (cod) {
    const reason = codBlock(rules.cod, quote.lines, quote.total + giftFee, a.pincode, await hasOpenCod(payload, c.phone!))
    if (reason) return { status: 'cod_blocked', reason }
    codFee = rules.cod.fee
  }
  const total = orderTotal(quote, codFee, giftFee)
  const publicId = randomBytes(9).toString('base64url')
  const data = {
    status: cod ? ('cod_pending_confirmation' as const) : ('pending_payment' as const),
    paymentMode: cod ? ('cod' as const) : ('prepaid' as const),
    publicId,
    account: me?.id,
    visitorId: visitor,
    items: quote.lines.map((l) => ({
      product: l.productId,
      course: l.courseId,
      childFirstName: l.childName,
      guardianConsent: l.consent,
      title: l.title,
      variantId: l.variantId,
      variantLabel: l.variantLabel,
      frameLabel: l.frameLabel,
      type: l.type,
      unitPrice: l.unitPrice,
      qty: l.qty,
      lineTotal: l.lineTotal,
    })),
    subtotal: quote.subtotal,
    shipping: quote.shipping,
    codFee: cod ? codFee : undefined,
    giftWrapFee: giftFee || undefined,
    giftNote: clip(input.giftNote, GIFT_NOTE_MAX) || undefined,
    total,
    customer: { name: c.name, phone: c.phone!, email: c.email || undefined, gstin: gst?.gstin, businessName: gst?.businessName },
    address: a,
    note: clip(input.note, 500) || undefined,
    // COD stock is held until staff confirm; if nobody does within COD_HOLD_HOURS the maintenance job releases it.
    reservedUntil: new Date(Date.now() + (cod ? COD_HOLD_HOURS * 3600_000 : HOLD_MINUTES * 60_000)).toISOString(),
    locale: isLocale(input.locale) ? input.locale : 'en',
  }

  // The stock hold and the order are one transaction: a crash in between leaves neither.
  let order: { id: number }
  const transactionID = await payload.db.beginTransaction()
  try {
    const tx = transactionID ? payload.db.sessions?.[transactionID]?.db : undefined
    if (!transactionID || !tx) throw new Error('Checkout needs a database transaction')
    const soldOut = await holdStock(tx as typeof payload.db.drizzle, quote.lines)
    if (soldOut) {
      await payload.db.rollbackTransaction(transactionID)
      return { status: 'sold_out', title: soldOut }
    }
    order = await payload.create({ collection: 'orders', data, req: { transactionID } })
    await payload.update({ collection: 'orders', id: order.id, data: { orderNumber: `ART-${10000 + order.id}` }, req: { transactionID } })
    await payload.db.commitTransaction(transactionID)
  } catch (error) {
    console.error('Checkout failed', error)
    if (transactionID) await payload.db.rollbackTransaction(transactionID).catch(() => {})
    return { status: 'failed' }
  }
  // First purchase: the name typed here becomes the account's name.
  if (me && !me.name) await payload.update({ collection: 'customers', id: me.id, data: { name: c.name } }).catch(() => {})
  await refreshProducts()
  // ponytail: no owner alert yet; Today lists new orders. Email or WhatsApp alerts plug in here (COD) and in markPaid (online).
  const orderNumber = `ART-${10000 + order.id}`
  if (cod) return { status: 'cod', orderNumber, publicId }

  try {
    const rzpOrder = await createRazorpayOrder(total * 100, orderNumber)
    await payload.update({ collection: 'orders', id: order.id, data: { razorpayOrderId: rzpOrder.id } })
    return { status: 'ok', keyId: rzp!.keyId, razorpayOrderId: rzpOrder.id, amount: rzpOrder.amount, orderNumber, publicId }
  } catch (error) {
    // Razorpay slow or down: cancel the order and free its stock straight away.
    console.error('Razorpay order failed', error)
    await cancelOrder(order.id, 'pending_payment', cancelPlan('pending_payment', 'prepaid')!, data.items).catch((e) => console.error('Cancel failed; the maintenance job will expire it', e))
    return { status: 'failed' }
  }
}

/** Called by the browser after Razorpay Checkout succeeds. The webhook does the same, so either can arrive first. */
export async function confirmPayment(input: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
  const rzp = razorpayConfig()
  if (!rzp) return { status: 'invalid' as const }
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = input
  if (![orderId, paymentId, signature].every((s) => typeof s === 'string' && s.length < 200)) return { status: 'invalid' as const }
  if (!verifyPaymentSignature(orderId, paymentId, signature, rzp.keySecret)) return { status: 'invalid' as const }
  const paid = await markPaid(orderId, paymentId)
  if (!paid) return { status: 'invalid' as const }
  // Paid after the hold ran out and the piece sold meanwhile: the order page explains the refund.
  return { status: paid.status === 'needs_refund' ? ('needs_refund' as const) : ('paid' as const), publicId: paid.order.publicId! }
}
