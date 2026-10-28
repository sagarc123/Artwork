import 'server-only'
import config from '@payload-config'
import { getPayload } from 'payload'
import { checkCourseReview, checkProductReview, productBought, type ReviewCheck } from '@/lib/reviews'
import { enrolmentOf, progressFor } from './learn'

export type ReviewKind = 'product' | 'course'

/** Has this customer already reviewed this item? (One review per customer per item.) */
export async function hasReviewed(customerId: number, kind: ReviewKind, id: number) {
  const payload = await getPayload({ config })
  const { totalDocs } = await payload.count({ collection: 'reviews', where: { and: [{ customer: { equals: customerId } }, { [kind]: { equals: id } }] } })
  return totalDocs > 0
}

/** Every item this customer has reviewed, for the account page. */
export async function reviewedBy(customerId: number) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'reviews', where: { customer: { equals: customerId } }, limit: 500, depth: 0, select: { product: true, course: true } })
  return { products: new Set(docs.flatMap((d) => (typeof d.product === 'number' ? [d.product] : []))), courses: new Set(docs.flatMap((d) => (typeof d.course === 'number' ? [d.course] : []))) }
}

/**
 * May this signed-in customer review this item right now? The one place the rule is decided, for the form page and the
 * submit action alike: products need a delivered order (or a paid digital one), courses a seat with 30% of lessons done.
 */
export async function reviewCheck(me: { id: number; phone: string }, kind: ReviewKind, id: number): Promise<ReviewCheck> {
  const payload = await getPayload({ config })
  const existing = await hasReviewed(me.id, kind, id)
  if (kind === 'product') {
    // Same orders as "My orders": placed from this account, or earlier with the phone number it has proved.
    const { docs } = await payload.find({ collection: 'orders', where: { or: [{ account: { equals: me.id } }, { 'customer.phone': { equals: me.phone } }] }, limit: 200, depth: 0, select: { status: true, items: true } })
    const orders = docs.map((o) => ({ status: o.status, items: (o.items ?? []).map((i) => ({ product: typeof i.product === 'number' ? i.product : null, type: i.type })) }))
    return checkProductReview(productBought(orders, id), existing)
  }
  const enrolment = await enrolmentOf(payload, me.id, id)
  const percent = enrolment ? ((await progressFor(payload, [{ id: enrolment.id, course: id }])).get(enrolment.id)?.percent ?? 0) : 0
  return checkCourseReview(!!enrolment, percent, existing)
}
