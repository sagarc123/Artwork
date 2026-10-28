// Customer sign-in maths (phone OTP and the session cookie). Pure: no database, no Next, so it can be tested.
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'

export const OTP_MINUTES = 10
export const OTP_MAX_TRIES = 5
/** A new code can be asked for this often (per phone). */
export const OTP_RESEND_SECONDS = 30
export const SESSION_DAYS = 30
export const SESSION_COOKIE = 'sm_session'

const hmac = (secret: string, text: string) => createHmac('sha256', secret).update(text).digest('hex')

export const newCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0')

/** Only a keyed hash of the code is stored (the phone is part of it, so a code cannot be moved to another number). */
export const hashCode = (phone: string, code: string, secret: string) => hmac(secret, `otp:${phone}:${code}`)

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))

export type OtpRow = { codeHash: string; expiresAt: number; attempts: number; sentAt: number }

/**
 * Checks a typed code. `ok` also means the row must now be deleted (a code works once).
 * Every wrong guess counts; after OTP_MAX_TRIES the row is locked until it expires or is replaced.
 */
export function checkCode(row: OtpRow | null | undefined, phone: string, code: string, secret: string, now: number): 'ok' | 'wrong' | 'expired' | 'locked' | 'none' {
  if (!row) return 'none'
  if (row.expiresAt <= now) return 'expired'
  if (row.attempts >= OTP_MAX_TRIES) return 'locked'
  return same(row.codeHash, hashCode(phone, code, secret)) ? 'ok' : 'wrong'
}

/** May a new code be sent now? A locked phone waits for its code to expire; otherwise a short pause between codes. */
export function canSend(row: OtpRow | null | undefined, now: number): 'ok' | 'wait' | 'locked' {
  if (!row) return 'ok'
  if (row.attempts >= OTP_MAX_TRIES && row.expiresAt > now) return 'locked'
  return now - row.sentAt < OTP_RESEND_SECONDS * 1000 ? 'wait' : 'ok'
}

/** The code may be shown on screen only while developing, and only when no SMS provider is set up. Never in production. */
export const showTestCode = (nodeEnv: string | undefined, hasProvider: boolean) => nodeEnv === 'development' && !hasProvider

/** Signed session: `id.expires.signature`. Signed with the server secret; the cookie itself is httpOnly. */
export function signSession(customerId: number, secret: string, now: number, days = SESSION_DAYS) {
  const body = `${customerId}.${Math.floor(now / 1000) + days * 86400}`
  return `${body}.${hmac(secret, `session:${body}`)}`
}

export function readSession(token: string | undefined, secret: string, now: number): number | null {
  const m = /^(\d{1,12})\.(\d{1,12})\.([0-9a-f]{64})$/.exec(token ?? '')
  if (!m || !same(m[3], hmac(secret, `session:${m[1]}.${m[2]}`)) || Number(m[2]) * 1000 <= now) return null
  return Number(m[1])
}

/** Where to go after signing in: a path on this site only (never another site, never `//host`). */
export function safeNext(next: unknown, fallback = '/account') {
  return typeof next === 'string' && /^\/(?![/\\])[^\s\\]*$/.test(next) && next.length < 300 ? next : fallback
}
