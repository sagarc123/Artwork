import 'server-only'
import { showTestCode } from '@/lib/auth'

/**
 * Sends the sign-in code by SMS (MSG91). Without MSG91_AUTH_KEY it is test mode: the code is written to the server log,
 * and handed back for the page to show only in development (never in production).
 */
export async function sendOtp(phone: string, code: string): Promise<{ ok: boolean; testCode?: string }> {
  const key = process.env.MSG91_AUTH_KEY
  if (!key) {
    console.log(`[sign-in code, test mode] +91${phone}: ${code}`)
    return { ok: true, testCode: showTestCode(process.env.NODE_ENV, false) ? code : undefined }
  }
  const template = process.env.MSG91_OTP_TEMPLATE_ID
  if (!template) {
    console.error('MSG91_OTP_TEMPLATE_ID is not set: cannot send the sign-in code')
    return { ok: false }
  }
  try {
    const url = new URL('https://control.msg91.com/api/v5/otp')
    url.search = new URLSearchParams({ template_id: template, mobile: `91${phone}`, otp: code, otp_expiry: '10' }).toString()
    const res = await fetch(url, { method: 'POST', headers: { authkey: key, 'content-type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(8000) })
    const body = (await res.json().catch(() => null)) as { type?: string } | null
    return { ok: res.ok && body?.type === 'success' }
  } catch (error) {
    console.error('SMS not sent', error)
    return { ok: false }
  }
}
