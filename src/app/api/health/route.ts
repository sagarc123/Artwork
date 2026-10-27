import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { connection } from 'next/server'
import { getPayload } from 'payload'

/** Uptime check: { ok, db }. 503 when the database doesn't answer. Never cached. */
export async function GET() {
  await connection() // request time, every time
  const headers = { 'Cache-Control': 'no-store' }
  try {
    const ping = async () => (await getPayload({ config })).db.drizzle.execute(sql`SELECT 1`)
    // A dead database can make the connection wait for a long time: give up after 5 s.
    await Promise.race([ping(), new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))])
    return Response.json({ ok: true, db: true }, { headers })
  } catch (error) {
    console.error('Health check: database unreachable', error)
    return Response.json({ ok: false, db: false }, { status: 503, headers })
  }
}
