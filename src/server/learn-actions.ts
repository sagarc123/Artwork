'use server'

// Player actions. Each reads the signed session itself and works only on the signed-in customer's own enrolment.
import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { hasRole } from '@/payload/access'
import { getCustomer } from './customer'
import { completeLesson, recordOpen, reissueCertificate } from './learn'
import { allow } from './rate-limit'

const id = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v > 0 ? v : null)

/** The lesson page calls this on load: remembers the lesson and starts the no-refund rule. */
export async function openLesson(lessonId: number) {
  const me = await getCustomer()
  const lesson = id(lessonId)
  if (!me || !lesson) return { status: 'forbidden' as const }
  return { status: (await recordOpen(me.id, lesson)) ? ('ok' as const) : ('forbidden' as const) }
}

export async function markLessonDone(lessonId: number) {
  const me = await getCustomer()
  const lesson = id(lessonId)
  if (!me || !lesson) return { status: 'forbidden' as const }
  if (!(await allow('lesson-done', 60, 60_000))) return { status: 'rate' as const }
  const r = await completeLesson(me.id, lesson)
  return r ? { status: 'ok' as const, ...r } : { status: 'forbidden' as const }
}

/** For the Learn tab: My courses, or straight to the course when there is only one; the course list when there are none. */
export async function learnTarget() {
  const me = await getCustomer()
  if (!me) return '/courses'
  const payload = await getPayload({ config })
  const { docs, totalDocs } = await payload.find({ collection: 'enrolments', where: { customer: { equals: me.id } }, limit: 1, depth: 1 })
  if (totalDocs === 0) return '/courses'
  const course = typeof docs[0].course === 'object' ? docs[0].course : null
  return totalDocs === 1 && course ? `/learn/${course.slug}` : '/account'
}

/** Admin: withdraw a certificate, make it genuine again, or give it a new number. Owner only. */
export async function certificateAction(certId: number, action: 'withdraw' | 'restore' | 'reissue') {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!hasRole(user, 'owner')) return { status: 'forbidden' as const }
  const c = id(certId)
  if (!c) return { status: 'missing' as const }
  if (action === 'reissue') await reissueCertificate(c)
  else await payload.update({ collection: 'certificates', id: c, data: { status: action === 'withdraw' ? 'revoked' : 'valid' } })
  return { status: 'ok' as const }
}
