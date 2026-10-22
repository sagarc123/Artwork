// Cart pricing: the server always recalculates from the database; the browser only sends what was chosen.
// Prices are whole rupees and already include GST.
import type { Product } from '@/payload-types'

export type CartLine = { slug: string; variantId: string; frameId?: string; qty: number }

export const FREE_SHIPPING_FROM = 2999
export const SHIPPING_FEE = 99
export const MAX_QTY = 10

export type QuoteLine = {
  key: string
  slug: string
  productId: number
  variantId: string
  frameId?: string
  title: string
  variantLabel: string
  frameLabel?: string
  type: Product['type']
  unitPrice: number
  qty: number
  lineTotal: number
  maxQty: number
  available: boolean
  image: { url: string; alt: string } | null
}

export type Quote = { lines: QuoteLine[]; subtotal: number; shipping: number; total: number; ok: boolean }

export function priceCart(lines: CartLine[], products: Product[]): Quote {
  const bySlug = new Map(products.map((p) => [p.slug, p]))
  const out: QuoteLine[] = []
  for (const line of lines) {
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
      maxQty,
      available: p.type === 'digital' || left >= qty,
      image: img?.url ? { url: img.url, alt: img.alt } : null,
    })
  }
  const subtotal = out.reduce((sum, l) => sum + l.lineTotal, 0)
  const physical = out.some((l) => l.type !== 'digital')
  const shipping = physical && subtotal < FREE_SHIPPING_FROM ? SHIPPING_FEE : 0
  return { lines: out, subtotal, shipping, total: subtotal + shipping, ok: out.length > 0 && out.every((l) => l.available) }
}
