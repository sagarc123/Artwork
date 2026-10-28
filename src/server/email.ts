import 'server-only'
import { mayLogSecrets } from '@/lib/auth'

type Email = { to: string; subject: string; text: string; headers?: Record<string, string> }

/**
 * Sends one plain-text email through Resend. Without RESEND_API_KEY it is TEST MODE: the whole email, links included,
 * is written to the server log and nothing leaves the machine. Never in production: there, no key means no email.
 * Returns false if it could not be sent.
 */
export async function sendEmail({ to, subject, text, headers }: Email): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key && !mayLogSecrets(process.env.NODE_ENV)) {
    console.error('Email not sent: RESEND_API_KEY is not set (production never logs email bodies)')
    return false
  }
  if (!key) {
    console.log(`[email, test mode] to: ${to}\nsubject: ${subject}\n${text}\n[end email]`)
    return true
  }
  const from = process.env.EMAIL_FROM
  if (!from) {
    console.error('EMAIL_FROM is not set: cannot send email')
    return false
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to, subject, text, headers }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) console.error('Email not sent', res.status) // not the response body: it can repeat the addresses
    return res.ok
  } catch (error) {
    console.error('Email not sent', error)
    return false
  }
}
