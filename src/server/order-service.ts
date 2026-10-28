import 'server-only'
import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { getPayload, type Where } from 'payload'
import type { QuoteLine } from '@/lib/cart'
import { reservedFixes, type CancelPlan } from '@/lib/orders'
import { enrolFromOrder } from './enrol'
import { issueInvoice } from './invoices'
import { pruneRateLimits } from './rate-limit'

export const HOLD_MINUTES = 15
/** A cash-on-delivery order holds its stock this long while staff check it with the customer; then it is cancelled like an unpaid checkout. */
export const COD_HOLD_HOURS = 48

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

type HeldItem = { variantId?: string | null; qty?: number | null; type?: string | null }
type Tx = Parameters<Parameters<Awaited<ReturnType<typeof payloadDb>>['db']['transaction']>[0]>[0]
type Sql = Pick<Tx, 'execute'>

/**
 * Holds stock while someone pays, inside the caller's transaction, so the hold and its order commit (or vanish) together.
 * Returns the title of the first item that ran out; the caller then rolls back.
 */
export async function holdStock(tx: Sql, lines: QuoteLine[]): Promise<string | null> {
  for (const l of lines) {
    if (l.type === 'digital') continue
    const r = await tx.execute(sql`UPDATE payload.products_variants SET reserved = reserved + ${l.qty} WHERE id = ${l.variantId} AND stock - reserved >= ${l.qty} RETURNING id`)
    if (r.rows.length === 0) return l.title
  }
  return null
}

async function release(tx: Sql, items: HeldItem[]) {
  for (const it of items) {
    if (it.type === 'digital' || !it.variantId || !it.qty) continue
    await tx.execute(sql`UPDATE payload.products_variants SET reserved = GREATEST(reserved - ${it.qty}, 0) WHERE id = ${it.variantId}`)
  }
}

/** Held stock becomes sold (payment received, or COD order confirmed). */
async function sell(tx: Sql, items: HeldItem[]) {
  for (const it of items) {
    if (it.type === 'digital' || !it.variantId || !it.qty) continue
    await tx.execute(sql`UPDATE payload.products_variants SET stock = stock - ${it.qty}, reserved = GREATEST(reserved - ${it.qty}, 0) WHERE id = ${it.variantId}`)
  }
}

/** Sold stock comes back (an order cancelled before delivery). */
async function restock(tx: Sql, items: HeldItem[]) {
  for (const it of items) {
    if (it.type === 'digital' || !it.variantId || !it.qty) continue
    await tx.execute(sql`UPDATE payload.products_variants SET stock = stock + ${it.qty} WHERE id = ${it.variantId}`)
  }
}

/** Moves an order to a new status together with its stock change, atomically. False if it was no longer in one of `from`. */
async function transition(orderId: number, from: string[], to: string, items: HeldItem[], stock: (tx: Sql, items: HeldItem[]) => Promise<void>, refresh = true) {
  const { db } = await payloadDb()
  const done = await db.transaction(async (tx) => {
    const r = await tx.execute(
      sql`UPDATE payload.orders SET status = ${to} WHERE id = ${orderId} AND status::text IN (${sql.join(from.map((s) => sql`${s}`), sql`, `)}) RETURNING id`,
    )
    if (r.rows.length) await stock(tx, items)
    return r.rows.length > 0
  })
  if (done && refresh) await refreshProducts()
  return done
}

/** The customer confirmed a COD order (on WhatsApp): its held stock becomes sold. */
export const confirmCod = (orderId: number, items: HeldItem[]) => transition(orderId, ['cod_pending_confirmation'], 'cod_confirmed', items, sell)

/** Cancels an order the way `cancelPlan` says: held stock is released, sold stock comes back, paid ones wait for a refund. */
// ponytail: restocks as soon as staff cancel, even if the parcel is still on its way back.
export const cancelOrder = (orderId: number, from: string, plan: CancelPlan, items: HeldItem[]) =>
  transition(orderId, [from], plan.status, items, plan.stock === 'release' ? release : restock)

/**
 * Cancels checkouts not paid in time and COD orders nobody confirmed in time (their `reservedUntil` passed), and optionally
 * this customer's earlier open online checkouts (same signed-in account or same visitor, never just the same phone number,
 * so nobody can cancel someone else's checkout by typing their number). Returns how many.
 */
export async function expireHolds(own?: { account?: number | null; visitor?: string | null }, refresh = true) {
  const { payload } = await payloadDb()
  const now = new Date().toISOString()
  const or: Where[] = [{ reservedUntil: { less_than: now } }]
  if (own?.account) or.push({ and: [{ status: { equals: 'pending_payment' } }, { account: { equals: own.account } }] })
  if (own?.visitor) or.push({ and: [{ status: { equals: 'pending_payment' } }, { visitorId: { equals: own.visitor } }] })
  let n = 0
  for (;;) {
    const { docs } = await payload.find({ collection: 'orders', where: { and: [{ status: { in: ['pending_payment', 'cod_pending_confirmation'] } }, { or }] }, limit: 50, depth: 0 })
    // One cache refresh for the whole batch, not one per order.
    for (const order of docs) if (await transition(order.id, [order.status], 'cancelled', order.items ?? [], release, false)) n++
    if (docs.length < 50) break
  }
  if (n && refresh) await refreshProducts()
  return n
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
    if (!row) return null

    if (row.status === 'pending_payment') {
      await sell(tx, items)
      await tx.execute(sql`UPDATE payload.orders SET status = 'paid', razorpay_payment_id = ${paymentId}, paid_at = now() WHERE id = ${order.id}`)
      return 'paid'
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
      return allThere ? 'paid' : 'needs_refund'
    }
    return null
  })
  if (changed) await refreshProducts()
  if (changed === 'paid') await issueInvoice(order.id).catch((error) => console.error('Invoice not issued', order.id, error))
  // A repeat call (webhook after the browser, or a retry) reports where the order is now.
  const status = changed ?? (await payload.findByID({ collection: 'orders', id: order.id, depth: 0, select: { status: true } })).status
  // Course lines become seats. Not swallowed: if it fails, the webhook gets an error and retries, and the repeat call (status
  // is already paid) comes back here. Only a verified payment ever reaches this line.
  if (['paid', 'packed', 'shipped', 'delivered'].includes(status) && order.items?.some((it) => it.course)) await enrolFromOrder(order.id)
  return { order, status }
}

/** Paid orders without an invoice (the first try failed, e.g. the server stopped): issue them now. Returns how many. */
async function retryInvoices() {
  const { db } = await payloadDb()
  const r = await db.execute(sql`
    SELECT o.id FROM payload.orders o
    WHERE ((o.payment_mode = 'prepaid' AND o.status IN ('paid', 'packed', 'shipped', 'delivered')) OR (o.payment_mode = 'cod' AND o.status = 'delivered'))
      AND NOT EXISTS (SELECT 1 FROM payload.invoices i WHERE i.order_id = o.id)
    ORDER BY o.id LIMIT 20`)
  let n = 0
  for (const { id } of r.rows as { id: number }[]) {
    try {
      await issueInvoice(id)
      n++
    } catch (error) {
      console.error('Invoice retry failed', id, error)
    }
  }
  return n
}

/**
 * Safety net: each variant's held count should equal the qty in orders still waiting (payment or COD confirmation).
 * Holds and orders now commit together, so drift means a bug or a hand edit. Read in one snapshot; a row that
 * changed meanwhile makes the whole fix wait for the next run.
 */
async function reconcileReserved() {
  const { db } = await payloadDb()
  return db.transaction(
    async (tx) => {
      const variants = (await tx.execute(sql`SELECT id, reserved::int AS reserved FROM payload.products_variants`)).rows as { id: string; reserved: number | null }[]
      const open = (
        await tx.execute(sql`
          SELECT i.variant_id AS "variantId", i.qty::int AS qty FROM payload.orders_items i JOIN payload.orders o ON o.id = i._parent_id
          WHERE o.status IN ('pending_payment', 'cod_pending_confirmation') AND (i.type IS NULL OR i.type <> 'digital')`)
      ).rows as { variantId: string | null; qty: number | null }[]
      const fixes = reservedFixes(variants, open)
      for (const f of fixes) {
        console.warn(`Held stock for variant ${f.id} was ${f.from}, open orders hold ${f.to}: fixed`)
        await tx.execute(sql`UPDATE payload.products_variants SET reserved = ${f.to} WHERE id = ${f.id}`)
      }
      return fixes.length
    },
    { isolationLevel: 'repeatable read' },
  )
}

/** Every few minutes (see /api/cron/maintenance): free expired holds, issue missed invoices, check held stock. Safe to run twice. */
export async function runMaintenance() {
  const expired = await expireHolds(undefined, false)
  await pruneRateLimits().catch((error) => console.error('Rate-limit cleanup failed', error))
  const invoices = await retryInvoices()
  const reserved = await reconcileReserved().catch((error) => (console.warn('Held stock check skipped (busy), next run retries', error), 0))
  // One cache refresh for the whole run.
  if (expired || reserved) await refreshProducts()
  return { expired, invoices, reserved }
}

/** Current stock and holds of a product's sizes, for the admin's stock buttons (the form's copy may be old). */
export async function liveStock(productId: number) {
  const { db } = await payloadDb()
  const r = await db.execute(sql`SELECT id, stock::int AS stock, reserved::int AS reserved FROM payload.products_variants WHERE _parent_id = ${productId}`)
  return r.rows as { id: string; stock: number; reserved: number | null }[]
}

/** Adds (or removes) stock in one statement, so a checkout running at the same moment is never overwritten. */
export async function adjustStock(variantId: string, delta: number) {
  const { db } = await payloadDb()
  // Same rule as adjustedStock() in lib/orders.
  const r = await db.execute(
    sql`UPDATE payload.products_variants SET stock = GREATEST(stock + ${delta}, COALESCE(reserved, 0), 0) WHERE id = ${variantId} RETURNING id, stock::int AS stock, reserved::int AS reserved`,
  )
  if (r.rows.length) await refreshProducts()
  return (r.rows[0] as { id: string; stock: number; reserved: number | null } | undefined) ?? null
}
