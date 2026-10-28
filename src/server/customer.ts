import 'server-only'
import config from '@payload-config'
import { cookies } from 'next/headers'
import { connection } from 'next/server'
import { getPayload } from 'payload'
import { cache } from 'react'
import { readSession, SESSION_COOKIE, SESSION_DAYS, signSession } from '@/lib/auth'

const secret = () => process.env.PAYLOAD_SECRET!

export type Customer = { id: number; phone: string; name: string; savedSlugs: string[]; createdAt: string }

/** Is there a valid session cookie? (Signature and expiry only, no database: cheap enough for the header.) */
export async function hasSession() {
  await connection() // the expiry check reads the clock: per request, never prerendered
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  return readSession(token, secret(), Date.now()) !== null
}

/** The signed-in customer, or null. Always read this on the server; it is the only way an account is identified. */
export const getCustomer = cache(async (): Promise<Customer | null> => {
  await connection()
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const id = readSession(token, secret(), Date.now())
  if (id === null) return null
  const payload = await getPayload({ config })
  const doc = await payload.findByID({ collection: 'customers', id, depth: 0 }).catch(() => null)
  if (!doc || doc.deletedAt) return null
  const saved = Array.isArray(doc.savedSlugs) ? doc.savedSlugs.filter((s): s is string => typeof s === 'string') : []
  return { id: doc.id, phone: doc.phone, name: doc.name ?? '', savedSlugs: saved, createdAt: doc.createdAt }
})

/** httpOnly (scripts cannot read it), Secure in production, SameSite=Lax (not sent with cross-site form posts). */
export async function startSession(customerId: number) {
  ;(await cookies()).set(SESSION_COOKIE, signSession(customerId, secret(), Date.now()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 86400,
  })
}

export async function endSession() {
  ;(await cookies()).delete(SESSION_COOKIE)
}
