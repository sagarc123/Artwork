'use client'

import { toast, useConfig } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

type Option = { label: string; value: string }

/** Short form for an enquiry that came by phone: who, their number, what they want and when. */
export function CallForm({ types }: { types: Option[] }) {
  const { config } = useConfig()
  const router = useRouter()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const phone = String(f.get('phone') ?? '').replace(/\D/g, '').slice(-10)
    if (phone.length !== 10) return setError('Enter the 10-digit mobile number, e.g. 98765 43210.')
    setError('')
    setBusy(true)
    const date = String(f.get('date') ?? '')
    const res = await fetch(`${config.routes.api}/enquiries`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: String(f.get('name') ?? '').trim(),
        phone,
        type: f.get('type') || 'general',
        // You spoke to them already: it starts as "Replied", in the language you'll write to them in.
        status: 'replied',
        locale: f.get('locale') || 'mr',
        message: String(f.get('message') ?? '').trim() || undefined,
        ...(date ? { eventDate: `${date}T12:00:00+05:30` } : {}),
      }),
    }).catch(() => null)
    setBusy(false)
    const body = (await res?.json().catch(() => null)) as { doc?: { id: number }; errors?: { message?: string }[] } | null
    if (!res?.ok || !body?.doc) return setError(body?.errors?.[0]?.message ?? 'Could not save. Please check your internet and try again.')
    toast.success('Enquiry saved')
    router.push(`/admin/collections/enquiries/${body.doc.id}`)
  }

  return (
    <form className="call-form" onSubmit={(e) => void submit(e)}>
      <label>
        Their name
        <input name="name" required autoComplete="off" />
      </label>
      <label>
        Mobile number
        <input name="phone" type="tel" inputMode="tel" required autoComplete="off" placeholder="98765 43210" aria-describedby={error ? 'call-error' : undefined} aria-invalid={error ? true : undefined} />
      </label>
      <fieldset>
        <legend>What do they want?</legend>
        <div className="choice-buttons__row">
          {types.map((t, i) => (
            <label key={t.value} className="call-form__pick">
              <input type="radio" name="type" value={t.value} defaultChecked={i === 0} />
              <span>{t.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label>
        Date (event or needed by, optional)
        <input name="date" type="date" />
      </label>
      <label>
        Notes (optional)
        <textarea name="message" rows={3} placeholder="Place, size, price you said…" />
      </label>
      <fieldset>
        <legend>Write to them in</legend>
        <div className="choice-buttons__row">
          {[
            ['mr', 'मराठी'],
            ['en', 'English'],
            ['hi', 'हिंदी'],
          ].map(([v, l], i) => (
            <label key={v} className="call-form__pick">
              <input type="radio" name="locale" value={v} defaultChecked={i === 0} />
              <span lang={v}>{l}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {error && (
        <p id="call-error" className="call-form__error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="one-tap__btn is-primary" disabled={busy}>
        {busy ? 'Saving…' : 'Save enquiry'}
      </button>
    </form>
  )
}
