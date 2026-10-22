import 'server-only'
import { headers } from 'next/headers'

// ponytail: in-memory, per server process. Move to Redis/Postgres if the site runs on several instances.
const hits = new Map<string, number[]>()
const MAX_KEYS = 10_000

/** Sliding-window limit per visitor IP: true while under `max` calls in the last `windowMs`. */
export async function allow(action: string, max: number, windowMs: number) {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const key = `${action}:${ip}`
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= max) return false
  recent.push(now)
  hits.delete(key) // re-insert so the Map stays ordered oldest-first
  hits.set(key, recent)
  if (hits.size > MAX_KEYS) hits.delete(hits.keys().next().value!)
  return true
}
