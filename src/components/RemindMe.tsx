'use client'

import { BellRing } from 'lucide-react'
import { addTransitionType, startTransition, useActionState, useEffect, useId, useRef, useState } from 'react'
import type { Dictionary } from '@/i18n/dictionaries'
import type { EnquiryField } from '@/lib/enquiry'
import { addDays, daysBetween, localToday, ORDER_LEAD_DAYS } from '@/lib/dates'
import { submitEnquiry, type EnquiryState } from '@/server/enquiry-action'
import { useHydrated } from './local-store'
import { ThankYouMark } from './ThankYou'

type Props = {
  festival: { id: number; name: string; nextDate: string | null }
  locale: string
  t: Dictionary['remind']
  forms: Pick<Dictionary['forms'], 'errors' | 'required'>
  /** On a coloured floor: paper outline button. */
  onDark?: boolean
}

const input = 'h-13 w-full rounded-ui border border-border bg-surface px-4 text-charcoal aria-invalid:border-2 aria-invalid:border-kumkum'

/**
 * "Remind me before Diwali": name + WhatsApp number, saved as a general enquiry linked to the festival.
 * Shown only while the reminder (a week before) is still ahead, from the visitor's own date.
 */
export function RemindMe({ festival, locale, t, forms, onDark = false }: Props) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<EnquiryState, FormData>(submitEnquiry, { status: 'idle' })
  const id = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const doneRef = useRef<HTMLDivElement>(null)
  const today = useHydrated() ? localToday() : null

  useEffect(() => {
    if (state.status === 'ok') doneRef.current?.focus()
    else if (state.status !== 'idle') formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [role="alert"]')?.focus()
  }, [state])

  const next = festival.nextDate?.slice(0, 10)
  if (!today || !next || daysBetween(today, next) <= ORDER_LEAD_DAYS) return null

  const fill = (s: string) => s.replaceAll('{name}', festival.name)
  const errors = state.status === 'error' ? state.errors : []
  const err = (f: EnquiryField) => (errors.includes(f) ? forms.errors[f] : undefined)
  const remindOn = new Intl.DateTimeFormat(`${locale}-IN`, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${addDays(next, -ORDER_LEAD_DAYS)}T00:00:00Z`))
  const button = onDark ? 'border-paper text-paper hover:bg-paper hover:text-charcoal' : 'border-charcoal text-charcoal hover:bg-charcoal hover:text-paper'

  return (
    <div className="grid gap-3 sm:contents">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen((o) => !o)}
        className={`press inline-flex min-h-12 items-center justify-center gap-2 rounded-ui border-[1.5px] px-5 font-semibold sm:justify-self-start ${button}`}
      >
        <BellRing aria-hidden="true" className="size-5 shrink-0" />
        {fill(t.button)}
      </button>
      <div id={`${id}-panel`} hidden={!open} className="w-full basis-full rounded-ui bg-surface p-5 text-charcoal shadow-frame sm:max-w-lg">
        {state.status === 'ok' ? (
          <div ref={doneRef} tabIndex={-1} role="status" className="grid gap-2">
            <p className="flex items-center gap-2 font-heading text-h3">
              <ThankYouMark className="size-10" />
              {t.doneTitle}
            </p>
            <p>{fill(t.doneBody).replace('{date}', remindOn)}</p>
          </div>
        ) : (
          <form
            ref={formRef}
            noValidate
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              const data = new FormData(e.currentTarget)
              startTransition(() => {
                addTransitionType('form')
                action(data)
              })
            }}
          >
            <p>{fill(t.intro)}</p>
            {(state.status === 'rate' || state.status === 'failed') && (
              <p role="alert" tabIndex={-1} className="font-semibold text-kumkum">
                {forms.errors[state.status]}
              </p>
            )}
            <input type="hidden" name="type" value="general" />
            <input type="hidden" name="reminder" value={festival.id} />
            <input type="hidden" name="locale" value={locale} />
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <div className="grid gap-2">
              <label htmlFor={`${id}-name`} className="font-semibold">
                {t.name} {forms.required}
              </label>
              <input id={`${id}-name`} name="name" autoComplete="name" required className={input} aria-invalid={!!err('name')} aria-describedby={err('name') ? `${id}-name-e` : undefined} />
              {err('name') && <p id={`${id}-name-e`} className="font-semibold text-kumkum">{err('name')}</p>}
            </div>
            <div className="grid gap-2">
              <label htmlFor={`${id}-phone`} className="font-semibold">
                {t.phone} {forms.required}
              </label>
              <div className="flex">
                <span className="grid h-13 place-items-center rounded-l-ui border border-r-0 border-border bg-placeholder px-3 font-semibold">+91</span>
                <input
                  id={`${id}-phone`}
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  required
                  className={`${input} rounded-l-none`}
                  aria-invalid={!!err('phone')}
                  aria-describedby={err('phone') ? `${id}-phone-e` : undefined}
                />
              </div>
              {err('phone') && <p id={`${id}-phone-e`} className="font-semibold text-kumkum">{err('phone')}</p>}
            </div>
            <div className="grid gap-1">
              <label className="flex min-h-12 items-center gap-3">
                <input type="checkbox" name="consent" value="yes" required className="size-6 shrink-0 accent-kumkum" aria-invalid={!!err('consent')} aria-describedby={err('consent') ? `${id}-consent-e` : undefined} />
                {t.consent}
              </label>
              {err('consent') && <p id={`${id}-consent-e`} className="font-semibold text-kumkum">{err('consent')}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <button type="submit" disabled={pending} className="press h-13 rounded-ui bg-charcoal px-6 font-semibold text-paper hover:bg-charcoal/90 disabled:opacity-60">
                {pending ? t.sending : t.submit}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="min-h-11 font-semibold text-peacock underline underline-offset-4">
                {t.cancel}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
