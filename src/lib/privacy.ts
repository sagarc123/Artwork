// "Download my data": which rows belong to one customer. Pure, so it can be tested. The queries already ask only for this
// customer's rows; this filter runs again on what came back, so a mistake in a query cannot leak someone else's data.

export type Me = { id: number; phone: string; emails: string[]; visitorId?: string | null }
const id = (v: unknown) => (typeof v === 'object' && v !== null && 'id' in v ? (v as { id: unknown }).id : v)

type Rows = {
  orders: { id: number; account?: unknown; customer?: { phone?: string | null; email?: string | null } | null }[]
  enrolments: { id: number; customer?: unknown }[]
  progress: { id: number; enrolment?: unknown }[]
  certificates: { id: number; customer?: unknown }[]
  reviews: { id: number; customer?: unknown }[]
  consents: { id: number; customer?: unknown; subject?: string | null; email?: string | null }[]
  subscribers: { id: number; email: string }[]
}

/** The email addresses a customer used on their own orders (placed from the account or with its verified phone). */
export const orderEmails = (orders: Rows['orders'], me: { id: number; phone: string }) =>
  [...new Set(orders.filter((o) => id(o.account) === me.id || o.customer?.phone === me.phone).map((o) => o.customer?.email?.trim().toLowerCase()).filter((e): e is string => !!e))]

export function scopeExport<T extends Rows>(me: Me, rows: T): T {
  const orders = rows.orders.filter((o) => id(o.account) === me.id || (!!me.phone && o.customer?.phone === me.phone))
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
