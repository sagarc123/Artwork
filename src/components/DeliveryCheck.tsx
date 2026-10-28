'use client'

import { MapPin } from 'lucide-react'
import { useEffect, useId, useState, useTransition } from 'react'
import type { Dictionary } from '@/i18n/dictionaries'
import { deliveryWindow, PINCODE_STORE, type DeliveryEstimate } from '@/lib/delivery'
import { localToday } from '@/lib/dates'
import { isPincode } from '@/lib/pincode'
import { checkDelivery } from '@/server/delivery-action'

const day = (locale: string, ymd: string) =>
  new Intl.DateTimeFormat(`${locale}-IN`, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${ymd}T00:00:00Z`))

/** "Check delivery" on the product page: PIN code → delivery dates and cash on delivery. The PIN code is remembered for checkout. */
export function DeliveryCheck({ locale, t, codOk }: { locale: string; t: Dictionary['shop']['delivery']; codOk: boolean }) {
  const id = useId()
  const [pin, setPin] = useState('')
  const [result, setResult] = useState<DeliveryEstimate | 'invalid' | 'busy' | 'failed' | null>(null)
  const [checking, startChecking] = useTransition()

  // Prefill the PIN code checked before (here or on another piece).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PINCODE_STORE)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only value, read once after hydration
      if (saved && isPincode(saved)) setPin(saved)
    } catch {
      // Storage blocked: start empty.
    }
  }, [])

  function check() {
    const value = pin.trim()
    if (!isPincode(value)) return setResult('invalid')
    try {
      localStorage.setItem(PINCODE_STORE, value)
    } catch {
      // Not remembered; the check still works.
    }
    startChecking(async () => {
      setResult(await checkDelivery(value).catch(() => 'failed' as const))
    })
  }

  let message: string | null = null
  if (result === 'busy' || result === 'failed') message = t[result]
  else if (result && result !== 'invalid') {
    const [from, to] = deliveryWindow(localToday(), result)
    const dates = t.result.replace('{from}', day(locale, from)).replace('{to}', day(locale, to))
    message = codOk ? `${dates} · ${result.codHere ? t.cod : t.noCod}` : dates
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        check()
      }}
      className="grid gap-2"
    >
      <label htmlFor={`${id}-pin`} className="flex items-center gap-2 font-semibold">
        <MapPin aria-hidden="true" className="size-5 shrink-0 text-leaf" />
        {t.title}
      </label>
      <div className="flex max-w-sm gap-2">
        <input
          id={`${id}-pin`}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          autoComplete="postal-code"
          placeholder={t.placeholder}
          aria-invalid={result === 'invalid'}
          aria-describedby={`${id}-out`}
          className="h-12 w-full min-w-0 rounded-ui border border-border bg-surface px-4 tracking-widest text-charcoal placeholder:tracking-normal aria-invalid:border-2 aria-invalid:border-kumkum"
        />
        <button type="submit" disabled={checking} className="press h-12 shrink-0 rounded-ui border-[1.5px] border-charcoal px-5 font-semibold hover:bg-charcoal hover:text-paper disabled:opacity-60">
          {checking ? t.checking : t.button}
        </button>
      </div>
      <p id={`${id}-out`} role="status" className={result === 'invalid' ? 'font-semibold text-kumkum' : 'font-semibold'}>
        {result === 'invalid' ? t.invalid : message}
      </p>
    </form>
  )
}
