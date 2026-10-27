import type { Testimonial } from '@/payload-types'
import { BrushUnderline } from './Art'
import { MediaImage } from './MediaImage'

type Labels = { title: string; rating: string }

const COLS = ['', 'mx-auto w-full max-w-2xl', 'md:grid-cols-2', 'lg:grid-cols-3']

/** Quote cards from happy customers (only ones who agreed to be shown). Nothing at all when there are none. */
export function Testimonials({ items, t, className = 'bg-paper' }: { items: Testimonial[]; t: Labels; className?: string }) {
  if (items.length === 0) return null
  return (
    <section className={`py-16 lg:py-24 ${className}`}>
      <div className="wrap grid gap-10">
        <div>
          <h2 className="font-heading text-h1">{t.title}</h2>
          <BrushUnderline className="brush--view mt-2 w-48" />
        </div>
        {/* Columns follow the count, so one or two quotes never leave an empty slot. */}
        <ul className={`grid gap-6 ${COLS[Math.min(items.length, 3)]}`}>
          {items.map((q) => {
            const rating = Math.min(5, Math.max(1, Math.round(q.rating ?? 5)))
            return (
              <li key={q.id}>
                <figure className="grid h-full content-start gap-4 rounded-ui bg-surface p-6 shadow-frame">
                  <p className="text-h3-sm tracking-widest text-accent">
                    <span className="sr-only">{t.rating.replace('{n}', String(rating))}</span>
                    <span aria-hidden="true">
                      {'★'.repeat(rating)}
                      <span className="text-charcoal/25">{'★'.repeat(5 - rating)}</span>
                    </span>
                  </p>
                  <blockquote className="font-heading text-h3-sm leading-relaxed">“{q.quote}”</blockquote>
                  <figcaption className="mt-auto flex items-center gap-3">
                    {q.photo && typeof q.photo === 'object' && (
                      <MediaImage media={q.photo} alt="" ratio="1/1" seed={`testimonial-${q.id}`} sizes="56px" className="size-14 shrink-0 rounded-full" />
                    )}
                    <span className="grid">
                      <span className="font-semibold">{q.name}</span>
                      {q.context && <span className="text-muted">{q.context}</span>}
                    </span>
                  </figcaption>
                </figure>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
