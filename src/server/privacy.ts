import 'server-only'
import config from '@payload-config'
import { getPayload, type Where } from 'payload'
import { dueAt, orderEmails, scopeExport } from '@/lib/privacy'

/** One line in "Privacy requests". Both the export and the erase do their work at once, so they are written as done. */
export async function logRequest(type: 'export' | 'erase', customer: number, source: 'account' | 'admin') {
  try {
    const now = Date.now()
    await (await getPayload({ config })).create({ collection: 'data-requests', data: { type, status: 'done', customer, source, dueAt: dueAt(now), doneAt: new Date(now).toISOString() } })
  } catch (error) {
    console.error('Privacy request not logged', error)
  }
}

/** Everything held about one customer, as plain data for the download. Only this customer's rows (see scopeExport). */
export async function exportData(me: { id: number; phone: string; name: string }, visitorId: string | null) {
  const payload = await getPayload({ config })
  const find = <C extends 'orders' | 'enrolments' | 'lesson-progress' | 'certificates' | 'reviews' | 'consents' | 'subscribers'>(collection: C, where: Where) =>
    payload.find({ collection, where, limit: 5000, depth: 0, pagination: false, overrideAccess: true }).then((r) => r.docs)
  const customer = await payload.findByID({ collection: 'customers', id: me.id, depth: 0 })
  const orders = await find('orders', { or: [{ account: { equals: me.id } }, { 'customer.phone': { equals: me.phone } }] })
  const emails = orderEmails(orders, me)
  const enrolments = await find('enrolments', { customer: { equals: me.id } })
  const [progress, certificates, reviews, consents, subscribers] = await Promise.all([
    enrolments.length ? find('lesson-progress', { enrolment: { in: enrolments.map((e) => e.id) } }) : [],
    find('certificates', { customer: { equals: me.id } }),
    find('reviews', { customer: { equals: me.id } }),
    find('consents', { or: [{ customer: { equals: me.id } }, ...(visitorId ? [{ subject: { equals: visitorId } }] : []), ...(emails.length ? [{ email: { in: emails } }] : [])] }),
    emails.length ? find('subscribers', { email: { in: emails } }) : [],
  ])
  const own = scopeExport({ id: me.id, phone: me.phone, emails, visitorId }, { orders, enrolments, progress, certificates, reviews, consents, subscribers })
  const day = (v?: string | null) => v ?? null
  return {
    exportedAt: new Date().toISOString(),
    note: 'Everything this website holds about your account, and about the email addresses you used on your orders.',
    profile: { id: customer.id, phone: customer.phone, name: customer.name ?? null, savedPieces: customer.savedSlugs ?? [], createdAt: customer.createdAt },
    orders: own.orders.map((o) => ({
      orderNumber: o.orderNumber, status: o.status, placedOn: o.createdAt, total: o.total, paymentMode: o.paymentMode,
      customer: o.customer, address: o.address ?? null, courier: o.courier ?? null, trackingNumber: o.trackingNumber ?? null,
      items: (o.items ?? []).map((i) => ({ title: i.title, quantity: i.qty, unitPrice: i.unitPrice, lineTotal: i.lineTotal, childFirstName: i.childFirstName ?? null, parentAgreed: i.guardianConsent ?? false })),
    })),
    courseSeats: own.enrolments.map((e) => ({ course: id(e.course), since: e.createdAt, how: e.source, childFirstName: e.childFirstName ?? null, parentAgreedOn: day(e.guardianConsentAt), firstOpenedOn: day(e.firstAccessedAt) })),
    lessonsDone: own.progress.map((p) => ({ lesson: id(p.lesson), seat: id(p.enrolment), doneOn: p.completedAt })),
    certificates: own.certificates.map((c) => ({ number: c.publicId, nameOnCertificate: c.nameOnCert, course: id(c.course), issuedOn: c.issuedAt, status: c.status })),
    reviews: own.reviews.map((r) => ({ about: r.kind, item: id(r.product) ?? id(r.course), stars: r.rating, text: r.text, nameShown: r.name, status: r.status, writtenOn: r.createdAt })),
    consents: own.consents.map((c) => ({ purpose: c.purpose, email: c.email ?? null, wording: c.noticeVersion, source: c.source, agreedOn: c.grantedAt, withdrawnOn: day(c.withdrawnAt) })),
    newsletter: own.subscribers.map((s) => ({ email: s.email, status: s.status, confirmedOn: day(s.confirmedAt), unsubscribedOn: day(s.unsubscribedAt), signedUpOn: s.createdAt })),
  }
}

const id = (v: unknown) => (typeof v === 'object' && v !== null && 'id' in v ? (v as { id: unknown }).id : v)
