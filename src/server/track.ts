'use server'

import config from '@payload-config'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import { isLocale, localePath } from '@/i18n/config'
import { normalisePhone } from '@/lib/enquiry'
import { normaliseOrderNumber } from '@/lib/track'
import { allow } from './rate-limit'

export type TrackState = { status: 'idle' | 'not_found' | 'rate' }

/** "Track my order": phone + order number → that order's private page. Wrong phone or wrong number get the same answer. */
export async function findOrder(_prev: TrackState, form: FormData): Promise<TrackState> {
  // Counted before anything else, so guessing order numbers is slow whatever is typed.
  if (!(await allow('track', 8, 10 * 60_000))) return { status: 'rate' }
  const phone = normalisePhone(String(form.get('phone') ?? '').slice(0, 20))
  const orderNumber = normaliseOrderNumber(String(form.get('orderNumber') ?? '').slice(0, 20))
  if (!phone || !orderNumber) return { status: 'not_found' }

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'orders',
    where: { and: [{ orderNumber: { equals: orderNumber } }, { 'customer.phone': { equals: phone } }] },
    limit: 1,
    depth: 0,
    select: { publicId: true },
  })
  const publicId = docs[0]?.publicId
  if (!publicId) return { status: 'not_found' }
  const locale = String(form.get('locale'))
  redirect(localePath(isLocale(locale) ? locale : 'en', `/order/${publicId}`))
}
