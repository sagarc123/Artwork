// SQL aggregates for the admin's Today sales card, Customers view and festival planner. One query per question,
// never every order loaded into memory.
import { sql, type PostgresAdapter } from '@payloadcms/db-postgres'
import type { BasePayload } from 'payload'
import { dailySeries, istMidnight, monthStarts, saleState } from '@/lib/admin-tools'
import { addDays, indiaToday } from '@/lib/dates'

/** Statuses that count as a sale (paid online, or a COD order the customer confirmed). */
export const SOLD = ['paid', 'cod_confirmed', 'packed', 'shipped', 'delivered'] as const

const db = (payload: BasePayload) => (payload.db as unknown as PostgresAdapter).drizzle
const list = (values: readonly string[]) => sql.join(values.map((v) => sql`${v}`), sql`, `)
/** Last 10 digits of a phone, so "+91 98765 43210" and "9876543210" are the same customer. */
const phoneKey = (column: ReturnType<typeof sql.raw>) => sql`right(regexp_replace(coalesce(${column}, ''), '\D', '', 'g'), 10)`

export async function salesSummary(payload: BasePayload, today: string) {
  const { thisMonth, lastMonth } = monthStarts(today)
  const from = istMidnight(thisMonth).toISOString()
  const before = istMidnight(lastMonth).toISOString()
  const since = istMidnight(addDays(today, -29)).toISOString()
  const earliest = since < before ? since : before
  const sold = sql`o.status::text IN (${list(SOLD)})`
  const [totals, days, top] = await Promise.all([
    db(payload).execute(sql`
      SELECT
        coalesce(sum(o.total) FILTER (WHERE o.created_at >= ${from}), 0)::float AS "revThis",
        count(*) FILTER (WHERE o.created_at >= ${from})::int AS "nThis",
        coalesce(sum(o.total) FILTER (WHERE o.created_at >= ${before} AND o.created_at < ${from}), 0)::float AS "revLast",
        count(*) FILTER (WHERE o.created_at >= ${before} AND o.created_at < ${from})::int AS "nLast",
        coalesce(sum(o.total) FILTER (WHERE o.created_at >= ${from} AND o.payment_mode = 'cod'), 0)::float AS "codRev",
        count(*) FILTER (WHERE o.created_at >= ${from} AND o.payment_mode = 'cod')::int AS "codN"
      FROM payload.orders o WHERE ${sold} AND o.created_at >= ${earliest}`),
    db(payload).execute(sql`
      SELECT to_char(o.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS day, sum(o.total)::float AS total
      FROM payload.orders o WHERE ${sold} AND o.created_at >= ${since} GROUP BY 1`),
    db(payload).execute(sql`
      SELECT min(i.title) AS title, i.product_id AS "productId", sum(i.qty)::int AS qty, sum(i.line_total)::float AS amount
      FROM payload.orders_items i JOIN payload.orders o ON o.id = i._parent_id
      WHERE ${sold} AND o.created_at >= ${from}
      GROUP BY i.product_id, CASE WHEN i.product_id IS NULL THEN i.title END
      ORDER BY qty DESC, amount DESC LIMIT 3`),
  ])
  const t = totals.rows[0] as { revThis: number; nThis: number; revLast: number; nLast: number; codRev: number; codN: number }
  return {
    ...t,
    prepaidRev: t.revThis - t.codRev,
    prepaidN: t.nThis - t.codN,
    days: dailySeries(days.rows as { day: string; total: number }[], today),
    top: top.rows as { title: string | null; productId: number | null; qty: number; amount: number }[],
  }
}

export type CustomerRow = { phone: string; name: string; orders: number; spent: number; lastOrder: string | null; lastEnquiry: string | null }

/** Everyone who ordered or enquired, one row per phone, most recent first. `q` matches a name or part of a phone. */
// ponytail: derived on every visit from orders + enquiries; a customers table only if this gets slow (thousands of rows).
export async function customers(payload: BasePayload, q: string, page: number, perPage = 20) {
  const words = q.trim().replace(/[\\%_]/g, (c) => `\\${c}`)
  const digits = q.replace(/\D/g, '')
  const match = words
    ? sql`HAVING bool_or(name ILIKE ${`%${words}%`})${digits.length >= 3 ? sql` OR phone LIKE ${`%${digits}%`}` : sql``}`
    : sql``
  const r = await db(payload).execute(sql`
    WITH people AS (
      SELECT ${phoneKey(sql.raw('customer_phone'))} AS phone, customer_name AS name, created_at, 'order' AS kind, total, status::text AS status
      FROM payload.orders WHERE status <> 'pending_payment'
      UNION ALL
      SELECT ${phoneKey(sql.raw('phone'))}, name, created_at, 'enquiry', NULL, status::text FROM payload.enquiries
    )
    SELECT phone,
      (array_agg(name ORDER BY created_at DESC) FILTER (WHERE coalesce(name, '') <> ''))[1] AS name,
      count(*) FILTER (WHERE kind = 'order' AND status <> 'cancelled')::int AS orders,
      coalesce(sum(total) FILTER (WHERE kind = 'order' AND status IN (${list(SOLD)})), 0)::float AS spent,
      max(created_at) FILTER (WHERE kind = 'order') AS "lastOrder",
      max(created_at) FILTER (WHERE kind = 'enquiry') AS "lastEnquiry",
      count(*) OVER ()::int AS "totalDocs"
    FROM people WHERE phone <> ''
    GROUP BY phone ${match}
    ORDER BY max(created_at) DESC
    LIMIT ${perPage} OFFSET ${(page - 1) * perPage}`)
  const rows = r.rows as (CustomerRow & { totalDocs: number })[]
  return { rows, totalDocs: rows[0]?.totalDocs ?? 0 }
}

/** One customer's orders and enquiries (by the last 10 digits of their phone). */
export async function customerHistory(payload: BasePayload, phone: string) {
  const [orders, enquiries] = await Promise.all([
    db(payload).execute(sql`
      SELECT id, order_number AS "orderNumber", status::text AS status, total::float AS total, payment_mode::text AS "paymentMode", created_at AS "createdAt", customer_name AS name
      FROM payload.orders WHERE status <> 'pending_payment' AND ${phoneKey(sql.raw('customer_phone'))} = ${phone}
      ORDER BY created_at DESC LIMIT 50`),
    db(payload).execute(sql`
      SELECT id, name, type::text AS type, status::text AS status, topic::text AS topic, created_at AS "createdAt", locale::text AS locale
      FROM payload.enquiries WHERE ${phoneKey(sql.raw('phone'))} = ${phone}
      ORDER BY created_at DESC LIMIT 50`),
  ])
  return {
    orders: orders.rows as { id: number; orderNumber: string | null; status: string; total: number | null; paymentMode: string | null; createdAt: string; name: string | null }[],
    enquiries: enquiries.rows as { id: number; name: string | null; type: string | null; status: string | null; topic: string | null; createdAt: string; locale: string | null }[],
  }
}

/** How many people asked to be reminded about each festival. */
export async function reminderCounts(payload: BasePayload) {
  const r = await db(payload).execute(sql`SELECT reminder_id AS id, count(*)::int AS n FROM payload.enquiries WHERE topic = 'reminder' AND reminder_id IS NOT NULL GROUP BY 1`)
  return new Map((r.rows as { id: number; n: number }[]).map((x) => [x.id, x.n]))
}

/** What the "Start a festival sale" preset needs: today in India, the current sale and the shop's categories. */
export async function salePresetData(payload: BasePayload) {
  const [settings, cats] = await Promise.all([
    payload.findGlobal({ slug: 'commerce-settings', depth: 0 }),
    payload.find({ collection: 'categories', where: { scope: { in: ['shop', 'both'] } }, depth: 0, limit: 100, sort: 'order', select: { name: true } }),
  ])
  const now = new Date()
  const sale = settings.festivalSale ?? null
  return { today: indiaToday(now), sale, state: saleState(sale, now), categories: cats.docs.map((c) => ({ id: c.id, name: c.name })) }
}
