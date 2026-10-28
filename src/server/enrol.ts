import 'server-only'
import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'
import { seatsToCreate } from '@/lib/courses'

type SeatLine = Parameters<typeof seatsToCreate>[0][number]

/**
 * Gives a customer lifetime access to the courses in `items`, once each. Safe to call again (webhook retries, double taps):
 * seats they already have are skipped, and the unique customer + course index settles any race.
 */
export async function createSeats(customerId: number, items: SeatLine[], source: 'paid' | 'free', orderId?: number) {
  const payload = await getPayload({ config })
  const ids = items.map((i) => i.course).filter((c): c is number => typeof c === 'number')
  if (!ids.length) return 0
  const { docs } = await payload.find({ collection: 'enrolments', where: { and: [{ customer: { equals: customerId } }, { course: { in: ids } }] }, limit: ids.length, depth: 0, select: { course: true } })
  const have = docs.map((d) => d.course as number)
  let made = 0
  for (const seat of seatsToCreate(items, have)) {
    try {
      await payload.create({
        collection: 'enrolments',
        data: {
          customer: customerId,
          course: seat.course,
          source,
          order: orderId,
          childFirstName: seat.childFirstName,
          guardianConsentAt: seat.guardianConsent ? new Date().toISOString() : undefined,
        },
      })
      made++
    } catch (error) {
      // Lost a race with another request: fine if the seat now exists.
      const { totalDocs } = await payload.count({ collection: 'enrolments', where: { and: [{ customer: { equals: customerId } }, { course: { equals: seat.course } }] } })
      if (!totalDocs) throw error
    }
  }
  return made
}

/** Is this customer enrolled in this course? Part 2b's player calls this before showing any lesson. */
export async function isEnrolled(customerId: number, courseId: number) {
  const payload = await getPayload({ config })
  const { totalDocs } = await payload.count({ collection: 'enrolments', where: { and: [{ customer: { equals: customerId } }, { course: { equals: courseId } }] } })
  return totalDocs > 0
}

/** A paid order's course lines become seats for the account that placed it. Called from markPaid, so only a verified payment gets here. */
export async function enrolFromOrder(orderId: number) {
  const payload = await getPayload({ config })
  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0 })
  const items = (order.items ?? []).filter((it) => typeof it.course === 'number')
  if (!items.length) return
  const account = typeof order.account === 'number' ? order.account : null
  if (!account) {
    console.error(`Order ${orderId} has course lines but no account: nobody was enrolled`)
    return
  }
  await createSeats(account, items.map((it) => ({ course: it.course as number, childFirstName: it.childFirstName, guardianConsent: it.guardianConsent })), 'paid', orderId)
  // Nothing to pack or post for a course-only order: it is complete once the seat exists.
  if (items.length === (order.items ?? []).length) {
    await payload.db.drizzle.execute(sql`UPDATE payload.orders SET status = 'delivered' WHERE id = ${orderId} AND status = 'paid'`)
  }
}

/**
 * A course order was refunded or cancelled: its seats go, so /learn stops working. Progress goes with the seat; a certificate
 * already issued stays on record but is withdrawn (the verify page then says so). One transaction.
 */
export async function revokeSeats(orderId: number) {
  const d = (await getPayload({ config })).db.drizzle
  await d.transaction(async (tx) => {
    const seats = sql`SELECT id FROM payload.enrolments WHERE order_id = ${orderId}`
    await tx.execute(sql`UPDATE payload.certificates SET status = 'revoked' WHERE enrolment_id IN (${seats})`)
    await tx.execute(sql`DELETE FROM payload.lesson_progress WHERE enrolment_id IN (${seats})`)
    await tx.execute(sql`DELETE FROM payload.enrolments WHERE order_id = ${orderId}`)
  })
}
