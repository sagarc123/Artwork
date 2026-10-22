import type { Metadata } from 'next'
import { DoorstepScene, StepList, Threshold } from '@/components/Art'
import { ButtonLink } from '@/components/ButtonLink'
import { EnquiryForm } from '@/components/EnquiryForm'
import { PageHero } from '@/components/PageHero'
import { PhotoPlaceholder, type Floor } from '@/components/PhotoPlaceholder'
import { alternates } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'

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

  return (
    <>
      <PageHero floor="charcoal" kicker={h.kicker} title={h.title} sub={h.sub} word="दारी" art={<DoorstepScene seed="events-hero" className="mx-auto max-w-sm" />}>
        <ButtonLink href="#enquire" variant="light">
          {h.cta}
        </ButtonLink>
      </PageHero>

      <Threshold />

      <section className="bg-paper py-16 lg:py-24">
        <div className="wrap grid gap-10">
          <h2 className="reveal font-heading text-h1">{e.typesTitle}</h2>
          <ul className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
            {e.types.map((type, i) => (
              <li key={type.name} className="reveal grid content-start gap-3">
                <PhotoPlaceholder ratio="4/5" seed={`event-type-${i}`} floor={TYPE_FLOORS[i]} alt={type.name} slot={`Event photo: ${type.name}`} />
                <h3 className="font-heading text-h3">{type.name}</h3>
                <p className="text-muted">{type.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Threshold />

      <section className="bg-paper grain py-16 lg:py-24">
        <div className="wrap grid gap-12 lg:grid-cols-12">
          <div className="grid content-start gap-6 lg:col-span-5">
            <h2 className="reveal font-heading text-h2">{e.stepsTitle}</h2>
            <StepList steps={h.steps} />
          </div>
          <div id="enquire" className="scroll-mt-32 lg:col-span-7">
            <div className="rounded-ui bg-surface p-6 shadow-frame lg:p-10">
              <h2 className="font-heading text-h2">{e.formTitle}</h2>
              <p className="mt-2 mb-8 text-muted">{e.formSub}</p>
              <EnquiryForm kind="event" locale={locale} t={t.forms} typeLabel={t.nav.events} />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
