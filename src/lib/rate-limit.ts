// Rate-limit maths, shared by the server and the tests. Pure: no database, no Next.

/** Start of the fixed window `now` falls in. Every call in the same window shares one counter row. */
export const windowStart = (now: number, windowMs: number) => Math.floor(now / windowMs) * windowMs

/** A positive whole number from an env var, or the fallback. */
export const envInt = (value: string | undefined, fallback: number) => {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : fallback
}

/**
 * The visitor's address, from headers a visitor cannot forge.
 * - On Vercel: `x-vercel-forwarded-for`, which the platform sets itself (anywhere else it could be sent by anyone).
 * - Otherwise: x-forwarded-for, counted from the RIGHT. Each trusted proxy appends the address it saw, so the entries on
 *   the left are whatever the client claimed. `trustedHops` is how many proxies of ours sit in front of the app (0: no
 *   proxy, ignore the header).
 */
export function clientIp(get: (name: string) => string | null, opts: { onVercel: boolean; trustedHops: number }) {
  if (opts.onVercel) {
    const v = get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
    if (v) return v
  }
  if (opts.trustedHops > 0) {
    const parts = (get('x-forwarded-for') ?? '').split(',').map((s) => s.trim()).filter(Boolean)
    const hit = parts[parts.length - opts.trustedHops]
    if (hit) return hit
  }
  return 'unknown'
}
