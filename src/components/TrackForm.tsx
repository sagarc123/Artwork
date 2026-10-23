'use client'

import { startTransition, useActionState } from 'react'
import type { Dictionary } from '@/i18n/dictionaries'
import { findOrder, type TrackState } from '@/server/track'

const input = 'h-13 w-full rounded-ui border border-border bg-surface px-4 aria-invalid:border-2 aria-invalid:border-kumkum'

/** Phone + order number; the server sends the buyer on to their order page. */
export function TrackForm({ locale, t, forms }: { locale: string; t: Dictionary['trackPage']; forms: Dictionary['forms'] }) {
  const [state, action, pending] = useActionState<TrackState, FormData>(findOrder, { status: 'idle' })
  const failed = state.status !== 'idle'
  return (
    <form
      // Sent by hand (not the form action prop) so a wrong number doesn't clear what was typed.
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        startTransition(() => action(data))
      }}
      className="grid gap-6"
    >
      <input type="hidden" name="locale" value={locale} />
      {failed && (
        <p role="alert" className="rounded-ui border-2 border-kumkum bg-surface p-4 font-semibold">
          {state.status === 'rate' ? t.rate : t.notFound}
        </p>
      )}
      <div className="grid gap-2">
        <label htmlFor="phone" className="font-semibold">
          {forms.phone}
        </label>
        <p id="phone-hint" className="-mt-1 text-muted">
          {forms.phoneHint}
        </p>
        <div className="flex">
          <span className="grid h-13 place-items-center rounded-l-ui border border-r-0 border-border bg-placeholder px-3 font-semibold">+91</span>
          <input id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" required aria-describedby="phone-hint" aria-invalid={failed} className={`${input} rounded-l-none`} />
        </div>
      </div>
      <div className="grid gap-2">
        <label htmlFor="orderNumber" className="font-semibold">
          {t.number}
        </label>
        <p id="orderNumber-hint" className="-mt-1 text-muted">
          {t.numberHint}
        </p>
        <input id="orderNumber" name="orderNumber" type="text" autoCapitalize="characters" spellCheck={false} required aria-describedby="orderNumber-hint" aria-invalid={failed} className={input} />
      </div>
      <button type="submit" disabled={pending} className="press h-13 rounded-ui bg-kumkum px-6 font-semibold text-white hover:bg-kumkum/90 disabled:opacity-60 sm:justify-self-start">
        {pending ? t.finding : t.button}
      </button>
    </form>
  )
}
