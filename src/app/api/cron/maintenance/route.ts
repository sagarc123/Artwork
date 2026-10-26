import { timingSafeEqual } from 'node:crypto'
import { runMaintenance } from '@/server/order-service'

/**
 * Every 5 minutes (vercel.json; or any scheduler that can send a header): frees stock held by abandoned checkouts,
 * issues invoices that failed the first time and checks held stock against open orders. Safe to call twice.
 * Needs `Authorization: Bearer <CRON_SECRET>` (Vercel Cron sends it by itself when CRON_SECRET is set).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const given = Buffer.from(request.headers.get('authorization') ?? '')
  const wanted = Buffer.from(`Bearer ${secret}`)
  // Fail closed: no secret configured means nobody may run it.
  if (!secret || given.length !== wanted.length || !timingSafeEqual(given, wanted)) return Response.json({ error: 'unauthorized' }, { status: 401 })
  try {
    return Response.json({ ok: true, ...(await runMaintenance()) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Maintenance failed', error)
    return Response.json({ ok: false }, { status: 500 })
  }
}
