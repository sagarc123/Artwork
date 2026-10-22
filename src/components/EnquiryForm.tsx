'use client'

import { CheckCircle2, MessageCircle } from 'lucide-react'
import { startTransition, useActionState, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Dictionary } from '@/i18n/dictionaries'
import type { EnquiryField } from '@/lib/enquiry'
import { whatsappLink } from '@/lib/site'
import { submitEnquiry, type EnquiryState } from '@/server/enquiry-action'

type Labels = Dictionary['forms']
type Props = { kind: 'event' | 'portrait' | 'general'; locale: string; t: Labels; typeLabel: string }

const input =
  'h-13 w-full rounded-ui border border-border bg-surface px-4 text-charcoal aria-invalid:border-kumkum aria-invalid:border-2'
const chip =
  'inline-flex min-h-12 cursor-pointer items-center rounded-full border-[1.5px] border-charcoal px-4 has-checked:bg-charcoal has-checked:text-paper has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-peacock'

function Field({ id, label, hint, error, children }: { id: string; label: ReactNode; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="-mt-1 text-muted">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="font-semibold text-kumkum">
          {error}
        </p>
      )}
    </div>
  )
}

function Chips({ legend, name, type, options }: { legend: string; name: string; type: 'radio' | 'checkbox'; options: Record<string, string> }) {
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {Object.entries(options).map(([value, label]) => (
          <label key={value} className={chip}>
            <input type={type} name={name} value={value} className="sr-only" />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/** WhatsApp message summarising what the visitor just sent, in their language. */
function summarise(f: FormData, t: Labels, typeLabel: string) {
  const pick = (name: string, labels?: Record<string, string>) => {
    const values = f.getAll(name).filter((v): v is string => typeof v === 'string' && v.trim() !== '')
    return values.map((v) => labels?.[v] ?? v).join(', ')
  }
  const lines: [string, string][] = [
    [t.name, pick('name')],
    [t.email, pick('email')],
    [t.date, pick('eventDate')],
    [t.city, pick('city')],
    [t.venue, pick('venue', t.venues)],
    [t.size, pick('size', t.sizes)],
    [t.styles, pick('styles', t.styleOptions)],
    [t.medium, pick('medium', t.mediums)],
    [t.paperSize, pick('paperSize')],
    [t.faces, pick('faces')],
    [t.occasion, pick('occasion')],
    [t.message, pick('message')],
  ]
  return [`${t.waIntro} (${typeLabel})`, ...lines.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`)].join('\n')
}

/** Enquiry form: saves to the admin inbox, then hands over to WhatsApp with the details filled in. */
export function EnquiryForm({ kind, locale, t, typeLabel }: Props) {
  const [state, action, pending] = useActionState<EnquiryState, FormData>(submitEnquiry, { status: 'idle' })
  const [summary, setSummary] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const doneRef = useRef<HTMLDivElement>(null)
  // After sending, move focus to the result: the success box, or the first field to fix (else the error message).
  useEffect(() => {
    if (state.status === 'ok') doneRef.current?.focus()
    else if (state.status !== 'idle') {
      const form = formRef.current
      ;(form?.querySelector<HTMLElement>('[aria-invalid="true"]') ?? form?.querySelector<HTMLElement>('[role="alert"]'))?.focus()
    }
  }, [state])
  const errors = state.status === 'error' ? state.errors : []
  const err = (f: EnquiryField) => (errors.includes(f) ? t.errors[f] : undefined)
  const described = (id: string, f?: EnquiryField, hint?: boolean) =>
    [hint && `${id}-hint`, f && errors.includes(f) && `${id}-error`].filter(Boolean).join(' ') || undefined

  if (state.status === 'ok') {
    return (
      <div ref={doneRef} tabIndex={-1} role="status" className="grid justify-items-start gap-4 rounded-ui border-2 border-leaf bg-surface p-6 lg:p-8">
        <CheckCircle2 aria-hidden="true" className="size-10 text-leaf" />
        <h3 className="font-heading text-h2">{t.success.title}</h3>
        <p className="text-muted">{t.success.body}</p>
        <a
          href={whatsappLink(summary)}
          target="_blank"
          rel="noopener noreferrer"
          className="press inline-flex h-13 items-center gap-2 rounded-ui bg-leaf px-6 font-semibold text-white hover:bg-leaf/90"
        >
          <MessageCircle aria-hidden="true" className="size-6" />
          {t.success.whatsapp}
        </a>
      </div>
    )
  }

  return (
    <form
      ref={formRef}
      // Submitted by hand (not the form `action` prop) so React does not clear what the visitor typed when there is an error.
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        setSummary(summarise(data, t, typeLabel))
        startTransition(() => action(data))
      }}
      noValidate
      className="grid gap-6"
    >
      {errors.length > 0 && (
        <div role="alert" tabIndex={-1} className="rounded-ui border-2 border-kumkum bg-surface p-4">
          <p className="font-semibold">{t.errors.summary}</p>
          <ul className="mt-2 list-disc pl-6">
            {errors.map((e) => (
              <li key={e}>{t.errors[e]}</li>
            ))}
          </ul>
        </div>
      )}
      {(state.status === 'rate' || state.status === 'failed') && (
        <p role="alert" tabIndex={-1} className="rounded-ui border-2 border-kumkum bg-surface p-4 font-semibold">
          {t.errors[state.status]}
        </p>
      )}

      <input type="hidden" name="type" value={kind} />
      <input type="hidden" name="locale" value={locale} />
      {/* Honeypot: hidden from people, filled by bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {kind === 'event' ? (
        <>
          <Field id="eventDate" label={`${t.date} ${t.optional}`} error={err('date')}>
            <input id="eventDate" name="eventDate" type="date" className={input} aria-invalid={!!err('date')} aria-describedby={described('eventDate', 'date')} />
          </Field>
          <Field id="city" label={`${t.city} ${t.optional}`}>
            <input id="city" name="city" type="text" autoComplete="address-level2" className={input} />
          </Field>
          <Chips legend={t.venue} name="venue" type="radio" options={t.venues} />
          <Chips legend={t.size} name="size" type="radio" options={t.sizes} />
          <Chips legend={t.styles} name="styles" type="checkbox" options={t.styleOptions} />
        </>
      ) : kind === 'portrait' ? (
        <>
          <Chips legend={t.medium} name="medium" type="radio" options={t.mediums} />
          <Chips legend={t.paperSize} name="paperSize" type="radio" options={{ A4: 'A4', A3: 'A3', A2: 'A2' }} />
          <Field id="faces" label={t.faces}>
            <input id="faces" name="faces" type="number" inputMode="numeric" min={1} max={12} defaultValue={1} className={`${input} max-w-32`} />
          </Field>
          <Field id="occasion" label={`${t.occasion} ${t.optional}`}>
            <input id="occasion" name="occasion" type="text" className={input} />
          </Field>
          <Field id="eventDate" label={`${t.neededBy} ${t.optional}`} error={err('date')}>
            <input id="eventDate" name="eventDate" type="date" className={input} aria-invalid={!!err('date')} aria-describedby={described('eventDate', 'date')} />
          </Field>
          <label className="flex min-h-12 items-center gap-3">
            <input type="checkbox" name="framing" value="yes" className="size-6 accent-kumkum" />
            {t.framing}
          </label>
          <p className="rounded-ui bg-placeholder p-4">{t.photoNote}</p>
        </>
      ) : null}

      <Field id="name" label={`${t.name} ${t.required}`} error={err('name')}>
        <input id="name" name="name" type="text" autoComplete="name" required className={input} aria-invalid={!!err('name')} aria-describedby={described('name', 'name')} />
      </Field>
      <Field id="phone" label={`${t.phone} ${t.required}`} hint={t.phoneHint} error={err('phone')}>
        <div className="flex">
          <span className="grid h-13 place-items-center rounded-l-ui border border-r-0 border-border bg-placeholder px-3 font-semibold">+91</span>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            required
            className={`${input} rounded-l-none`}
            aria-invalid={!!err('phone')}
            aria-describedby={described('phone', 'phone', true)}
          />
        </div>
      </Field>
      {kind === 'general' && (
        <Field id="email" label={`${t.email} ${t.optional}`} error={err('email')}>
          <input id="email" name="email" type="email" autoComplete="email" className={input} aria-invalid={!!err('email')} aria-describedby={described('email', 'email')} />
        </Field>
      )}
      <Field id="message" label={`${kind === 'general' ? t.yourMessage : t.message} ${t.optional}`}>
        <textarea id="message" name="message" rows={4} className="w-full rounded-ui border border-border bg-surface p-4" />
      </Field>
      <label className="flex min-h-12 items-center gap-3">
        <input type="checkbox" name="offers" value="yes" className="size-6 accent-kumkum" />
        {t.offers}
      </label>

      <button type="submit" disabled={pending} className="press h-13 rounded-ui bg-kumkum px-6 font-semibold text-white hover:bg-kumkum/90 disabled:opacity-60 sm:justify-self-start">
        {pending ? t.sending : t.submit}
      </button>
    </form>
  )
}
