// Cart pricing: the server always recalculates from the database; the browser only sends what was chosen.
// Prices are whole rupees and already include GST.
import type { Course, Product } from '@/payload-types'
import { coursePrice, forUnder18 } from './courses.ts'

/** A course line has `slug` = the course's slug and this as its variant. One seat per course; the parent's consent and the child's first name ride along. */
export const COURSE_VARIANT = 'course'
export type CartLine = { slug: string; variantId: string; frameId?: string; qty: number; childName?: string; consent?: boolean }
export const isCourseLine = (l: Pick<CartLine, 'variantId'>) => l.variantId === COURSE_VARIANT
/** Courses belong to an account (access is tied to it), so checkout asks for sign-in first. */
export const needsSignIn = (lines: Pick<CartLine, 'variantId'>[]) => lines.some(isCourseLine)
export const CHILD_NAME_MAX = 40

export const FREE_SHIPPING_FROM = 2999
export const SHIPPING_FEE = 99
export const MAX_QTY = 10

export type QuoteLine = {
  key: string
  slug: string
  /** Set for products; courses have `courseId` instead. */
  productId?: number
  courseId?: number
  childName?: string
  consent?: boolean
  variantId: string
  frameId?: string
  title: string
  variantLabel: string
  frameLabel?: string
  /** A course is a digital line: nothing ships, no stock, no COD. */
  type: Product['type']
  unitPrice: number
  /** Line total before a sale or "was" price, shown crossed out. */
  wasTotal?: number
  qty: number
  lineTotal: number
  maxQty: number
  available: boolean
  image: { url: string; alt: string } | null
}

// cod and online are filled in by the checkout server (they depend on settings and payment keys).
export type Quote = { lines: QuoteLine[]; subtotal: number; shipping: number; total: number; ok: boolean; cod?: CodOption; online?: boolean; giftWrapFee?: number }

export const GIFT_NOTE_MAX = 200

/** Gift wrap is charged once per order, and only when something physical ships. */
export const giftWrapCharge = (wanted: boolean, lines: Pick<QuoteLine, 'type'>[], fee: number) => (wanted && lines.some((l) => l.type !== 'digital') ? Math.max(0, fee) : 0)

/** What the buyer pays: items and delivery, plus any COD fee and gift wrap. */
export const orderTotal = (quote: Pick<Quote, 'total'>, codFee = 0, giftWrap = 0) => quote.total + codFee + giftWrap

export type CartCourse = Pick<Course, 'id' | 'slug' | 'title' | 'price' | 'salePrice' | 'thumbnail' | 'audience'>

// ponytail: the festival sale applies to shop pieces only; courses charge their own sale price.
export function priceCart(lines: CartLine[], products: Product[], courses: CartCourse[] = []): Quote {
  const bySlug = new Map(products.map((p) => [p.slug, p]))
  const courseBySlug = new Map(courses.map((c) => [c.slug, c]))
  const out: QuoteLine[] = []
  for (const line of lines) {
    if (isCourseLine(line)) {
      const c = courseBySlug.get(line.slug)
      if (!c || out.some((l) => l.courseId === c.id)) continue // unpublished, or the same course twice
      const price = coursePrice(c).now
      const thumb = typeof c.thumbnail === 'object' && c.thumbnail?.url ? c.thumbnail : null
      const under18 = forUnder18(c.audience)
      out.push({
        key: `${c.slug}:${COURSE_VARIANT}:`,
        slug: c.slug,
        courseId: c.id,
        variantId: COURSE_VARIANT,
        title: c.title,
        variantLabel: '',
        type: 'digital',
        unitPrice: price,
        qty: 1,
        lineTotal: price,
        maxQty: 1,
        available: true,
        image: thumb?.url ? { url: thumb.url, alt: thumb.alt || c.title } : null,
        // Only under-18 courses carry a child's first name, and only with the parent's tick.
        consent: under18 ? line.consent === true : undefined,
        childName: under18 && line.childName ? line.childName.trim().slice(0, CHILD_NAME_MAX) : undefined,
      })
      continue
    }
    const p = bySlug.get(line.slug)
    const v = p?.variants.find((x) => x.id === line.variantId)
    if (!p || !v?.id) continue // removed from the shop: dropped from the cart
    const frame = line.frameId ? p.framing?.find((f) => f.id === line.frameId) : undefined
    if (line.frameId && !frame) continue

    const left = v.stock - (v.reserved ?? 0)
    const maxQty = p.type === 'original' ? 1 : p.type === 'digital' ? MAX_QTY : Math.min(MAX_QTY, Math.max(left, 1))
    const qty = Math.min(Math.max(1, Math.floor(line.qty) || 1), maxQty)
    const unitPrice = v.price + (frame?.extraPrice ?? 0)
    const img = Array.isArray(p.images) && typeof p.images[0] === 'object' ? p.images[0] : null

    out.push({
      key: `${p.slug}:${v.id}:${frame?.id ?? ''}`,
      slug: p.slug,
      productId: p.id,
      variantId: v.id,
      frameId: frame?.id ?? undefined,
      title: p.title,
      variantLabel: v.label,
      frameLabel: frame?.label,
      type: p.type,
      unitPrice,
      qty,
      lineTotal: unitPrice * qty,
      wasTotal: v.compareAtPrice && v.compareAtPrice > v.price ? (v.compareAtPrice + (frame?.extraPrice ?? 0)) * qty : undefined,
      maxQty,
      available: p.type === 'digital' || left >= qty,
      image: img?.url ? { url: img.url, alt: img.alt || p.title } : null,
    })
  }
  const subtotal = out.reduce((sum, l) => sum + l.lineTotal, 0)
  const physical = out.some((l) => l.type !== 'digital')
  const shipping = physical && subtotal < FREE_SHIPPING_FROM ? SHIPPING_FEE : 0
  return { lines: out, subtotal, shipping, total: subtotal + shipping, ok: out.length > 0 && out.every((l) => l.available) }
}

/** The owner's festival sale (Commerce settings). Empty categories = everything in the shop. */
export type FestivalSale = {
  enabled?: boolean | null
  percent?: number | null
  categories?: (number | { id: number })[] | null
  startsAt?: string | null
  endsAt?: string | null
}

const DAY = 86_400_000
/** Start of the Indian (IST) calendar day a stored date falls on: the owner picks days, not times. */
const istDayStart = (iso: string) => {
  const day = new Date(Date.parse(iso) + 330 * 60_000).toISOString().slice(0, 10)
  return Date.parse(`${day}T00:00:00+05:30`)
}

/** Sale window in ms: from the start of the first day to the end of the last day (IST), either side open if empty. */
function saleWindow(sale: FestivalSale | null | undefined): [number, number] | null {
  if (!sale?.enabled || !sale.percent || sale.percent < 1 || sale.percent > 50) return null
  return [sale.startsAt ? istDayStart(sale.startsAt) : -Infinity, sale.endsAt ? istDayStart(sale.endsAt) + DAY : Infinity]
}

export const saleIsOn = (sale: FestivalSale | null | undefined, now: Date) => {
  const w = saleWindow(sale)
  return !!w && now.getTime() >= w[0] && now.getTime() < w[1]
}

/** Milliseconds until the sale starts or ends (for cache lifetimes), or null if nothing changes. */
export function nextSaleChange(sale: FestivalSale | null | undefined, now: Date): number | null {
  const w = saleWindow(sale)
  const next = w?.find((t) => Number.isFinite(t) && t > now.getTime())
  return next === undefined ? null : next - now.getTime()
}

/** Whole rupees, rounded to the nearest rupee. */
export const salePrice = (price: number, percent: number) => Math.round((price * (100 - percent)) / 100)

const idOf = (v: unknown) => (v && typeof v === 'object' ? (v as { id: unknown }).id : v)

/**
 * Products with the sale applied: the price drops and the old price becomes the struck-through "was" price.
 * Used for both the shop pages and the checkout, so the buyer pays what they saw.
 */
// ponytail: applies to every product type (digital too) and to the size price only; frames stay full price.
export function applySale<P extends Pick<Product, 'category' | 'variants'>>(products: P[], sale: FestivalSale | null | undefined, now: Date): P[] {
  if (!saleIsOn(sale, now)) return products
  const only = (sale!.categories ?? []).map(idOf)
  return products.map((p) =>
    only.length && !only.includes(idOf(p.category))
      ? p
      : { ...p, variants: p.variants.map((v) => ({ ...v, price: salePrice(v.price, sale!.percent!), compareAtPrice: Math.max(v.compareAtPrice ?? 0, v.price) })) },
  )
}

const lineKey = (l: { slug: string; variantId: string; frameId?: string | null }) => `${l.slug}:${l.variantId}:${l.frameId ?? ''}`

/**
 * Brings the browser's cart in line with what the server priced: lines for pieces that left the shop are dropped,
 * quantities are capped. Returns null when nothing changed.
 */
export function reconcileCart(sent: CartLine[], priced: Pick<QuoteLine, 'slug' | 'variantId' | 'frameId' | 'qty'>[]) {
  const byKey = new Map(priced.map((l) => [lineKey(l), l]))
  const lines: CartLine[] = []
  for (const l of sent) {
    const p = byKey.get(lineKey(l))
    if (p) lines.push(p.qty === l.qty ? l : { ...l, qty: p.qty })
  }
  const removed = sent.length - lines.length
  return removed || lines.some((l, i) => l !== sent[i]) ? { lines, removed } : null
}

/** Cash-on-delivery settings (owner-editable, in rupees). */
export type CodRules = { enabled: boolean; maxTotal: number; fee: number; blockedPincodes: string[] }
/** Why COD is not offered, in the order the buyer should hear it. */
export type CodBlock = 'off' | 'type' | 'limit' | 'pincode' | 'open'
export type CodOption = { fee: number; maxTotal: number; block: CodBlock | null }

/** COD only for prints and originals, up to the limit (fee included), outside blocked pincodes, one open COD order per phone. */
export function codBlock(rules: CodRules, lines: Pick<QuoteLine, 'type'>[], total: number, pincode = '', hasOpenCod = false): CodBlock | null {
  if (!rules.enabled) return 'off'
  if (!lines.length || lines.some((l) => l.type !== 'print' && l.type !== 'original')) return 'type'
  if (total + rules.fee > rules.maxTotal) return 'limit'
  if (pincode && rules.blockedPincodes.includes(pincode)) return 'pincode'
  return hasOpenCod ? 'open' : null
}

/** Blocked pincodes as typed by the owner: any mix of commas, spaces and new lines. */
export const parsePincodes = (text: string | null | undefined) => (text ?? '').match(/\b[1-9]\d{5}\b/g) ?? []
