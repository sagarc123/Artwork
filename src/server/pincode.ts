'use server'

import { isPincode, parsePincodeResponse, type PincodePlace } from '@/lib/pincode'
import { allow } from './rate-limit'

// ponytail: per-process memory, like the rate limit. Pincodes don't move, so entries never expire; capped in size.
const cache = new Map<string, PincodePlace>()
const MAX_CACHED = 5000

/**
 * City and state for an Indian pincode, from India Post's free API. Null whenever anything goes wrong
 * (slow, down, unknown pincode, too many lookups): checkout never waits on it, the buyer just types them.
 */
export async function lookupPincode(pin: string): Promise<PincodePlace | null> {
  if (!isPincode(pin)) return null
  const hit = cache.get(pin)
  if (hit) return hit
  if (!(await allow('pincode', 20, 60_000))) return null
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: AbortSignal.timeout(3000), cache: 'no-store' })
    if (!res.ok) return null
    const place = parsePincodeResponse(await res.json())
    if (place) {
      if (cache.size >= MAX_CACHED) cache.delete(cache.keys().next().value!)
      cache.set(pin, place)
    }
    return place
  } catch {
    return null
  }
}
