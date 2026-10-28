'use client'

import Link from 'next/link'
import { startTransition, useActionState, useEffect, useRef, useState } from 'react'
import type { Dictionary } from '@/i18n/dictionaries'
import { PHOTO_MAX_BYTES, TEXT_MAX, type ReviewCheck, type ReviewField } from '@/lib/reviews'
import { submitReview, type ReviewState } from '@/server/review-actions'

type Props = { kind: 'product' | 'course'; id: number; name: string; back: string; t: Dictionary['reviews']; blocked?: Exclude<ReviewCheck, 'ok'> }
const input = 'h-13 w-full rounded-ui border border-border bg-surface px-4 aria-invalid:border-2 aria-invalid:border-kumkum'

/** The review form: a star group, name, text and an optional photo. The server decides whether this customer may review. */
/** `blocked`: why this customer may not review (set by the page). It stays one component, so the thank-you survives the page refresh that follows a saved review. */
export function ReviewForm({ kind, id, name, back, t, blocked }: Props) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(submitReview, { status: 'idle' })
  const [rating, setRating] = useState(0)
  const [tooBig, setTooBig] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const doneRef = useRef<HTMLDivElement>(null)
  const errors: (ReviewField | 'name')[] = state.status === 'error' ? state.errors : tooBig ? ['photo'] : []
  useEffect(() => {
    if (state.status === 'ok') doneRef.current?.focus()
    else if (state.status !== 'idle') (formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]') ?? formRef.current?.querySelector<HTMLElement>('[role="alert"]'))?.focus()
  }, [state])

  const reason = state.status === 'blocked' ? state.reason : state.status === 'ok' ? null : (blocked ?? null)
  if (state.status === 'ok' || reason) {
    return (
      <div ref={doneRef} tabIndex={-1} role="status" className="grid justify-items-start gap-3 rounded-ui border-2 border-leaf bg-surface p-6 outline-none">
        <h2 className="font-heading text-h2">{reason ? t.reasons[reason] : t.thanksTitle}</h2>
        {!reason && <p>{t.thanksBody}</p>}
        <Link href={back} className="ink-link inline-flex min-h-12 items-center font-semibold text-peacock">
          {t.back}
        </Link>
      </div>
    )
  }
  const fail = state.status === 'rate' || state.status === 'failed' || state.status === 'login'
  const err = (f: ReviewField | 'name') => (errors.includes(f) ? t.errors[f] : undefined)
  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        startTransition(() => action(data))
      }}
      className="grid max-w-xl gap-6"
    >
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      {(errors.length > 0 || fail) && (
        <div role="alert" tabIndex={-1} className="rounded-ui border-2 border-kumkum bg-surface p-4 outline-none">
          <p className="font-semibold">{t.summary}</p>
          <ul className="mt-2 list-disc pl-6">{errors.length ? errors.map((e) => <li key={e}>{t.errors[e]}</li>) : <li>{t.errors[state.status === 'rate' ? 'rate' : 'failed']}</li>}</ul>
        </div>
      )}

      <fieldset className="grid gap-2" aria-describedby={err('rating') ? 'rv-rating-error' : undefined}>
        <legend className="mb-1 font-semibold">{t.ratingLegend}</legend>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-peacock grid size-12 cursor-pointer place-items-center rounded-ui border border-border text-2xl has-checked:border-charcoal has-checked:bg-charcoal has-checked:text-paper">
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="sr-only" aria-label={n === 1 ? t.starOne : t.stars.replace('{n}', String(n))} />
              <span aria-hidden="true">{n}★</span>
            </label>
          ))}
        </div>
        {err('rating') && (
          <p id="rv-rating-error" className="font-semibold text-kumkum">
            {err('rating')}
          </p>
        )}
      </fieldset>

      <div className="grid gap-2">
        <label htmlFor="rv-name" className="font-semibold">
          {t.nameLabel}
        </label>
        <p id="rv-name-hint" className="-mt-1 text-muted">
          {t.nameHint}
        </p>
        <input id="rv-name" name="name" defaultValue={name} autoComplete="name" maxLength={60} aria-invalid={!!err('name')} aria-describedby={`rv-name-hint${err('name') ? ' rv-name-error' : ''}`} className={input} />
        {err('name') && (
          <p id="rv-name-error" className="font-semibold text-kumkum">
            {err('name')}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <label htmlFor="rv-text" className="font-semibold">
          {t.textLabel}
        </label>
        <p id="rv-text-hint" className="-mt-1 text-muted">
          {t.textHint}
        </p>
        <textarea id="rv-text" name="text" rows={5} maxLength={TEXT_MAX} aria-invalid={!!err('text')} aria-describedby={`rv-text-hint${err('text') ? ' rv-text-error' : ''}`} className="w-full rounded-ui border border-border bg-surface p-4 aria-invalid:border-2 aria-invalid:border-kumkum" />
        {err('text') && (
          <p id="rv-text-error" className="font-semibold text-kumkum">
            {err('text')}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <label htmlFor="rv-photo" className="font-semibold">
          {t.photoLabel}
        </label>
        <p id="rv-photo-hint" className="-mt-1 text-muted">
          {t.photoHint}
        </p>
        <input
          id="rv-photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setTooBig((e.currentTarget.files?.[0]?.size ?? 0) > PHOTO_MAX_BYTES)}
          aria-invalid={!!err('photo')}
          aria-describedby={`rv-photo-hint${err('photo') ? ' rv-photo-error' : ''}`}
          className="min-h-12 w-full rounded-ui border border-border bg-surface p-3 file:mr-4 file:min-h-11 file:rounded-ui file:border-0 file:bg-placeholder file:px-4 file:font-semibold aria-invalid:border-2 aria-invalid:border-kumkum"
        />
        {err('photo') && (
          <p id="rv-photo-error" className="font-semibold text-kumkum">
            {err('photo')}
          </p>
        )}
      </div>

      <button type="submit" disabled={pending} className="press h-13 justify-self-start rounded-ui bg-kumkum px-6 font-semibold text-white hover:bg-kumkum/90 disabled:opacity-60">
        {pending ? t.sending : t.submit}
      </button>
    </form>
  )
}
