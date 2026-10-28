'use server'

import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { hasRole } from '@/payload/access'
import { eraseCustomer } from './erase'

/** Admin: "Remove this student's personal data". Owner only; checked here, not just by hiding the button. */
export async function eraseStudent(id: number) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!hasRole(user, 'owner')) return { status: 'forbidden' as const }
  const c = await payload.findByID({ collection: 'customers', id, depth: 0 }).catch(() => null)
  if (!c || c.deletedAt) return { status: 'missing' as const }
  await eraseCustomer(c.id, c.phone)
  return { status: 'ok' as const }
}
