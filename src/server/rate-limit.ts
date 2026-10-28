import 'server-only'
import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { clientIp, envInt, windowStart } from '@/lib/rate-limit'

// Counters live in Postgres (payload.rate_limits), so the limits hold across serverless instances. Fixed windows:
// a burst at a window's edge can briefly pass 2x `max`. Old rows are removed by the maintenance job (pruneRateLimits).
const db = async () => (await getPayload({ config })).db.drizzle

/** Counts one hit on `key` in the current window and returns the running count (atomic upsert). */
export async function hit(key: string, windowMs: number) {
  const start = new Date(windowStart(Date.now(), windowMs)).toISOString()
  const r = await (await db()).execute(sql`
    INSERT INTO payload.rate_limits (key, window_start, count) VALUES (${key}, ${start}, 1)
    ON CONFLICT (key, window_start) DO UPDATE SET count = payload.rate_limits.count + 1
    RETURNING count`)
  return Number((r.rows[0] as { count: number }).count)
}

/** The count on `key` in the current window, without counting a hit. */
export async function peek(key: string, windowMs: number) {
  const start = new Date(windowStart(Date.now(), windowMs)).toISOString()
  const r = await (await db()).execute(sql`SELECT count FROM payload.rate_limits WHERE key = ${key} AND window_start = ${start}`)
  return Number((r.rows[0] as { count: number } | undefined)?.count ?? 0)
}

/** Limit on an arbitrary key (a phone number, "everyone"): true while under `max` calls in the window. */
export const allowKey = async (key: string, max: number, windowMs: number) => (await hit(key, windowMs)) <= max

/** The visitor's address (see clientIp). TRUSTED_PROXY_HOPS: how many proxies of yours sit in front of the app (default 1). */
export async function visitorIp() {
  const h = await headers()
  return clientIp((n) => h.get(n), { onVercel: !!process.env.VERCEL, trustedHops: process.env.TRUSTED_PROXY_HOPS === undefined ? 1 : Number(process.env.TRUSTED_PROXY_HOPS) || 0 })
}

/** Limit per visitor address: true while under `max` calls in the window. */
export async function allow(action: string, max: number, windowMs: number) {
  return allowKey(`${action}:${await visitorIp()}`, max, windowMs)
}

/** Hourly cap on every sign-in SMS the site sends, against SMS pumping (OTP_GLOBAL_PER_HOUR, default 300). */
export const OTP_GLOBAL_PER_HOUR = () => envInt(process.env.OTP_GLOBAL_PER_HOUR, 300)

/** Deletes counters from finished windows (kept a day). Returns how many. */
export async function pruneRateLimits() {
  const r = await (await db()).execute(sql`DELETE FROM payload.rate_limits WHERE window_start < now() - interval '1 day'`)
  return r.rowCount ?? 0
}
