import type { Where } from 'payload'

// "Download my data": which rows belong to one customer. Pure, so it can be tested. The queries already ask only for this
// customer's rows; this filter runs again on what came back, so a mistake in a query cannot leak someone else's data.

/** `since`: when the account was created. Guest orders match by phone only from then on, so a recycled number never shows a stranger's older orders. */
export type Me = { id: number; phone: string; since?: string | null; emails: string[]; visitorId?: string | null }
const id = (v: unknown) => (typeof v === 'object' && v !== null && 'id' in v ? (v as { id: unknown }).id : v)

type Rows = {
  orders: { id: number; createdAt?: string; account?: unknown; customer?: { phone?: string | null; email?: string | null } | null }[]
  enrolments: { id: number; customer?: unknown }[]
  progress: { id: number; enrolment?: unknown }[]
  certificates: { id: number; customer?: unknown }[]
  reviews: { id: number; customer?: unknown }[]
  consents: { id: number; customer?: unknown; subject?: string | null; email?: string | null }[]
  subscribers: { id: number; email: string }[]
}

/** Orders linked to the account always count; a guest order counts only if it used this phone and came after the account was made. */
export const ownsOrder = (o: Rows['orders'][number], me: { id: number; phone: string; since?: string | null }) =>
  id(o.account) === me.id || (!!me.phone && !!me.since && !!o.createdAt && o.customer?.phone === me.phone && Date.parse(o.createdAt) >= Date.parse(me.since))

/** The same rule as a database query (My orders, reviews, the export). */
export const myOrdersWhere = (me: { id: number; phone: string; since: string }): Where => ({
  or: [{ account: { equals: me.id } }, { and: [{ 'customer.phone': { equals: me.phone } }, { createdAt: { greater_than_equal: me.since } }] }],
})

/** The email addresses a customer used on orders placed from their own account (never guest orders matched only by phone). */
export const orderEmails = (orders: Rows['orders'], me: { id: number }) =>
  [...new Set(orders.filter((o) => id(o.account) === me.id).map((o) => o.customer?.email?.trim().toLowerCase()).filter((e): e is string => !!e))]

export function scopeExport<T extends Rows>(me: Me, rows: T): T {
  const orders = rows.orders.filter((o) => ownsOrder(o, me))
  const enrolments = rows.enrolments.filter((e) => id(e.customer) === me.id)
  const mine = new Set(enrolments.map((e) => e.id))
  const emails = new Set(me.emails.map((e) => e.toLowerCase()))
  return {
    ...rows,
    orders,
    enrolments,
    progress: rows.progress.filter((p) => mine.has(id(p.enrolment) as number)),
    certificates: rows.certificates.filter((c) => id(c.customer) === me.id),
    reviews: rows.reviews.filter((r) => id(r.customer) === me.id),
    consents: rows.consents.filter((c) => id(c.customer) === me.id || (!!me.visitorId && c.subject === me.visitorId) || (!!c.email && emails.has(c.email.toLowerCase()))),
    subscribers: rows.subscribers.filter((s) => emails.has(s.email.toLowerCase())),
  }
}

export const DUE_DAYS = 30
/** When a privacy request must be answered by (the law and the plan: within 30 days). */
export const dueAt = (now: number) => new Date(now + DUE_DAYS * 86_400_000).toISOString()
