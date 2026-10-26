'use server'

import config from '@payload-config'
import { getPayload } from 'payload'
import { indiaToday } from '@/lib/dates'
import { validateEnquiry, type EnquiryField } from '@/lib/enquiry'
import { allow } from './rate-limit'

export type EnquiryState =
  | { status: 'idle' }
  | { status: 'error'; errors: EnquiryField[] }
  | { status: 'rate' }
  | { status: 'failed' }
  | { status: 'ok' }

const MAX_PER_HOUR = 3

/** Saves an enquiry to the admin inbox. The visitor then continues on WhatsApp. */
export async function submitEnquiry(_prev: EnquiryState, form: FormData): Promise<EnquiryState> {
  // Honeypot: real people never fill the hidden "website" field. Bots get a fake success.
  if (form.get('website')) return { status: 'ok' }

  // Dates are checked against today in India (the server's clock is UTC: after midnight IST it would still be "yesterday").
  const result = validateEnquiry(form, indiaToday())
  if (!result.ok) return { status: 'error', errors: result.errors }
  if (!(await allow('enquiry', 5, 10 * 60_000))) return { status: 'rate' }

  try {
    const payload = await getPayload({ config })
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { totalDocs } = await payload.count({
      collection: 'enquiries',
      where: { and: [{ phone: { equals: result.data.phone } }, { createdAt: { greater_than: since } }] },
    })
    if (totalDocs >= MAX_PER_HOUR) return { status: 'rate' }
    await payload.create({ collection: 'enquiries', data: result.data })
    return { status: 'ok' }
  } catch (error) {
    console.error('Enquiry could not be saved', error)
    return { status: 'failed' }
  }
}
