'use server'

// Newsletter actions. Every export is a public endpoint: each checks its own input and is rate limited.
import { isLocale } from '@/i18n/config'
import { cleanEmail } from '@/lib/newsletter'
import { getCustomer } from './customer'
import { confirmSubscription, requestSubscription, sendLeaveLink } from './newsletter'
import { allow } from './rate-limit'

export type NewsletterField = 'email' | 'consent'
export type NewsletterState = { status: 'idle' | 'ok' | 'rate' | 'failed' } | { status: 'error'; errors: NewsletterField[] }

/** The footer form. The answer is the same whether or not the address was already known. */
export async function subscribeNewsletter(_prev: NewsletterState, form: FormData): Promise<NewsletterState> {
  if (form.get('website')) return { status: 'ok' } // honeypot: bots get a fake success
  const email = cleanEmail(form.get('email'))
  const errors: NewsletterField[] = [...(email ? [] : ['email' as const]), ...(form.get('consent') === 'yes' ? [] : ['consent' as const])]
  if (!email || errors.length) return { status: 'error', errors }
  if (!(await allow('newsletter', 5, 60 * 60_000))) return { status: 'rate' }
  const locale = String(form.get('locale'))
  try {
    return (await requestSubscription(email, isLocale(locale) ? locale : 'en', 'footer')) ? { status: 'ok' } : { status: 'failed' }
  } catch (error) {
    console.error('Newsletter sign-up failed', error)
    return { status: 'failed' }
  }
}

/** The button on the confirm page (a click is needed, so a link-checking robot cannot confirm for someone). */
export async function confirmNewsletter(token: string) {
  if (!(await allow('newsletter-confirm', 20, 10 * 60_000))) return 'rate' as const
  return confirmSubscription(token)
}

/** /account Profile: sends the typed address its own leave link. Signed-in only; the answer never says whether it was subscribed. */
export async function stopNewsletter(emailRaw: string, locale: string) {
  if (!(await getCustomer())) return 'login' as const
  const email = cleanEmail(emailRaw)
  if (!email) return 'invalid' as const
  if (!(await allow('newsletter-stop', 10, 60 * 60_000))) return 'rate' as const
  try {
    await sendLeaveLink(email, isLocale(locale) ? locale : 'en')
  } catch (error) {
    console.error('Leave link failed', error)
  }
  return 'ok' as const
}
