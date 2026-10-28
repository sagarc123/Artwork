'use server'

// Sign-in, profile and enrolment actions. Every export is a public endpoint: each one checks its own input and, where
// it needs an account, reads the signed session itself. Next.js refuses server-action posts whose Origin differs from the
// site's Host (the CSRF check), and the session cookie is SameSite=Lax on top of that.
import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'
import { canSend, checkCode, hashCode, newCode, OTP_MAX_PER_DAY, OTP_MAX_TOTAL, OTP_MAX_TRIES, OTP_MINUTES, type OtpRow } from '@/lib/auth'
import { CHILD_NAME_MAX } from '@/lib/cart'
import { coursePrice, forUnder18 } from '@/lib/courses'
import { normalisePhone } from '@/lib/enquiry'
import { createSeats } from './enrol'
import { eraseCustomer } from './erase'
import { endSession, getCustomer, hasSession, startSession } from './customer'
import { allow, allowKey, hit, OTP_GLOBAL_PER_HOUR, peek, visitorIp } from './rate-limit'
import { sendOtp } from './sms'

const secret = () => process.env.PAYLOAD_SECRET!
const clip = (s: unknown, max: number) => (typeof s === 'string' ? s.trim().replace(/\s+/g, ' ').slice(0, max) : '')
const db = async () => (await getPayload({ config })).db.drizzle

type Row = { code_hash: string; expires_at: Date | string; sent_at: Date | string; attempts: number }
const toRow = (r: Row | undefined): OtpRow | null => (r ? { codeHash: r.code_hash, expiresAt: new Date(r.expires_at).getTime(), sentAt: new Date(r.sent_at).getTime(), attempts: Number(r.attempts) } : null)

export type RequestOtpResult = { status: 'sent'; testCode?: string } | { status: 'invalid' | 'rate' | 'wait' | 'failed' }

/** Step 1: a 6-digit code to the phone. */
export async function requestOtp(phoneRaw: string): Promise<RequestOtpResult> {
  const phone = normalisePhone(clip(phoneRaw, 20))
  if (!phone) return { status: 'invalid' }
  if (!(await allow('otp-send', 5, 10 * 60_000))) return { status: 'rate' }
  const d = await db()
  const now = Date.now()
  const old = toRow((await d.execute(sql`SELECT code_hash, expires_at, sent_at, attempts FROM payload.otp_codes WHERE phone = ${phone}`)).rows[0] as Row | undefined)
  const may = canSend(old, now)
  if (may !== 'ok') return { status: may }
  // SMS pumping: a daily cap per phone and an hourly cap for the whole site. Counted only for codes that really go out.
  if (!(await allowKey(`otp-phone:${phone}`, OTP_MAX_PER_DAY, 24 * 3600_000)) || !(await allowKey('otp-global', OTP_GLOBAL_PER_HOUR(), 3600_000))) return { status: 'rate' }
  const code = newCode()
  // Wrong guesses carry over while the old code is still alive, so asking for new codes never gives more tries.
  await d.execute(sql`
    INSERT INTO payload.otp_codes (phone, code_hash, expires_at, sent_at, attempts)
    VALUES (${phone}, ${hashCode(phone, code, secret())}, ${new Date(now + OTP_MINUTES * 60_000).toISOString()}, ${new Date(now).toISOString()}, 0)
    ON CONFLICT (phone) DO UPDATE SET code_hash = EXCLUDED.code_hash, expires_at = EXCLUDED.expires_at, sent_at = EXCLUDED.sent_at, updated_at = now(),
      attempts = CASE WHEN payload.otp_codes.expires_at > now() AND payload.otp_codes.attempts < ${OTP_MAX_TOTAL} THEN payload.otp_codes.attempts ELSE 0 END`)
  const sent = await sendOtp(phone, code)
  if (!sent.ok) {
    await d.execute(sql`DELETE FROM payload.otp_codes WHERE phone = ${phone}`)
    return { status: 'failed' }
  }
  return { status: 'sent', testCode: sent.testCode }
}

export type VerifyResult = { status: 'ok'; name: string; saved: string[] } | { status: 'invalid' | 'rate' | 'wrong' | 'expired' | 'locked' | 'failed' }

/** Step 2: the code. A right code signs in (creating the account the first time); `saved` is this device's saved pieces, merged into the account. */
export async function verifyOtp(phoneRaw: string, codeRaw: string, saved: unknown): Promise<VerifyResult> {
  const phone = normalisePhone(clip(phoneRaw, 20))
  const code = clip(codeRaw, 6)
  if (!phone || !/^\d{6}$/.test(code)) return { status: 'invalid' }
  if (!(await allow('otp-verify', 15, 10 * 60_000))) return { status: 'rate' }
  const d = await db()
  // Wrong guesses are counted per phone AND visitor address, so someone typing wrong codes for your number locks only themselves.
  const tries = `otp-wrong:${phone}:${await visitorIp()}`
  const mine = await peek(tries, OTP_MINUTES * 60_000)
  // One transaction, row locked: two guesses at once cannot both be counted as "the first".
  const outcome = await d.transaction(async (tx) => {
    const row = toRow((await tx.execute(sql`SELECT code_hash, expires_at, sent_at, attempts FROM payload.otp_codes WHERE phone = ${phone} FOR UPDATE`)).rows[0] as Row | undefined)
    const result = checkCode(row, phone, code, secret(), Date.now(), mine)
    if (result === 'ok') await tx.execute(sql`DELETE FROM payload.otp_codes WHERE phone = ${phone}`) // a code works once
    if (result === 'wrong') {
      await tx.execute(sql`UPDATE payload.otp_codes SET attempts = attempts + 1 WHERE phone = ${phone}`)
      return mine + 1 >= OTP_MAX_TRIES || row!.attempts + 1 >= OTP_MAX_TOTAL ? ('locked' as const) : result
    }
    return result
  })
  if (outcome === 'wrong' || (outcome === 'locked' && mine < OTP_MAX_TRIES)) await hit(tries, OTP_MINUTES * 60_000)
  if (outcome === 'none') return { status: 'expired' }
  if (outcome !== 'ok') return { status: outcome }

  try {
    const payload = await getPayload({ config })
    const find = async () => (await payload.find({ collection: 'customers', where: { phone: { equals: phone } }, limit: 1, depth: 0 })).docs[0]
    const customer = (await find()) ?? (await payload.create({ collection: 'customers', data: { phone } }).catch(find))
    if (!customer) return { status: 'failed' }
    // Saved pieces: the device's list and the account's list, joined (the device's newest first).
    const mine = Array.isArray(saved) ? saved.filter((s): s is string => typeof s === 'string' && s.length <= 200).slice(0, 100) : []
    const had = Array.isArray(customer.savedSlugs) ? customer.savedSlugs.filter((s): s is string => typeof s === 'string') : []
    const merged = [...new Set([...mine, ...had])].slice(0, 100)
    if (merged.length !== had.length) await payload.update({ collection: 'customers', id: customer.id, data: { savedSlugs: merged } })
    await startSession(customer.id)
    return { status: 'ok', name: customer.name ?? '', saved: merged }
  } catch (error) {
    console.error('Sign-in failed', error)
    return { status: 'failed' }
  }
}

/** For the header link. */
export async function isSignedIn() {
  return hasSession()
}

export async function signOut() {
  await endSession()
}

/** "What should I call you?" and the Profile name box. */
export async function saveName(name: string) {
  const me = await getCustomer()
  const clean = clip(name, 60)
  if (!me || clean.length < 2) return { status: 'invalid' as const }
  await (await getPayload({ config })).update({ collection: 'customers', id: me.id, data: { name: clean } })
  return { status: 'ok' as const }
}

/**
 * "Delete my account". Follows the privacy plan: sign-in codes and saved pieces are removed, the name, phone and any child's
 * name are wiped, and the order's name, phone, email and street address are redacted. Orders and invoices themselves stay
 * for the tax records (the confirmation says so). All in one transaction.
 */
export async function deleteAccount(confirm: string) {
  const me = await getCustomer()
  if (!me) return { status: 'login' as const }
  if (clip(confirm, 20).toUpperCase() !== 'DELETE') return { status: 'invalid' as const }
  await eraseCustomer(me.id, me.phone)
  await endSession()
  return { status: 'ok' as const }
}

export type EnrolState = 'guest' | 'in' | 'enrolled'

/** For the Enrol button: signed out, signed in, or already enrolled in this course. */
export async function getEnrolState(slug: string): Promise<EnrolState> {
  const me = await getCustomer()
  if (!me) return 'guest'
  const { totalDocs } = await (await getPayload({ config })).count({ collection: 'enrolments', where: { and: [{ customer: { equals: me.id } }, { 'course.slug': { equals: clip(slug, 120) } }] } })
  return totalDocs ? 'enrolled' : 'in'
}

/** A free course: enrol straight away once signed in (no order). Under-18 courses need the parent's tick. */
export async function enrolFree(slug: string, childName: string, consent: boolean) {
  const me = await getCustomer()
  if (!me) return { status: 'login' as const }
  if (!(await allow('enrol-free', 10, 10 * 60_000))) return { status: 'rate' as const }
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'courses', where: { and: [{ _status: { equals: 'published' } }, { slug: { equals: clip(slug, 120) } }] }, limit: 1, depth: 0 })
  const course = docs[0]
  if (!course) return { status: 'unavailable' as const }
  if (!coursePrice(course).free) return { status: 'paid' as const } // a paid course is never given away from here
  const under18 = forUnder18(course.audience)
  if (under18 && consent !== true) return { status: 'consent' as const }
  await createSeats(me.id, [{ course: course.id, childFirstName: under18 ? clip(childName, CHILD_NAME_MAX) : null, guardianConsent: under18 }], 'free')
  return { status: 'ok' as const }
}
