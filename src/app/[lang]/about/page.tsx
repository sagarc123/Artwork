import type { Metadata } from 'next'
import Link from 'next/link'
import { DisplayWord, Threshold } from '@/components/Art'
import { ButtonLink } from '@/components/ButtonLink'
import { GenerativeRangoli } from '@/components/GenerativeRangoli'
import { JsonLd, artist } from '@/components/JsonLd'
import { MakingOf } from '@/components/MakingOf'
import { DevNote } from '@/components/OwnerText'
import { PageHero } from '@/components/PageHero'
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder'
import { alternates, localePath } from '@/i18n/config'
import { STYLES } from '@/lib/art'
import { site } from '@/lib/site'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { getSiteExtras } from '@/server/content'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.about.metaTitle, description: t.about.metaDesc, alternates: alternates(await getLocale(), '/about') }
}

// Same order as `about.make` in the message files.
const MAKE_LINKS = ['/shop', '/events', '/custom-portraits', '/courses']
// The courses card waits for the courses pages (site.coursesLive).

export default async function AboutPage() {
  const locale = await getLocale()
  const t = await getDictionary()
  const a = t.about
  const { makingOf } = await getSiteExtras(locale)

  return (
    <>
      <JsonLd data={artist} />
      <PageHero
        kicker={a.kicker}
        title={a.title}
        sub={a.sub}
        word="कला"
        art={
          <div className="tilt-right mx-auto w-full max-w-md bg-surface p-3 shadow-frame lg:p-4">
            <PhotoPlaceholder ratio="4/5" seed="about-portrait" medium="artist" note={t.photo.artist} alt={a.photoAlt} slot="POR · Artist portrait 4:5 (About hero)" />
          </div>
        }
      />

      <Threshold />

      <section className="bg-paper py-16 lg:py-24">
        <div className="wrap grid gap-12 lg:grid-cols-12">
          <div className="grid content-start gap-8 lg:col-span-7">
            <DevNote>{t.ownerNote}</DevNote>
            <h2 className="font-heading text-h1">{a.storyTitle}</h2>
            {a.story.map((s) => (
              <div key={s.h} className="grid max-w-[640px] gap-3">
                <h3 className="font-heading text-h3">{s.h}</h3>
                <p>{s.p}</p>
              </div>
            ))}
          </div>
          <div className="lg:col-span-5">
            <div className="tilt-left bg-surface p-2 shadow-frame lg:sticky lg:top-32 lg:p-3">
              <PhotoPlaceholder ratio="1/1" seed="about-process" medium="artist" note={t.photo.studio} alt="" slot="PRC · Artist working 1:1 (About story)" />
            </div>
          </div>
        </div>
      </section>

      <MakingOf t={t.makingOf} makingOf={makingOf} />

      <section className="relative overflow-hidden bg-charcoal py-16 text-paper grain-dark lg:py-24">
        <DisplayWord className="absolute top-2 -right-4 text-paper/[0.06]">प्रवास</DisplayWord>
        <div className="wrap relative grid gap-10">
          <h2 className="font-heading text-h1">{a.journeyTitle}</h2>
          <ol className="grid gap-8 border-l-2 border-marigold/70 pl-6 lg:grid-cols-4 lg:gap-6 lg:border-t-2 lg:border-l-0 lg:pt-8 lg:pl-0">
            {a.journey.map((j) => (
              <li key={j.year} className="relative grid content-start gap-2">
                <span aria-hidden="true" className="absolute top-2 -left-[33px] size-4 rounded-full bg-marigold lg:-top-[41px] lg:left-0" />
                <p className="font-heading text-h2">{j.year}</p>
                <h3 className="text-h3-sm font-semibold">{j.title}</h3>
                <p className="text-paper/85">{j.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-paper grain py-16 lg:py-24">
        <div className="wrap grid gap-10">
          <h2 className="font-heading text-h1">{a.makeTitle}</h2>
          <ul className={`grid gap-6 sm:grid-cols-2 ${site.coursesLive ? 'xl:grid-cols-4' : 'lg:grid-cols-3'}`}>
            {a.make.map((m, i) => (MAKE_LINKS[i] === '/courses' && !site.coursesLive ? null : (
              <li key={m.title} className="grid content-start gap-3 rounded-ui bg-surface p-6 shadow-frame">
                <GenerativeRangoli seed={`about-make-${i}`} style={STYLES[i % STYLES.length]} className="size-16" />
                <h3 className="font-heading text-h3">{m.title}</h3>
                <p className="text-muted">{m.text}</p>
                <Link href={localePath(locale, MAKE_LINKS[i])} className="ink-link inline-flex min-h-11 items-center font-semibold text-peacock">
                  {m.link} →
                </Link>
              </li>
            )))}
          </ul>
        </div>
      </section>

      <Threshold />

      <section className="bg-paper py-16 lg:py-24">
        <div className="wrap grid justify-items-center gap-8 text-center">
          <figure className="grid max-w-3xl gap-4">
            <blockquote className="font-heading text-h1">“{a.quote}”</blockquote>
            <figcaption className="text-muted">— {a.quoteBy}</figcaption>
          </figure>
          <div className="grid max-w-xl justify-items-center gap-4">
            <h2 className="font-heading text-h2">{a.ctaTitle}</h2>
            <p className="text-muted">{a.ctaBody}</p>
            <ButtonLink href={localePath(locale, '/contact')} className="w-full sm:w-auto">
              {a.cta}
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  )
}
