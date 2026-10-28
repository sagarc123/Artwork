'use server'

// The cookie banner's record-keeping. A public endpoint: it takes two yes/no answers and nothing else. Who the record
// belongs to comes from the signed visitor cookie and the signed session, never from anything the browser sends.
import config from '@payload-config'
import { getPayload } from 'payload'
import { CONSENT_VERSION } from '@/lib/consent'
import { getCustomer } from './customer'
import { allow } from './rate-limit'
import { visitorId } from './visitor'

const PURPOSES = [
  ['analytics', 'analytics'],
  ['marketing', 'marketing_cookies'],
] as const

export async function recordConsent(choice: { analytics: boolean; marketing: boolean }) {
  if (typeof choice?.analytics !== 'boolean' || typeof choice?.marketing !== 'boolean') return 'invalid' as const
  if (!(await allow('consent', 20, 10 * 60_000))) return 'rate' as const
  try {
    const payload = await getPayload({ config })
    const subject = await visitorId()
    const me = await getCustomer()
    const now = new Date().toISOString()
    for (const [key, purpose] of PURPOSES) {
      const found = (await payload.find({ collection: 'consents', where: { and: [{ subject: { equals: subject } }, { purpose: { equals: purpose } }] }, limit: 1, depth: 0 })).docs[0]
      if (choice[key]) {
        const data = { grantedAt: now, withdrawnAt: null, noticeVersion: CONSENT_VERSION, source: 'banner', customer: me?.id }
        if (found) await payload.update({ collection: 'consents', id: found.id, data })
        else await payload.create({ collection: 'consents', data: { ...data, subject, purpose } })
      } else if (found && !found.withdrawnAt) {
        await payload.update({ collection: 'consents', id: found.id, data: { withdrawnAt: now } })
      }
    }
    return 'ok' as const
  } catch (error) {
    console.error('Consent not recorded', error)
    return 'failed' as const
  }
}
