import 'server-only'
import config from '@payload-config'
import { getPayload } from 'payload'
import en from '@/i18n/messages/en.json'
import hi from '@/i18n/messages/hi.json'
import mr from '@/i18n/messages/mr.json'
import { localePath, type Locale } from '@/i18n/config'
import { CONFIRM_HOURS, NOTICE_VERSION, nextStatus, RESEND_MINUTES, signToken, UNSUBSCRIBE_DAYS, verifyToken } from '@/lib/newsletter'
import { site } from '@/lib/site'
import { sendEmail } from './email'

const secret = () => process.env.PAYLOAD_SECRET!
const words = { en, mr, hi }
const HOUR = 3_600_000

/** The unsubscribe link for an address: one click, no sign-in (the signed address in it is the proof). */
export const unsubscribeLink = (email: string, locale: Locale) =>
  `${site.url}/api/newsletter/unsubscribe?t=${signToken('unsubscribe', email, secret(), Date.now(), UNSUBSCRIBE_DAYS * 24 * HOUR)}&lang=${locale}`

/** The "please confirm" email, in the visitor's language. Every email carries the one-click unsubscribe link. */
async function sendConfirm(email: string, locale: Locale) {
  const m = words[locale].newsletter.email
  const confirm = `${site.url}${localePath(locale, '/newsletter/confirm')}?t=${signToken('confirm', email, secret(), Date.now(), CONFIRM_HOURS * HOUR)}`
  const unsubscribe = unsubscribeLink(email, locale)
  return sendEmail({
    to: email,
    subject: m.subject,
    text: [m.hello, '', m.body.replace('{hours}', String(CONFIRM_HOURS)), '', confirm, '', m.ignore, '', `${m.unsubscribe}: ${unsubscribe}`].join('\n'),
    headers: { 'List-Unsubscribe': `<${unsubscribe}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
  })
}

/**
 * A sign-up from the form: stores the address as "pending" with a consent record, and sends the confirm email.
 * Says nothing about whether the address was already known (the caller shows the same answer every time).
 */
export async function requestSubscription(email: string, locale: Locale, source: string) {
  const payload = await getPayload({ config })
  const found = (await payload.find({ collection: 'subscribers', where: { email: { equals: email } }, limit: 1, depth: 0 })).docs[0]
  const now = Date.now()
  if (found?.status === 'confirmed') return true
  if (found?.status === 'pending') {
    // Asked again: a fresh confirm email, but never faster than every few minutes.
    if (found.confirmSentAt && now - Date.parse(found.confirmSentAt) < RESEND_MINUTES * 60_000) return true
    await payload.update({ collection: 'subscribers', id: found.id, data: { confirmSentAt: new Date(now).toISOString(), locale } })
    return sendConfirm(email, locale)
  }
  const data = { status: nextStatus(found?.status ?? null, 'subscribe')!, locale, confirmSentAt: new Date(now).toISOString(), unsubscribedAt: null, confirmedAt: null }
  try {
    if (found) await payload.update({ collection: 'subscribers', id: found.id, data })
    else await payload.create({ collection: 'subscribers', data: { email, ...data } })
  } catch (error) {
    // Two sign-ups at the same moment: the other one made the row, and sent the email.
    if ((await payload.count({ collection: 'subscribers', where: { email: { equals: email } } })).totalDocs) return true
    throw error
  }
  await payload.create({ collection: 'consents', data: { email, purpose: 'newsletter', noticeVersion: NOTICE_VERSION, source, grantedAt: new Date(now).toISOString() } })
  return sendConfirm(email, locale)
}

/** The link in the confirm email. Only a waiting address becomes confirmed (one atomic update), and a repeat click is fine. */
export async function confirmSubscription(token: unknown): Promise<'ok' | 'invalid'> {
  const email = verifyToken(token, 'confirm', secret(), Date.now())
  if (!email) return 'invalid'
  const payload = await getPayload({ config })
  const done = await payload.update({ collection: 'subscribers', where: { and: [{ email: { equals: email } }, { status: { equals: 'pending' } }] }, data: { status: 'confirmed', confirmedAt: new Date().toISOString() } })
  if (done.docs.length) return 'ok'
  const { totalDocs } = await payload.count({ collection: 'subscribers', where: { and: [{ email: { equals: email } }, { status: { equals: 'confirmed' } }] } })
  return totalDocs ? 'ok' : 'invalid'
}

/** Stops the emails to this address (and notes the withdrawal on its consent record). Quietly does nothing for an unknown address. */
export async function unsubscribeEmail(email: string) {
  const payload = await getPayload({ config })
  const now = new Date().toISOString()
  const done = await payload.update({ collection: 'subscribers', where: { and: [{ email: { equals: email } }, { status: { in: ['pending', 'confirmed'] } }] }, data: { status: 'unsubscribed', unsubscribedAt: now } })
  if (done.docs.length) await payload.update({ collection: 'consents', where: { and: [{ email: { equals: email } }, { purpose: { equals: 'newsletter' } }, { withdrawnAt: { exists: false } }] }, data: { withdrawnAt: now } })
}

/** The unsubscribe link in an email: true for a genuine, unexpired link. */
export async function unsubscribeByToken(token: unknown) {
  const email = verifyToken(token, 'unsubscribe', secret(), Date.now())
  if (!email) return false
  await unsubscribeEmail(email)
  return true
}

/**
 * /account Profile: emails the address its own one-click leave link. Only a subscribed address gets one (at most every
 * RESEND_MINUTES, tracked in confirmSentAt), and the caller shows the same answer either way, so nobody can unsubscribe
 * or probe someone else's address.
 */
export async function sendLeaveLink(email: string, locale: Locale) {
  const payload = await getPayload({ config })
  const found = (await payload.find({ collection: 'subscribers', where: { and: [{ email: { equals: email } }, { status: { in: ['pending', 'confirmed'] } }] }, limit: 1, depth: 0 })).docs[0]
  if (!found || (found.confirmSentAt && Date.now() - Date.parse(found.confirmSentAt) < RESEND_MINUTES * 60_000)) return
  await payload.update({ collection: 'subscribers', id: found.id, data: { confirmSentAt: new Date().toISOString() } })
  const m = words[locale].newsletter.email
  const unsubscribe = unsubscribeLink(email, locale)
  await sendEmail({ to: email, subject: m.leaveSubject, text: [m.hello, '', m.leaveBody, '', unsubscribe, '', m.ignore].join('\n'), headers: { 'List-Unsubscribe': `<${unsubscribe}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } })
}
