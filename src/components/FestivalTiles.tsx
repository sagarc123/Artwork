'use client'

import Link from 'next/link'
import type { Dictionary } from '@/i18n/dictionaries'
import { festivalCountdown, localToday, sortFestivals } from '@/lib/dates'
import { FestivalMotif } from './Art'
import { useHydrated } from './local-store'
import { RemindMe } from './RemindMe'

export type FestivalTile = { id: number; slug: string; href: string; name: string; nextDate: string | null; order: number; kind: Parameters<typeof FestivalMotif>[0]['kind']; floor: string }

/**
 * Festival calendar on the home page: the next festival is the big tile, with a countdown and the last day to order.
 * "Today" is the visitor's own date, so the order and countdown appear after hydration (the server HTML can't know it).
 */
export function FestivalTiles({ festivals, t, locale, remind }: { festivals: FestivalTile[]; t: Dictionary['home']['festivals']; locale: string; remind: Pick<Parameters<typeof RemindMe>[0], 't' | 'forms'> }) {
  const hydrated = useHydrated()
  const today = hydrated ? localToday() : null
  // Before hydration: by date (past ones too), which is right unless the owner left an old date in.
  const list = sortFestivals(festivals, today ?? '0000-00-00')
  const next = list[0]
  const countdown = today && next?.nextDate ? festivalCountdown(next.nextDate, today) : null
  const day = (ymd: string) => new Intl.DateTimeFormat(`${locale}-IN`, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${ymd}T00:00:00Z`))

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {list.map((f, i) => (
        <li key={f.slug} className={i === 0 ? 'grid content-start gap-3 sm:col-span-2' : ''}>
          <Link
            href={f.href}
            className={`card group relative flex h-full min-h-40 flex-col justify-between gap-6 overflow-hidden rounded-ui p-5 text-paper grain-dark ${f.floor} ${i === 0 ? 'lg:min-h-72' : ''}`}
          >
            {i === 0 ? <span className="relative z-10 self-start rounded-full bg-turmeric px-3 font-semibold text-charcoal">{t.next}</span> : <span />}
            <FestivalMotif
              kind={f.kind}
              live="scroll"
              className={`absolute -right-3 -bottom-3 opacity-90 transition-transform duration-500 group-hover:scale-105 ${i === 0 ? 'w-32 sm:w-44 lg:w-52' : 'w-28'}`}
            />
            {/* Scrim so the countdown stays readable where it runs over the art. */}
            {i === 0 && <span aria-hidden="true" className="absolute inset-0 bg-linear-to-tr from-charcoal/70 via-charcoal/20 to-transparent" />}
            {/* The big tile keeps its text clear of the art on the right. */}
            <span className={`relative z-10 grid gap-2 ${i === 0 ? 'pr-24 sm:pr-36 lg:pr-44' : ''}`}>
              <span className={`font-heading ${i === 0 ? 'text-h1' : 'text-h3'}`}>{f.name}</span>
              {i === 0 && countdown && (
                <span className="grid max-w-[34ch] gap-1 font-semibold">
                  <span>
                    {(countdown.days === 0 ? t.today : countdown.days === 1 ? t.tomorrow : t.countdown).replace('{days}', new Intl.NumberFormat(`${locale}-IN`).format(countdown.days)).replace('{name}', f.name)}
                    {countdown.orderBy && ` · ${t.orderBy.replace('{date}', day(countdown.orderBy))}`}
                  </span>
                  {countdown.bookBy && <span className="font-normal text-paper/90">{t.bookBy.replace('{date}', day(countdown.bookBy))}</span>}
                </span>
              )}
            </span>
          </Link>
          {i === 0 && <RemindMe festival={f} locale={locale} {...remind} />}
        </li>
      ))}
    </ul>
  )
}
