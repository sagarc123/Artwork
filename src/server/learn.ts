import 'server-only'
import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { getPayload, type BasePayload } from 'payload'
import { isLocale, type Locale } from '@/i18n/config'
import { forUnder18 } from '@/lib/courses'
import { newCertId, nameOnCertificate, nextToDo, progressCount, shouldIssue } from '@/lib/learn'

const db = (payload: BasePayload) => payload.db.drizzle

/** Ids of the lessons a course has, and which of them an enrolment has done. */
async function lessonAndDoneIds(payload: BasePayload, courseId: number, enrolmentId: number) {
  const [{ docs: lessons }, { docs: done }] = await Promise.all([
    payload.find({ collection: 'lessons', where: { course: { equals: courseId } }, limit: 1000, depth: 0, select: { order: true } }),
    payload.find({ collection: 'lesson-progress', where: { enrolment: { equals: enrolmentId } }, limit: 1000, depth: 0, select: { lesson: true } }),
  ])
  return { lessons, doneIds: done.map((d) => d.lesson as number) }
}

/** The enrolment this customer has in a course, or null: the one gate every player read and write passes. */
export async function enrolmentOf(payload: BasePayload, customerId: number, courseId: number) {
  const { docs } = await payload.find({ collection: 'enrolments', where: { and: [{ customer: { equals: customerId } }, { course: { equals: courseId } }] }, limit: 1, depth: 0 })
  return docs[0] ?? null
}

/** Everything the lesson page needs, for an enrolled customer only (null otherwise). The video id is read here, after the check. */
export async function playerData(customerId: number, slug: string, locale: Locale) {
  const payload = await getPayload({ config })
  const lang = isLocale(locale) ? locale : 'en'
  const { docs } = await payload.find({ collection: 'courses', locale: lang, where: { and: [{ _status: { equals: 'published' } }, { slug: { equals: slug } }] }, limit: 1, depth: 0 })
  const course = docs[0]
  if (!course) return { status: 'missing' as const }
  const enrolment = await enrolmentOf(payload, customerId, course.id)
  if (!enrolment) return { status: 'not_enrolled' as const, course }
  const [{ docs: lessons }, { docs: done }, { docs: certs }] = await Promise.all([
    payload.find({ collection: 'lessons', locale: lang, where: { course: { equals: course.id } }, sort: 'order', limit: 500, depth: 0 }),
    payload.find({ collection: 'lesson-progress', where: { enrolment: { equals: enrolment.id } }, limit: 1000, depth: 0, select: { lesson: true } }),
    payload.find({ collection: 'certificates', where: { enrolment: { equals: enrolment.id } }, limit: 1, depth: 0 }),
  ])
  return { status: 'ok' as const, course, enrolment, lessons, doneIds: done.map((d) => d.lesson as number), certificate: certs[0] ?? null }
}

/** Opening a lesson: remembers it as the last one, and the first time starts the no-refund rule. */
export async function recordOpen(customerId: number, lessonId: number) {
  const payload = await getPayload({ config })
  const lesson = await payload.findByID({ collection: 'lessons', id: lessonId, depth: 0, select: { course: true } }).catch(() => null)
  if (!lesson) return false
  const enrolment = await enrolmentOf(payload, customerId, lesson.course as number)
  if (!enrolment) return false
  await db(payload).execute(sql`UPDATE payload.enrolments SET first_accessed_at = coalesce(first_accessed_at, now()), last_lesson_id = ${lessonId} WHERE id = ${enrolment.id}`)
  return true
}

/**
 * "Mark as done": records the lesson for this customer's enrolment (a repeat changes nothing), and when that finishes the
 * course, issues the certificate. Null if the customer is not enrolled in the lesson's course.
 */
export async function completeLesson(customerId: number, lessonId: number) {
  const payload = await getPayload({ config })
  const lesson = await payload.findByID({ collection: 'lessons', id: lessonId, depth: 0, select: { course: true, order: true } }).catch(() => null)
  if (!lesson) return null
  const courseId = lesson.course as number
  const enrolment = await enrolmentOf(payload, customerId, courseId)
  if (!enrolment) return null
  const have = await payload.count({ collection: 'lesson-progress', where: { and: [{ enrolment: { equals: enrolment.id } }, { lesson: { equals: lessonId } }] } })
  if (!have.totalDocs) {
    try {
      await payload.create({ collection: 'lesson-progress', data: { enrolment: enrolment.id, lesson: lessonId, completedAt: new Date().toISOString() } })
    } catch (error) {
      // A double tap won the race: the unique index kept one row.
      const again = await payload.count({ collection: 'lesson-progress', where: { and: [{ enrolment: { equals: enrolment.id } }, { lesson: { equals: lessonId } }] } })
      if (!again.totalDocs) throw error
    }
  }
  await db(payload).execute(sql`UPDATE payload.enrolments SET first_accessed_at = coalesce(first_accessed_at, now()), last_lesson_id = ${lessonId} WHERE id = ${enrolment.id}`)
  const { lessons, doneIds } = await lessonAndDoneIds(payload, courseId, enrolment.id)
  const progress = progressCount(lessons.map((l) => l.id), doneIds)
  // ponytail: issued right here, in the request that finished the course. A job queue (retries, email) can take this over later.
  const certificate = progress.complete ? await issueCertificate(enrolment.id) : null
  const next = nextToDo(lessons, lessonId, doneIds)
  return { ...progress, nextId: next?.id ?? null, certificateId: certificate?.publicId ?? null }
}

/** One certificate per enrolment, however many times this runs or races: the unique enrolment index is the final guard. */
export async function issueCertificate(enrolmentId: number) {
  const payload = await getPayload({ config })
  const existing = await payload.find({ collection: 'certificates', where: { enrolment: { equals: enrolmentId } }, limit: 1, depth: 0 })
  const { lessons, doneIds } = await (async () => {
    const e = await payload.findByID({ collection: 'enrolments', id: enrolmentId, depth: 0 })
    return lessonAndDoneIds(payload, e.course as number, enrolmentId)
  })()
  if (!shouldIssue(progressCount(lessons.map((l) => l.id), doneIds), existing.docs[0])) return existing.docs[0] ?? null
  const e = await payload.findByID({ collection: 'enrolments', id: enrolmentId, depth: 1 })
  const customer = typeof e.customer === 'object' ? e.customer : null
  const course = typeof e.course === 'object' ? e.course : null
  if (!customer || !course) return null
  const name = nameOnCertificate({ under18: forUnder18(course.audience), customerName: customer.name, childFirstName: e.childFirstName }) || 'Art student'
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await payload.create({ collection: 'certificates', data: { publicId: newCertId(), nameOnCert: name, course: course.id, enrolment: enrolmentId, customer: customer.id, issuedAt: new Date().toISOString(), status: 'valid' } })
    } catch (error) {
      const again = await payload.find({ collection: 'certificates', where: { enrolment: { equals: enrolmentId } }, limit: 1, depth: 0 })
      if (again.docs[0]) return again.docs[0]
      if (attempt === 4) throw error // not a lost race and not an id clash
    }
  }
  return null
}

/** Admin: a new number (the old link stops working) and the name read again from the student; the certificate is genuine again. */
export async function reissueCertificate(id: number) {
  const payload = await getPayload({ config })
  const c = await payload.findByID({ collection: 'certificates', id, depth: 0 })
  // A refund removes the seat: such a certificate cannot be made genuine again from here.
  if (!c.enrolment) throw new Error('This certificate belongs to a course seat that was refunded.')
  const e = await payload.findByID({ collection: 'enrolments', id: c.enrolment as number, depth: 1 })
  const customer = typeof e.customer === 'object' ? e.customer : null
  const course = typeof e.course === 'object' ? e.course : null
  const name = customer && course ? nameOnCertificate({ under18: forUnder18(course.audience), customerName: customer.name, childFirstName: e.childFirstName }) : ''
  return payload.update({ collection: 'certificates', id, data: { publicId: newCertId(), nameOnCert: name || c.nameOnCert, status: 'valid' } })
}

/** For the My courses cards: lessons done and in total, per enrolment, in two queries. */
export async function progressFor(payload: BasePayload, enrolments: { id: number; course: number }[]) {
  if (!enrolments.length) return new Map<number, ReturnType<typeof progressCount>>()
  const courseIds = [...new Set(enrolments.map((e) => e.course))]
  const [{ docs: lessons }, { docs: done }] = await Promise.all([
    payload.find({ collection: 'lessons', where: { course: { in: courseIds } }, limit: 5000, depth: 0, select: { course: true } }),
    payload.find({ collection: 'lesson-progress', where: { enrolment: { in: enrolments.map((e) => e.id) } }, limit: 5000, depth: 0, select: { enrolment: true, lesson: true } }),
  ])
  return new Map(
    enrolments.map((e) => [
      e.id,
      progressCount(
        lessons.filter((l) => l.course === e.course).map((l) => l.id),
        done.filter((d) => d.enrolment === e.id).map((d) => d.lesson as number),
      ),
    ]),
  )
}

/** Admin: "3/5 done, certificate issued on 4 Nov 2026". */
// The course id comes from the caller: this runs inside the enrolment's own read, so it must not read enrolments again.
export async function progressText(payload: BasePayload, enrolmentId: number, courseId: number | undefined) {
  if (!courseId) return undefined
  const [{ lessons, doneIds }, { docs }] = await Promise.all([lessonAndDoneIds(payload, courseId, enrolmentId), payload.find({ collection: 'certificates', where: { enrolment: { equals: enrolmentId } }, limit: 1, depth: 0 })])
  const p = progressCount(lessons.map((l) => l.id), doneIds)
  const cert = docs[0]
  const day = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
  return `${p.done}/${p.total} done${cert ? (cert.status === 'revoked' ? `, certificate withdrawn (issued ${day(cert.issuedAt)})` : `, certificate issued on ${day(cert.issuedAt)}`) : ''}`
}

