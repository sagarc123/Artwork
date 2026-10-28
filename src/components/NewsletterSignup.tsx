'use client'

import { startTransition, useActionState, useEffect, useRef } from 'react'
import type { Dictionary } from '@/i18n/dictionaries'
import { subscribeNewsletter, type NewsletterField, type NewsletterState } from '@/server/newsletter-actions'

const ids = { email: 'nl-email', consent: 'nl-consent' } as const

/**
 * Footer sign-up (the footer's own colours: it flips between the dark and the light wall). Double opt-in: the box starts
 * unticked, and nothing is confirmed until the link in the email is tapped. The answer is the same for every address.
 */
export function NewsletterSignup({ locale, t }: { locale: string; t: Dictionary['newsletter'] }) {
  const [state, action, pending] = useActionState<NewsletterState, FormData>(subscribeNewsletter, { status: 'idle' })
  const formRef = useRef<HTMLFormElement>(null)
  const doneRef = useRef<HTMLDivElement>(null)
  const errors: NewsletterField[] = state.status === 'error' ? state.errors : []
  useEffect(() => {
    if (state.status === 'ok') doneRef.current?.focus()
    else if (state.status !== 'idle') formRef.current?.querySelector<HTMLElement>('[role="alert"]')?.focus()
  }, [state])

  if (state.status === 'ok') {
    return (
      <div ref={doneRef} tabIndex={-1} role="status" className="grid gap-2 rounded-ui border-2 border-paper/50 p-5 outline-none">
        <p className="font-heading text-h3-sm">{t.thanksTitle}</p>
        <p>{t.thanks}</p>
      </div>
    )
  }
  const describedBy = (f: NewsletterField) => (errors.includes(f) ? `${ids[f]}-error` : undefined)
  return (
    <form
      ref={formRef}
      noValidate
      // Sent by hand (not the form `action`), so React does not wipe what was typed when there is an error to fix.
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        startTransition(() => action(data))
      }}
      className="grid gap-4"
    >
      {(errors.length > 0 || state.status === 'rate' || state.status === 'failed') && (
        <div role="alert" tabIndex={-1} className="rounded-ui border-2 border-(--nl-flag) p-4 outline-none">
          <p className="font-semibold">{t.summary}</p>
          <ul className="mt-1 list-disc pl-6">
            {errors.length ? errors.map((f) => <li key={f}>{t.errors[f]}</li>) : <li>{t.errors[state.status === 'rate' ? 'rate' : 'failed']}</li>}
          </ul>
        </div>
      )}
      <input type="hidden" name="locale" value={locale} />
      {/* Honeypot: hidden from people, filled by bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="grid gap-2">
        <label htmlFor={ids.email} className="font-semibold">
          {t.emailLabel}
        </label>
        <input
          id={ids.email}
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          aria-invalid={errors.includes('email')}
          aria-describedby={describedBy('email')}
          className="h-12 w-full max-w-md rounded-ui border border-paper/60 bg-surface px-4 text-[#1e1b18] aria-invalid:border-2 aria-invalid:border-(--nl-flag) focus-visible:outline-paper"
        />
        {errors.includes('email') && (
          <p id={`${ids.email}-error`} className="font-semibold">
            {t.errors.email}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <label htmlFor={ids.consent} className="flex min-h-11 max-w-md items-start gap-3">
          <input id={ids.consent} name="consent" type="checkbox" value="yes" aria-invalid={errors.includes('consent')} aria-describedby={describedBy('consent')} className="mt-1 size-6 shrink-0 accent-marigold focus-visible:outline-paper" />
          <span>{t.consent}</span>
        </label>
        {errors.includes('consent') && (
          <p id={`${ids.consent}-error`} className="font-semibold">
            {t.errors.consent}
          </p>
        )}
      </div>
      <button type="submit" disabled={pending} className="press h-12 justify-self-start rounded-ui bg-paper px-6 font-semibold text-charcoal hover:bg-paper/90 focus-visible:outline-paper disabled:opacity-60">
        {pending ? t.sending : t.submit}
      </button>
    </form>
  )
}
