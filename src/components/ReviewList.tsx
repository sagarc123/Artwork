import type { Dictionary } from '@/i18n/dictionaries'
import type { ShownReview } from '@/server/content'
import { MediaImage } from './MediaImage'

type Props = {
  data: { count: number; average: number; items: ShownReview[] }
  kind: 'product' | 'course'
  locale: string
  t: Dictionary['reviews']
  className?: string
}

export const Stars = ({ n, label }: { n: number; label: string }) => (
  <span className="tracking-widest text-accent">
    <span className="sr-only">{label}</span>
    <span aria-hidden="true">
      {'★'.repeat(Math.round(n))}
      <span className="text-charcoal/25">{'★'.repeat(5 - Math.round(n))}</span>
    </span>
  </span>
)

/** Approved reviews of a product or a course: average, count and the newest cards. Nothing at all until there is one. */
export function ReviewList({ data, kind, locale, t, className = '' }: Props) {
  if (data.count === 0) return null
  const date = (iso: string) => new Intl.DateTimeFormat(`${locale}-IN`, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(iso))
  const avg = new Intl.NumberFormat(`${locale}-IN`, { minimumFractionDigits: 1 }).format(data.average)
  return (
    <section aria-labelledby={`reviews-${kind}`} className={`grid gap-6 ${className}`}>
      <div className="grid gap-1">
        <h2 id={`reviews-${kind}`} className="font-heading text-h2">
          {t.title}
        </h2>
        <p className="flex flex-wrap items-center gap-x-3">
          <Stars n={data.average} label={t.rating.replace('{n}', String(data.average))} />
          <span className="font-semibold">{t.average.replace('{avg}', avg)}</span>
          <span className="text-muted">{(data.count === 1 ? t.countOne : t.count).replace('{n}', new Intl.NumberFormat(`${locale}-IN`).format(data.count))}</span>
        </p>
      </div>
      <ul className="grid gap-4 md:grid-cols-2">
        {data.items.map((r) => (
          <li key={r.id}>
            <figure className="grid h-full content-start gap-3 rounded-ui bg-surface p-5 shadow-frame">
              <Stars n={r.rating} label={t.rating.replace('{n}', String(r.rating))} />
              <blockquote className="whitespace-pre-line [overflow-wrap:anywhere]">{r.text}</blockquote>
              {r.photo?.url && <MediaImage media={r.photo} alt={t.photoAlt.replace('{name}', r.name)} ratio="4/3" seed={`review-${r.id}`} sizes="(min-width: 768px) 40vw, 90vw" className="max-w-xs" />}
              <figcaption className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-semibold">{r.name}</span>
                <span className="rounded-full border border-leaf px-3 text-leaf">{kind === 'course' ? t.student : t.verified}</span>
                <span className="text-muted">{date(r.createdAt)}</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  )
}
