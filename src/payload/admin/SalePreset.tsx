'use client'

import { toast, useConfig } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useId, useState } from 'react'
import { istDay, presetDates, shortDay } from '../../lib/admin-tools'

type Sale = { enabled?: boolean | null; percent?: number | null; startsAt?: string | null; endsAt?: string | null; categories?: (number | { id: number })[] | null }
type Props = {
  /** Festival the sale is for ("Diwali"), used in the button. */
  name?: string
  today: string
  sale: Sale | null
  state: 'on' | 'planned' | 'off'
  categories: { id: number; name: string }[]
  /** Shop settings page: reload after saving so its form shows the new values. */
  reload?: boolean
}

const ids = (c: Sale['categories']) => (c ?? []).map((x) => (typeof x === 'object' ? x.id : x))

/**
 * "Start a festival sale" in one go: percent and days (editable), optional categories, a confirm step, then the
 * festival sale in Shop settings is filled in (from today, India time). Undo and "Turn sale off" put it back.
 */
export function SalePreset({ name, today, sale, state, categories, reload }: Props) {
  const { config } = useConfig()
  const router = useRouter()
  const uid = useId()
  const [percent, setPercent] = useState(10)
  const [days, setDays] = useState(7)
  const [only, setOnly] = useState<number[]>([])
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const before = { enabled: !!sale?.enabled, percent: sale?.percent ?? null, startsAt: sale?.startsAt ?? null, endsAt: sale?.endsAt ?? null, categories: ids(sale?.categories) }
  const plan = presetDates(today, days)
  const validPercent = Number.isInteger(percent) && percent >= 1 && percent <= 50
  const label = name ? `${name} sale` : 'festival sale'
  const where = only.length ? `${only.length === 1 ? '1 category' : `${only.length} categories`}` : 'the whole shop'

  const save = async (festivalSale: typeof before, message: string, undo?: typeof before) => {
    setBusy(true)
    const res = await fetch(`${config.routes.api}/globals/commerce-settings`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ festivalSale }),
    }).catch(() => null)
    setBusy(false)
    if (!res?.ok) {
      const body = (await res?.json().catch(() => null)) as { errors?: { message?: string }[] } | null
      toast.error(body?.errors?.[0]?.message ?? 'Could not save the sale. Please check your internet and try again.')
      return
    }
    setConfirming(false)
    if (reload) return window.location.reload()
    if (undo) toast.success(message, { duration: 8000, action: { label: 'Undo', onClick: () => void save(undo, 'Put back as it was') } })
    else toast.success(message)
    router.refresh()
  }

  const start = () =>
    save({ enabled: true, percent, startsAt: plan.startsAt, endsAt: plan.endsAt, categories: only }, `Sale started: ${percent}% off until ${shortDay(plan.last)}`, before)

  return (
    <div className="sale-preset">
      {state !== 'off' && sale && (
        <div className={`sale-preset__now is-${state}`}>
          <p>
            <strong>{state === 'on' ? 'Festival sale is on' : `Festival sale starts ${shortDay(istDay(sale.startsAt!))}`}:</strong> {sale.percent}% off
            {sale.endsAt ? ` until ${shortDay(istDay(sale.endsAt))}` : ' until you turn it off'}
            {ids(sale.categories).length ? ' (some categories)' : ''}.
          </p>
          <button type="button" className="one-tap__btn" disabled={busy} onClick={() => void save({ ...before, enabled: false }, 'Sale turned off', before)}>
            Turn sale off
          </button>
        </div>
      )}
      {!confirming ? (
        <div className="sale-preset__form">
          <div className="sale-preset__fields">
            <label htmlFor={`${uid}-p`}>
              Percent off
              <input id={`${uid}-p`} type="number" inputMode="numeric" min={1} max={50} step={1} value={percent} onChange={(e) => setPercent(Math.floor(Number(e.target.value)))} aria-describedby={`${uid}-ph`} />
            </label>
            <label htmlFor={`${uid}-d`}>
              For how many days
              <input id={`${uid}-d`} type="number" inputMode="numeric" min={1} max={60} step={1} value={days} onChange={(e) => setDays(Math.floor(Number(e.target.value)) || 1)} />
            </label>
          </div>
          <p id={`${uid}-ph`} className="sale-preset__hint">
            {validPercent ? `From today (${shortDay(plan.first)}) to ${shortDay(plan.last)}, on ${where}.` : 'Enter a whole number from 1 to 50.'}
          </p>
          {categories.length > 0 && (
            <details className="sale-preset__cats">
              <summary>Only some categories (optional)</summary>
              <fieldset>
                <legend className="sale-preset__hint">Leave all unticked for the whole shop.</legend>
                {categories.map((c) => (
                  <label key={c.id} className="sale-preset__cat">
                    <input type="checkbox" checked={only.includes(c.id)} onChange={(e) => setOnly((o) => (e.target.checked ? [...o, c.id] : o.filter((x) => x !== c.id)))} />
                    {c.name}
                  </label>
                ))}
              </fieldset>
            </details>
          )}
          <button type="button" className="one-tap__btn is-primary" disabled={busy || !validPercent} onClick={() => setConfirming(true)}>
            {state === 'off' ? `Start ${label}` : `Replace with ${label}`}
          </button>
        </div>
      ) : (
        <div className="sale-preset__confirm" role="group" aria-labelledby={`${uid}-q`}>
          <p id={`${uid}-q`}>
            <strong>
              Start {percent}% off {where}, from today ({shortDay(plan.first)}) to {shortDay(plan.last)}?
            </strong>{' '}
            Prices on the website change straight away, with the old price crossed out.
          </p>
          <div className="one-tap__links">
            <button type="button" className="one-tap__btn is-primary" disabled={busy} onClick={() => void start()} autoFocus>
              Yes, start the sale
            </button>
            <button type="button" className="one-tap__btn" disabled={busy} onClick={() => setConfirming(false)}>
              Not now
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
