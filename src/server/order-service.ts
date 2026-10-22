import 'server-only'
import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { getPayload, type Where } from 'payload'
import type { QuoteLine } from '@/lib/cart'

export const HOLD_MINUTES = 15

const payloadDb = async () => {
  const payload = await getPayload({ config })
  return { payload, db: payload.db.drizzle }
}

/** "Sold" badges and stock change whenever holds or sales change. */
export async function refreshProducts() {
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
  if (!soldOut) await refreshProducts()
  return soldOut
}

type HeldItem = { variantId?: string | null; qty?: number | null; type?: string | null }
type Tx = Parameters<Parameters<Awaited<ReturnType<typeof payloadDb>>['db']['transaction']>[0]>[0]

async function release(tx: Tx, items: HeldItem[]) {
  for (const it of items) {
    if (it.type === 'digital' || !it.variantId || !it.qty) continue
    await tx.execute(sql`UPDATE payload.products_variants SET reserved = GREATEST(reserved - ${it.qty}, 0) WHERE id = ${it.variantId}`)
  }
}

/** Gives held stock back (checkout failed before an order existed). */
export async function releaseStock(items: HeldItem[]) {
  const { db } = await payloadDb()
  await db.transaction((tx) => release(tx, items))
  await refreshProducts()
}

/** Cancels one unpaid order and frees its stock, atomically. Returns false if it was no longer waiting for payment. */
export async function cancelPending(orderId: number, items: HeldItem[]) {
  const { db } = await payloadDb()
  const done = await db.transaction(async (tx) => {
    const r = await tx.execute(sql`UPDATE payload.orders SET status = 'cancelled' WHERE id = ${orderId} AND status = 'pending_payment' RETURNING id`)
    if (r.rows.length) await release(tx, items)
    return r.rows.length > 0
  })
  if (done) await refreshProducts()
  return done
}

/** Cancels checkouts not paid in time (and, optionally, earlier open checkouts from the same phone). */
export async function expireHolds(phone?: string) {
  const { payload } = await payloadDb()
  const now = new Date().toISOString()
  const or: Where[] = [{ reservedUntil: { less_than: now } }]
  if (phone) or.push({ 'customer.phone': { equals: phone } })
  for (;;) {
    const { docs } = await payload.find({ collection: 'orders', where: { and: [{ status: { equals: 'pending_payment' } }, { or }] }, limit: 50, depth: 0 })
    for (const order of docs) await cancelPending(order.id, order.items ?? [])
    if (docs.length < 50) break
  }
}

/**
 * Marks an order paid exactly once (browser confirmation and webhook may both arrive, in any order, or be retried).
 * The order row is locked, so its status cannot change underneath us.
 * - Waiting for payment: the held stock becomes sold.
 * - Expired (cancelled, never paid): take the stock only if every item is still available; otherwise flag for a refund.
 * - Anything else (already paid, cancelled by staff after payment, refunded): leave it alone.
 */
export async function markPaid(razorpayOrderId: string, paymentId: string) {
  const { payload, db } = await payloadDb()
  const { docs } = await payload.find({ collection: 'orders', where: { razorpayOrderId: { equals: razorpayOrderId } }, limit: 1, depth: 0 })
  const order = docs[0]
  if (!order) return null
  const items = (order.items ?? []).filter((it) => it.type !== 'digital' && it.variantId && it.qty)

  const changed = await db.transaction(async (tx) => {
    const locked = await tx.execute(sql`SELECT status, razorpay_payment_id FROM payload.orders WHERE id = ${order.id} FOR UPDATE`)
    const row = locked.rows[0] as { status: string; razorpay_payment_id: string | null } | undefined
    if (!row) return false

    if (row.status === 'pending_payment') {
      for (const it of items) {
        await tx.execute(sql`UPDATE payload.products_variants SET stock = stock - ${it.qty}, reserved = GREATEST(reserved - ${it.qty}, 0) WHERE id = ${it.variantId}`)
      }
      await tx.execute(sql`UPDATE payload.orders SET status = 'paid', razorpay_payment_id = ${paymentId}, paid_at = now() WHERE id = ${order.id}`)
      return true
    }

    if (row.status === 'cancelled' && !row.razorpay_payment_id) {
      let allThere = true
      for (const it of items) {
        const r = await tx.execute(sql`SELECT 1 FROM payload.products_variants WHERE id = ${it.variantId} AND stock - reserved >= ${it.qty} FOR UPDATE`)
        if (r.rows.length === 0) allThere = false
      }
      if (allThere) {
        for (const it of items) await tx.execute(sql`UPDATE payload.products_variants SET stock = stock - ${it.qty} WHERE id = ${it.variantId}`)
      }
      await tx.execute(
        sql`UPDATE payload.orders SET status = ${allThere ? 'paid' : 'needs_refund'}, razorpay_payment_id = ${paymentId}, paid_at = now() WHERE id = ${order.id}`,
      )
      return true
    }
    return false
  })
  if (changed) await refreshProducts()
  return order
}
