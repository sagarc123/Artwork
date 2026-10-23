'use server'

import { randomBytes } from 'node:crypto'
import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { isLocale } from '@/i18n/config'
import { isPincode } from '@/lib/pincode'
import { applySale, codBlock, GIFT_NOTE_MAX, giftWrapCharge, orderTotal, parsePincodes, priceCart, type CartLine, type CodBlock, type CodRules, type FestivalSale, type Quote } from '@/lib/cart'
import { isValidGstin } from '@/lib/gst'
import { normalisePhone } from '@/lib/enquiry'
import { createRazorpayOrder, razorpayConfig, verifyPaymentSignature } from '@/lib/razorpay'
import { expireHolds, holdStock, HOLD_MINUTES, markPaid, releaseStock } from './order-service'
import { allow } from './rate-limit'

/** Accepts only well-formed cart lines from the browser. */
function cleanLines(input: unknown): CartLine[] {
  if (!Array.isArray(input)) return []
  return input.slice(0, 30).flatMap((l) => {
    if (!l || typeof l !== 'object') return []
    const { slug, variantId, frameId, qty } = l as Record<string, unknown>
    if (typeof slug !== 'string' || typeof variantId !== 'string' || slug.length > 120 || variantId.length > 60) return []
    return [{ slug, variantId, frameId: typeof frameId === 'string' ? frameId.slice(0, 60) : undefined, qty: Number(qty) || 1 }]
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
  const lines = cleanLines(input)
  if (!lines.length || !(await allow('quote', 60, 60_000))) return { lines: [], subtotal: 0, shipping: 0, total: 0, ok: false }
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'products',
    locale: isLocale(locale) ? locale : 'en',
    where: { and: [{ _status: { equals: 'published' } }, { slug: { in: lines.map((l) => l.slug) } }] },
    depth: 1,
    limit: 30,
  })
  const { cod: rules, giftWrapFee, sale } = await settings(payload)
  // Festival sale prices, checked against the clock now: the order is charged what the quote shows.
  const quote = priceCart(lines, applySale(docs, sale, new Date()))
  const cod = { fee: rules.fee, maxTotal: rules.maxTotal, block: codBlock(rules, quote.lines, quote.total, isPincode(pincode) ? pincode : '') }
  return { ...quote, cod, online: razorpayConfig() !== null, giftWrapFee }
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
  | { status: 'sold_out'; title: string }
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
  const c = { name: clip(input.customer?.name, 80), phone: normalisePhone(clip(input.customer?.phone, 20)), email: clip(input.customer?.email, 120) }
  const a = { line1: clip(input.address?.line1, 160), line2: clip(input.address?.line2, 160), city: clip(input.address?.city, 60), state: clip(input.address?.state, 60), pincode: clip(input.address?.pincode, 6) }
  const errors: CheckoutField[] = []
  if (c.name.length < 2) errors.push('name')
  if (!c.phone) errors.push('phone')
  if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) errors.push('email')
  if (a.line1.length < 3) errors.push('line1')
  if (a.city.length < 2) errors.push('city')
  if (a.state.length < 2) errors.push('state')
  if (!isPincode(a.pincode)) errors.push('pincode')
  const gst = input.gst ? { gstin: clip(input.gst.gstin, 20).replace(/\s/g, '').toUpperCase(), businessName: clip(input.gst.businessName, 120) } : null
  if (gst && !isValidGstin(gst.gstin)) errors.push('gstin')
  if (gst && gst.businessName.length < 2) errors.push('businessName')
  if (errors.length) return { status: 'invalid', errors }
  if (!(await allow('order', 5, 10 * 60_000))) return { status: 'rate' }

  const cod = input.paymentMode === 'cod'
  const rzp = razorpayConfig()
  if (!cod && !rzp) return { status: 'not_ready' }

  // Also cancels this phone's earlier open checkouts, so retries don't pile up held stock.
  await expireHolds(c.phone!)
  const quote = await getCartQuote(input.lines, input.locale)
  if (!quote.ok) return { status: 'unavailable' }
  const payload = await getPayload({ config })
  const rules = await settings(payload)
  const giftFee = giftWrapCharge(input.giftWrap === true, quote.lines, rules.giftWrapFee)
  let codFee = 0
  if (cod) {
    const reason = codBlock(rules.cod, quote.lines, quote.total + giftFee, a.pincode, await hasOpenCod(payload, c.phone!))
    if (reason) return { status: 'cod_blocked', reason }
    codFee = rules.cod.fee
  }
  const total = orderTotal(quote, codFee, giftFee)
  const soldOut = await holdStock(quote.lines)
  if (soldOut) return { status: 'sold_out', title: soldOut }

  let orderId: number | undefined
  try {
    const publicId = randomBytes(9).toString('base64url')
    const order = await payload.create({
      collection: 'orders',
      data: {
        status: cod ? 'cod_pending_confirmation' : 'pending_payment',
        paymentMode: cod ? 'cod' : 'prepaid',
        publicId,
        items: quote.lines.map((l) => ({
          product: l.productId,
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
        reservedUntil: cod ? null : new Date(Date.now() + HOLD_MINUTES * 60_000).toISOString(),
        locale: isLocale(input.locale) ? input.locale : 'en',
      },
    })
    orderId = order.id
    const orderNumber = `ART-${10000 + order.id}`
    if (cod) {
      await payload.update({ collection: 'orders', id: order.id, data: { orderNumber } })
      return { status: 'cod', orderNumber, publicId }
    }
    const rzpOrder = await createRazorpayOrder(total * 100, orderNumber)
    await payload.update({ collection: 'orders', id: order.id, data: { orderNumber, razorpayOrderId: rzpOrder.id } })
    return { status: 'ok', keyId: rzp!.keyId, razorpayOrderId: rzpOrder.id, amount: rzpOrder.amount, orderNumber, publicId }
  } catch (error) {
    console.error('Checkout failed', error)
    await releaseStock(quote.lines)
    if (orderId) await payload.update({ collection: 'orders', id: orderId, data: { status: 'cancelled' } })
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
  const order = await markPaid(orderId, paymentId)
  return order ? { status: 'paid' as const, publicId: order.publicId! } : { status: 'invalid' as const }
}
