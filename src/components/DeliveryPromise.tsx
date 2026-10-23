'use client'

import { PackageCheck, Wallet } from 'lucide-react'
import { deliveryRange, localToday } from '@/lib/dates'
import { useHydrated } from './local-store'

const fmt = (locale: string, ymd: string) => new Intl.DateTimeFormat(`${locale}-IN`, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${ymd}T00:00:00Z`))

/** "Delivered by 28 Oct – 31 Oct" from the visitor's own today (so it appears after hydration), plus the COD line. */
export function DeliveryPromise({ locale, deliveredBy, cod }: { locale: string; deliveredBy: string; cod?: string | null }) {
  const today = useHydrated() ? localToday() : null
  const [from, to] = today ? deliveryRange(today) : ['', '']
  return (
    <ul className="grid gap-1">
      <li className="flex min-h-7 items-center gap-2 font-semibold">
        <PackageCheck aria-hidden="true" className="size-5 shrink-0 text-leaf" />
        {today && deliveredBy.replace('{from}', fmt(locale, from)).replace('{to}', fmt(locale, to))}
      </li>
      {cod && (
        <li className="flex items-center gap-2">
          <Wallet aria-hidden="true" className="size-5 shrink-0 text-leaf" />
          {cod}
        </li>
      )}
    </ul>
  )
}
