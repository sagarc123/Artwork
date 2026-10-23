import type { Metadata } from 'next'
import Link from 'next/link'
import { DoorstepScene, StepList, Threshold } from '@/components/Art'
import { ButtonLink } from '@/components/ButtonLink'
import { EnquiryForm } from '@/components/EnquiryForm'
import { PageHero } from '@/components/PageHero'
import { PhotoPlaceholder, type Floor } from '@/components/PhotoPlaceholder'
import { Testimonials } from '@/components/Testimonials'
import { alternates, localePath } from '@/i18n/config'
import { STYLES } from '@/lib/art'
import { EVENT_SIZES, eventSizeHints } from '@/lib/prices'
import { formatPrice } from '@/lib/site'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { getServicePrices, getTestimonials } from '@/server/content'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.eventsPage.metaTitle, description: t.eventsPage.metaDesc, alternates: alternates(await getLocale(), '/events') }
}

const TYPE_FLOORS: Floor[] = ['kumkum', 'peacock', 'leaf', 'charcoal', 'peacock']

export default async function EventsPage() {
  const locale = await getLocale()
  const t = await getDictionary()
  const e = t.eventsPage
  const h = t.home.events
  const [prices, testimonials] = await Promise.all([getServicePrices(locale), getTestimonials(locale)])
  const from = (n: number) => e.prices.from.replace('{price}', formatPrice(n))
  const bands = EVENT_SIZES.flatMap((s) => (prices.events?.[s] ? [{ size: s, price: prices.events[s] }] : []))

  return (
    <>
      <PageHero floor="charcoal" kicker={h.kicker} title={h.title} sub={h.sub} word="दारी" art={<DoorstepScene seed="events-hero" style="phool" className="mx-auto max-w-sm" />}>
        <ButtonLink href="#enquire" variant="light">
          {h.cta}
        </ButtonLink>
        <Link href={localePath(locale, '/custom-portraits')} className="ink-link inline-flex min-h-11 items-center font-semibold">
          {e.portraitLink} →
        </Link>
      </PageHero>

      <Threshold />

      <section className="bg-paper py-16 lg:py-24">
        <div className="wrap grid gap-10">
          <h2 className="font-heading text-h1">{e.typesTitle}</h2>
          <ul className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
            {e.types.map((type, i) => (
              <li key={type.name} className="grid content-start gap-3">
                <PhotoPlaceholder ratio="4/5" seed={`event-type-${i}`} style={STYLES[i % STYLES.length]} floor={TYPE_FLOORS[i]} alt={type.name} slot={`Event photo: ${type.name}`} />
                <h3 className="font-heading text-h3">{type.name}</h3>
                <p className="text-muted">{type.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Testimonials items={testimonials} t={t.testimonials} className="bg-paper grain" />

      <Threshold />

      <section className="bg-paper grain py-16 lg:py-24">
        <div className="wrap grid gap-12 lg:grid-cols-12">
          <div className="grid content-start gap-6 lg:col-span-5">
            <h2 className="font-heading text-h2">{e.stepsTitle}</h2>
            <StepList steps={h.steps} />
            {bands.length > 0 && (
              <div className="grid gap-3 rounded-ui border-2 border-charcoal/15 bg-surface p-5">
                <h3 className="font-heading text-h3">{e.prices.title}</h3>
                <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
                  {bands.map((b) => (
                    <div key={b.size} className="contents">
                      <dt>{t.forms.sizes[b.size]}</dt>
                      <dd className="font-semibold">{from(b.price)}</dd>
                    </div>
                  ))}
                </dl>
                <p className="text-muted">{e.prices.note}</p>
                {prices.events?.travelNote && <p className="text-muted">{prices.events.travelNote}</p>}
              </div>
            )}
          </div>
          <div id="enquire" className="scroll-mt-32 lg:col-span-7">
            <div className="rounded-ui bg-surface p-6 shadow-frame lg:p-10">
              <h2 className="font-heading text-h2">{e.formTitle}</h2>
              <p className="mt-2 mb-8 text-muted">{e.formSub}</p>
              <EnquiryForm kind="event" locale={locale} t={t.forms} typeLabel={t.nav.events} hints={{ size: eventSizeHints(prices, from) }} />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
