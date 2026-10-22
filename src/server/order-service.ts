import 'server-only'
import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'
import type { QuoteLine } from '@/lib/cart'

export const HOLD_MINUTES = 15

const payloadDb = async () => {
  const payload = await getPayload({ config })
  return { payload, db: payload.db.drizzle }
}

async function refreshProducts() {
  try {
    const { revalidateTag } = await import('next/cache')
    revalidateTag('products', { expire: 0 })
  } catch {
    // Outside a request.
  }
}

/** Holds stock while someone pays. All-or-nothing; returns the title of the first item that ran out. */
export async function holdStock(lines: QuoteLine[]): Promise<string | null> {
  const { db } = await payloadDb()
  let soldOut: string | null = null
  try {
    await db.transaction(async (tx) => {
      for (const l of lines) {
        if (l.type === 'digital') continue
        const r = await tx.execute(
          sql`UPDATE payload.products_variants SET reserved = reserved + ${l.qty} WHERE id = ${l.variantId} AND stock - reserved >= ${l.qty} RETURNING id`,
        )
        if (r.rows.length === 0) {
          soldOut = l.title
          throw new Error('sold out')
        }
      }
    })
  } catch (error) {
    if (!soldOut) throw error
  }
  return soldOut
}

type HeldItem = { variantId?: string | null; qty?: number | null; type?: string | null }

/** Gives held stock back (cancelled or abandoned checkout). */
export async function releaseStock(items: HeldItem[]) {
  const { db } = await payloadDb()
  for (const it of items) {
    if (it.type === 'digital' || !it.variantId || !it.qty) continue
    await db.execute(sql`UPDATE payload.products_variants SET reserved = GREATEST(reserved - ${it.qty}, 0) WHERE id = ${it.variantId}`)
  }
}

/** Cancels checkouts that were not paid within the hold time and frees their stock. */
export async function expireHolds() {
  const { payload, db } = await payloadDb()
  const { docs } = await payload.find({
    collection: 'orders',
    where: { and: [{ status: { equals: 'pending_payment' } }, { reservedUntil: { less_than: new Date().toISOString() } }] },
    limit: 50,
    depth: 0,
  })
  for (const order of docs) {
    const r = await db.execute(sql`UPDATE payload.orders SET status = 'cancelled' WHERE id = ${order.id} AND status = 'pending_payment' RETURNING id`)
    if (r.rows.length) await releaseStock(order.items ?? [])
  }
}

/**
 * Marks an order paid exactly once (safe to call from both the browser confirmation and the webhook).
 * A late payment for an expired hold takes the stock if it is still there; otherwise the order is flagged for a refund.
 */
export async function markPaid(razorpayOrderId: string, paymentId: string) {
  const { payload, db } = await payloadDb()
  const { docs } = await payload.find({ collection: 'orders', where: { razorpayOrderId: { equals: razorpayOrderId } }, limit: 1, depth: 0 })
  const order = docs[0]
  if (!order) return null
  if (order.status !== 'pending_payment' && order.status !== 'cancelled') return order

  await db.transaction(async (tx) => {
    const r = await tx.execute(
      sql`UPDATE payload.orders SET status = 'paid', razorpay_payment_id = ${paymentId}, paid_at = now() WHERE id = ${order.id} AND status IN ('pending_payment', 'cancelled') RETURNING id`,
    )
    if (r.rows.length === 0) return
    for (const it of order.items ?? []) {
      if (it.type === 'digital' || !it.variantId || !it.qty) continue
      if (order.status === 'pending_payment') {
        await tx.execute(sql`UPDATE payload.products_variants SET stock = stock - ${it.qty}, reserved = GREATEST(reserved - ${it.qty}, 0) WHERE id = ${it.variantId}`)
      } else {
        const ok = await tx.execute(sql`UPDATE payload.products_variants SET stock = stock - ${it.qty} WHERE id = ${it.variantId} AND stock - reserved >= ${it.qty} RETURNING id`)
        if (ok.rows.length === 0) await tx.execute(sql`UPDATE payload.orders SET status = 'needs_refund' WHERE id = ${order.id}`)
      }
    }
  })
  await refreshProducts()
  return order
}
