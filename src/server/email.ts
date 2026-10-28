import 'server-only'

type Email = { to: string; subject: string; text: string; headers?: Record<string, string> }

/**
 * Sends one plain-text email through Resend. Without RESEND_API_KEY it is TEST MODE: the whole email, links included,
 * is written to the server log and nothing leaves the machine. Returns false if it could not be sent.
 */
export async function sendEmail({ to, subject, text, headers }: Email): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
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
    if (!res.ok) console.error('Email not sent', res.status, await res.text().catch(() => ''))
    return res.ok
  } catch (error) {
    console.error('Email not sent', error)
    return false
  }
}
