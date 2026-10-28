import config from '@payload-config'
import { getPayload } from 'payload'
import { csvCell } from '@/lib/newsletter'
import { hasRole } from '@/payload/access'

/** The newsletter list as a CSV file for the owner (opened in Excel or sent to Resend). Owner only. */
export async function GET(req: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!hasRole(user, 'owner')) return new Response('Not allowed', { status: 403 })
  const { docs } = await payload.find({ collection: 'subscribers', sort: 'createdAt', limit: 100000, depth: 0, pagination: false })
  const rows = [['email', 'status', 'confirmed_on', 'unsubscribed_on', 'language', 'signed_up_on'], ...docs.map((d) => [d.email, d.status, d.confirmedAt, d.unsubscribedAt, d.locale, d.createdAt])]
  return new Response(`﻿${rows.map((r) => r.map(csvCell).join(',')).join('\r\n')}\r\n`, {
    headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="newsletter.csv"', 'cache-control': 'no-store' },
  })
}
