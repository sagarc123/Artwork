// Newsletter double opt-in rules: signed tokens and the subscriber's states. Pure, so it can be tested.
import { createHmac, timingSafeEqual } from 'node:crypto'

/** Bump when the wording people agree to changes; every consent record keeps the version it was given under. */
export const NOTICE_VERSION = '2026-10-v1'
export const CONFIRM_HOURS = 48
/** An unsubscribe link sits in every email for a long time, so it lives longer (but still expires). */
export const UNSUBSCRIBE_DAYS = 730
/** The confirm email is sent again no sooner than this (stops anyone using the form to flood an inbox). */
export const RESEND_MINUTES = 10

export type Status = 'pending' | 'confirmed' | 'unsubscribed'
export type Event = 'subscribe' | 'confirm' | 'unsubscribe'

/** The next status, or null when the event changes nothing (or must not happen). */
export function nextStatus(from: Status | null, event: Event): Status | null {
  if (event === 'subscribe') return from === null || from === 'unsubscribed' ? 'pending' : null
  if (event === 'confirm') return from === 'pending' ? 'confirmed' : null // an unsubscribed address can only come back through a new sign-up
  return from === null || from === 'unsubscribed' ? null : 'unsubscribed'
}

/** Lower case, trimmed; null if it is not one plain address. */
export function cleanEmail(raw: unknown) {
  const e = (typeof raw === 'string' ? raw : '').trim().toLowerCase()
  return e.length <= 254 && /^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]{2,}$/.test(e) ? e : null
}

const b64 = (s: string) => Buffer.from(s).toString('base64url')
const mac = (secret: string, body: string) => createHmac('sha256', secret).update(`newsletter:${body}`).digest('base64url')

/** "payload.signature": the purpose, the address and the expiry, signed with the site secret. */
export function signToken(purpose: 'confirm' | 'unsubscribe', email: string, secret: string, now: number, ttlMs: number) {
  const body = b64(JSON.stringify({ p: purpose, e: email, x: now + ttlMs }))
  return `${body}.${mac(secret, body)}`
}

/** The address inside a genuine, unexpired token made for this purpose, else null. */
export function verifyToken(token: unknown, purpose: 'confirm' | 'unsubscribe', secret: string, now: number): string | null {
  if (typeof token !== 'string' || token.length > 600) return null
  const [body, sig, ...rest] = token.split('.')
  if (!body || !sig || rest.length) return null
  const want = Buffer.from(mac(secret, body))
  const got = Buffer.from(sig)
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null
  try {
    const d = JSON.parse(Buffer.from(body, 'base64url').toString()) as { p?: unknown; e?: unknown; x?: unknown }
    return d.p === purpose && typeof d.e === 'string' && typeof d.x === 'number' && d.x > now ? d.e : null
  } catch {
    return null
  }
}

/** One spreadsheet cell. A leading = + - @ would run as a formula when opened in Excel, so it gets a quote in front. */
export const csvCell = (v: unknown) => {
  let s = v == null ? '' : String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
}
