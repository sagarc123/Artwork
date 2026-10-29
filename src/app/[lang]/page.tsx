import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { BrushUnderline, DisplayWord, DoorstepScene, KolamWeave, PortraitPair, StepList, Threshold } from '@/components/Art'
import { ButtonLink } from '@/components/ButtonLink'
import { FestivalTiles } from '@/components/FestivalTiles'
import { GenerativeRangoli } from '@/components/GenerativeRangoli'
import { JsonLd, org } from '@/components/JsonLd'
import { InstagramStrip } from '@/components/InstagramStrip'
import { MakingOf } from '@/components/MakingOf'
import { MediaImage, photoSrc } from '@/components/MediaImage'
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder'
import { Signature } from '@/components/Signature'
import { CourseBand, EventTiles, HeroStage, HowItWorks, PortraitBand, TrustLine, WaButton } from '@/components/HomeWarm'
import { SoldBadge } from '@/components/SoldBadge'
import { RimBadge, thaliFor } from '@/components/Thali'
import { Testimonials } from '@/components/Testimonials'
import type { Media } from '@/payload-types'
import { alternates, localePath } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import type { Medium } from '@/lib/art'
import { fixedSeason } from '@/lib/festive'
import { eventFrom, fromText, portraitFrom } from '@/lib/prices'
import { formatPrice, site, whatsappLink } from '@/lib/site'
import { festivalLook, getCourses, getFestivals, getProducts, getServicePrices, getSiteExtras, getTestimonials, getTrust, toShopItem } from '@/server/content'
import { ViewTransition } from 'react'

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: alternates(await getLocale(), '/') }
}

const n = (i: number) => ({ '--n': i }) as CSSProperties

/** Phones: two equal buttons on the first screen; booking an event stays one tap below them (and in the tab bar). */
function PhoneCtas({ shop, courses, event, shopHref, coursesHref, eventHref }: { shop: string; courses: string | null; event: string; shopHref: string; coursesHref: string; eventHref: string }) {
  return (
    <div className="hero-in grid gap-1 sm:hidden" style={n(2)}>
      <div className="grid grid-cols-2 gap-3">
        <ButtonLink href={shopHref} className={courses ? '' : 'col-span-2'}>
          {shop}
        </ButtonLink>
        {courses && <ButtonLink href={coursesHref}>{courses}</ButtonLink>}
      </div>
      <Link href={eventHref} className="ink-link inline-flex min-h-11 items-center justify-self-start font-semibold text-peacock">
        {event}
      </Link>
    </div>
  )
}

export default async function HomePage() {
  const locale = await getLocale()
  const t = await getDictionary()
  const h = t.home
  const p = (path: string) => localePath(locale, path)
  const [products, festivalDocs, prices, testimonials, trust, courses, { instagram, siteLook, festiveLook, makingOf }] = await Promise.all([
    getProducts(locale),
    getFestivals(locale),
    getServicePrices(locale),
    getTestimonials(locale),
    getTrust(locale),
    site.coursesLive ? getCourses(locale) : Promise.resolve([]),
    getSiteExtras(locale),
  ])

  // Latest pieces, the ones marked "featured" first.
  const items = [...products].sort((a, b) => Number(!!b.featured) - Number(!!a.featured)).map((x) => toShopItem(x, locale))
  const featured = items.slice(0, 5)
  // Everyday hero: a real photo for each spot on the studio wall once one exists, else the drawn stand-in.
  const wall = (...media: Medium[]): { media: Media; alt: string } | null => {
    const x = items.find((i) => media.includes(i.medium) && photoSrc(i.image))
    return x?.image ? { media: x.image, alt: x.title } : null
  }
  // Both heroes are sent only when the look depends on the visitor's date ("auto"); CSS shows one.
  const season = fixedSeason(siteLook, festiveLook)
  const festivals = festivalDocs.map((f) => ({
    id: f.id,
    slug: f.slug,
    href: p(`/festivals/${f.slug}`),
    name: f.name,
    nextDate: f.nextDate ? f.nextDate.slice(0, 10) : null,
    order: f.order ?? 0,
    ...festivalLook(f.slug),
  }))
  const eventPrice = fromText(h.events.from, eventFrom(prices), formatPrice)
  const portraitPrice = fromText(h.portraits.from, portraitFrom(prices), formatPrice)

  return (
    <>
      <JsonLd data={{ '@graph': [org, { '@type': 'WebSite', name: site.brandName, url: new URL(localePath(locale, '/'), site.url).toString(), inLanguage: locale, potentialAction: { '@type': 'SearchAction', target: `${new URL(localePath(locale, '/search'), site.url)}?q={search_term_string}`, 'query-input': 'required name=search_term_string' } }] }} />
      <div className="home-flow">
      {/* 1 (everyday) · Warm Studio hero: headline and actions beside one big plate with a small portrait plate on a soft disc. Phones: the plate first. */}
      {season !== 'festive' && (
        <section className="look-everyday ws-hero" style={{ order: 1 }}>
          <div className="wrap">
            <div className="ws-hero-text">
              <h1 className="hero-title font-heading text-display">{h.studio.title}</h1>
              <p lang="mr" className="tagline">
                {h.studio.tagline}
              </p>
              <p className="hero-in max-w-[42ch] text-[1.1875rem]" style={n(1)}>
                {h.studio.sub}
              </p>
              <div className="hero-in ws-cta" style={n(2)}>
                <div className="ws-cta-main">
                  <WaButton href={whatsappLink(h.hero.waMsg)}>{h.hero.waCta}</WaButton>
                </div>
                <ButtonLink href={p('/custom-portraits')} variant="secondary">
                  {h.hero.ctaPortrait}
                </ButtonLink>
                <ButtonLink href={p('/shop')} variant="secondary">
                  {h.hero.ctaShop}
                </ButtonLink>
              </div>
              <TrustLine trust={trust} t={h.trust} />
            </div>
            <HeroStage
              rangoli={<MediaImage media={wall('rangoli')?.media ?? null} alt={wall('rangoli')?.alt ?? ''} ratio="1/1" seed="siddesh-home" medium="rangoli" floor="paper" sizes="(min-width: 1024px) 400px, 232px" priority />}
              portrait={<MediaImage media={wall('portrait', 'drawing')?.media ?? null} alt={wall('portrait', 'drawing')?.alt ?? ''} ratio="1/1" seed="siddesh-portrait" medium="portrait" floor="paper" sizes="200px" />}
            />
          </div>
        </section>
      )}

      {/* 1 (festive) · The doorstep: headline on paper, a rangoli drawing itself on the charcoal floor. */}
      {season !== 'everyday' && (
      <section className="look-festive relative overflow-hidden bg-paper grain" style={{ order: 1 }}>
        <div className="wrap grid gap-6 pt-6 lg:grid-cols-12 lg:items-center lg:gap-8 lg:pt-14">
          <div className="relative z-10 grid gap-5 pb-4 lg:col-span-5 lg:pb-24">
            {/* Phones get the rangoli tile instead of the big word. */}
            <div className="hidden lg:block">
              <DisplayWord className="hero-in -mb-8 text-kumkum">रंग</DisplayWord>
            </div>
            <div>
              <h1 className="hero-title font-heading text-display">{h.hero.title}</h1>
              <BrushUnderline className="brush--draw mt-3 w-2/3 max-w-xs" />
            </div>
            <p className="hero-in max-w-[42ch] text-muted" style={n(1)}>
              {h.hero.sub}
            </p>
            <PhoneCtas shop={t.nav.shop} courses={site.coursesLive ? t.nav.courses : null} event={h.hero.ctaEvent} shopHref={p('/shop')} coursesHref={p('/courses')} eventHref={p('/events')} />
              <div className="hero-in grid gap-3 max-sm:hidden sm:flex sm:flex-wrap sm:items-center sm:gap-x-7" style={n(2)}>
              <ButtonLink href={p('/events')}>{h.hero.ctaEvent}</ButtonLink>
              <Link href={p('/shop')} className="ink-link inline-flex min-h-11 items-center font-semibold text-peacock">
                {h.hero.ctaShop}
              </Link>
              {site.coursesLive && (
                  <Link href={p('/courses')} className="ink-link inline-flex min-h-11 items-center font-semibold text-peacock">
                    {h.hero.ctaLearn}
                  </Link>
              )}
            </div>
          </div>
          {/* Phone: a smaller tile above the headline so the first screen has art (the headline stays the LCP: inline SVG, no request). */}
          <div className="order-first lg:order-none lg:col-span-7 lg:-mt-14 lg:mr-[calc((min(100vw,77.5rem)_-_100vw)_/_2_-_1.25rem)] lg:self-stretch">
            <div className="relative mx-auto grid aspect-square w-[38vw] max-w-40 sm:w-[60vw] sm:max-w-80 place-items-center bg-charcoal shadow-frame grain-dark lg:aspect-auto lg:h-full lg:min-h-[620px] lg:w-auto lg:max-w-none lg:shadow-none">
              <GenerativeRangoli seed="siddesh-home" style="sanskar" tone="dark" animate className="w-[84%] max-w-[560px] -translate-y-[3%]" />
              {/* Finale: a diya lights at the foot of the rangoli, then he signs it. */}
              <span className="diya hero-diya absolute bottom-[5%] left-1/2 -translate-x-1/2 max-lg:scale-75 lg:bottom-[8%]" />
              <Signature draw="load" className="absolute right-[5%] bottom-[4%] text-paper/85" />
            </div>
          </div>
        </div>
      </section>
      )}

      <Threshold />

      {/* 2 · Event rangoli: three steps to your door. */}
      <section className="look-festive relative overflow-hidden bg-paper py-10 lg:py-28">
        <DisplayWord className="absolute top-4 -right-4 text-charcoal/[0.05]">दारी</DisplayWord>
        <div className="wrap relative grid gap-12 lg:grid-cols-12">
          <div className="grid content-start gap-6 lg:col-span-5">
            <p className="font-semibold text-accent">{h.events.kicker}</p>
            <h2 className="font-heading text-h1">{h.events.title}</h2>
            <p className="text-muted">{h.events.sub}</p>
            {eventPrice && <p className="text-h3-sm font-semibold">{eventPrice}</p>}
            <StepList steps={h.events.steps} />
            <ButtonLink href={p('/events')} variant="secondary" className="sm:justify-self-start">
              {h.events.cta}
            </ButtonLink>
          </div>
          <div className="grid grid-cols-3 items-start gap-3 max-lg:hidden sm:gap-5 lg:col-span-7">
            {h.events.scenes.map((label, i) => (
              <DoorstepScene key={label} seed={`doorstep-${i}`} style={(['phool', 'kolam', 'poster'] as const)[i]} label={label} className={['', 'lg:mt-14', 'lg:mt-28'][i]} />
            ))}
          </div>
        </div>
      </section>

      <Threshold />

      {/* 3 · Custom portraits: your photo → drawn by hand. Kumkum floor when festive, an ink-wash sheet on everyday days. */}
      <section className="look-festive floor floor-kumkum py-10 lg:py-28">
        <div className="wrap grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="grid gap-5 lg:col-span-5">
            <h2 className="font-heading text-h1">{h.portraits.title}</h2>
            <p className="text-on/90">{h.portraits.sub}</p>
            {portraitPrice && <p className="text-h3-sm font-semibold">{portraitPrice}</p>}
            <ButtonLink href={p('/custom-portraits')} variant="light" className="sm:justify-self-start">
              {h.portraits.cta}
            </ButtonLink>
          </div>
          <div className="scroll-draw px-2 max-lg:hidden lg:col-span-6 lg:col-start-7">
            <PortraitPair photoLabel={h.portraits.photo} drawingLabel={h.portraits.drawing} />
          </div>
        </div>
      </section>

      <Threshold />

      {/* How it works (everyday): a white band right under the hero. */}
      {season !== 'festive' && (
        <div className="look-everyday" style={{ order: 2 }}>
          <HowItWorks t={h.how} />
        </div>
      )}

      {/* 5 · New from the studio: framed, taped, different sizes. */}
      <section className="bg-paper grain py-10 lg:py-28" style={{ order: 3 }}>
        <div className="wrap grid gap-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-h1">{h.featured.title}</h2>
              <BrushUnderline className="brush--view mt-2 w-48" />
            </div>
            <Link href={p('/shop')} className="ink-link inline-flex min-h-11 items-center font-semibold text-peacock">
              {h.featured.seeAll}
            </Link>
          </div>
          {featured.length === 0 ? (
            <p className="rounded-ui bg-surface p-8 text-center text-muted">{h.featured.empty}</p>
          ) : (
            <ul className="grid grid-cols-2 gap-x-5 gap-y-6 lg:grid-cols-4 lg:gap-y-10 lg:gap-x-8">
              {featured.map((f, i) => (
                <li key={f.slug} className={[i === 0 && 'lg:col-span-2 lg:row-span-2', i === 4 && 'max-lg:hidden'].filter(Boolean).join(' ')}>
                  <Link href={f.href} className="card art-card grid gap-3">
                    <div className="tape relative bg-surface p-3 shadow-frame lg:p-4">
                      <ViewTransition name={`art-${f.slug}`} share="morph" default="none">
                      <MediaImage
                        media={f.image}
                        alt={f.title}
                        ratio={i === 0 ? '4/5' : '1/1'}
                        seed={f.seed}
                        medium={f.medium}
                        floor={f.floor}
                        sizes={i === 0 ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 1024px) 25vw, 50vw'}
                        className={f.sold ? 'opacity-70 grayscale-[.3]' : ''}
                      />
                      </ViewTransition>
                      {f.sold && <SoldBadge label={t.shop.sold} className="absolute top-5 left-5 lg:top-6 lg:left-6" />}
                      <RimBadge category={thaliFor(f.medium)} seed={f.seed} className="look-everyday" />
                    </div>
                    <span className="kind look-everyday">{t.shop.types[f.type]}</span>
                    <span className={`font-heading ${i === 0 ? 'text-h2' : 'text-h3'}`}>{f.title}</span>
                    {f.sold ? (
                      <s className="text-muted">{formatPrice(f.price)}</s>
                    ) : (
                      <span className="price-pill font-semibold">
                        {f.hasMorePrices && <span className="font-normal text-muted">{t.shop.from} </span>}
                        {formatPrice(f.price)}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <a
            href={whatsappLink(t.whatsapp.message)}
            target="_blank"
            rel="noopener noreferrer"
            className="look-festive ink-link inline-flex min-h-11 items-center justify-self-start font-semibold text-leaf"
          >
            {h.featured.ask}
          </a>
          <p className="look-everyday flex flex-wrap items-center gap-x-3">
            <span>{h.featured.askMore}</span>
            <a href={whatsappLink(t.whatsapp.message)} target="_blank" rel="noopener noreferrer" className="ink-link inline-flex min-h-11 items-center font-semibold text-leaf">
              {h.featured.ask}
            </a>
          </p>
        </div>
      </section>

      {/* Everyday: event tiles, the portrait band and the featured course follow the studio's new pieces. */}
      {season !== 'festive' && (
        <>
          <div className="look-everyday" style={{ order: 4 }}>
            <EventTiles t={h.events} price={eventPrice} />
          </div>
          <div className="look-everyday" style={{ order: 5 }}>
            <PortraitBand t={h.portraits} price={portraitPrice} locale={locale} />
          </div>
          {/* Phones skip the course band: the Courses tab leads there. */}
          {courses[0] && (
            <div className="look-everyday max-lg:hidden" style={{ order: 6 }}>
              <CourseBand course={courses[0]} t={h.course} c={t.courses} locale={locale} />
            </div>
          )}
        </>
      )}

      {/* 5b · Watch it being made: the time-lapse (or a drawn stand-in). Phones skip it to keep the page short. */}
      <div className="max-lg:hidden" style={{ order: 7 }}>
        <Threshold />
        <MakingOf t={t.makingOf} makingOf={makingOf} />
      </div>

      {/* Phones skip the artist section (About is one tap away in the menu) to keep the home page short. */}
      <Threshold className="max-lg:hidden" />

      {/* 6 · Meet the artist on the charcoal floor (the one dark gallery floor in both looks). */}
      <section className="floor floor-charcoal relative overflow-hidden py-20 max-lg:hidden lg:py-32" style={{ order: 8 }}>
        <DisplayWord className="absolute top-2 -left-6 text-paper/[0.07]">सिद्धेश</DisplayWord>
        <div className="wrap relative grid gap-14 lg:grid-cols-12 lg:items-center">
          <div className="relative mx-4 lg:col-span-5 lg:mx-0">
            <div className="tilt-left bg-paper p-3 shadow-frame">
              <PhotoPlaceholder ratio="4/5" seed="artist-portrait" medium="artist" note={t.photo.artist} alt={t.about.photoAlt} slot="Artist portrait 4:5" />
            </div>
          </div>
          <div className="grid gap-6 lg:col-span-6 lg:col-start-7">
            <h2 className="font-heading text-h1">{h.artist.title}</h2>
            <blockquote className="font-heading text-h3 text-on/95 lg:text-[1.875rem] lg:leading-snug">“{h.artist.body}”</blockquote>
            <Link href={p('/about')} className="ink-link inline-flex min-h-11 items-center justify-self-start font-semibold">
              {h.artist.cta}
            </Link>
          </div>
        </div>
      </section>

      {/* 7 · Course on a peacock floor: a kolam line weaves through the dots as you scroll. (phones: the hero Courses button covers it) */}
      {site.coursesLive && <Threshold className="max-lg:hidden" />}
      {site.coursesLive && (
      <section className="look-festive floor floor-peacock py-10 max-lg:hidden lg:py-28">
        <div className="wrap grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <KolamWeave className="scroll-draw mx-auto w-full max-w-sm max-lg:hidden" />
          </div>
          <div className="grid gap-5 lg:col-span-6 lg:col-start-7">
            <p className="font-semibold text-on/85">{h.course.kicker}</p>
            <h2 className="font-heading text-h1">{h.course.name}</h2>
            <p className="text-on/90">
              {h.course.title} · {h.course.meta}
            </p>
            <span className="justify-self-start rounded-full bg-turmeric px-4 py-1 font-semibold text-charcoal">{h.course.tag}</span>
            <ButtonLink href={p('/courses')} variant="light" className="sm:justify-self-start">
              {h.course.cta}
            </ButtonLink>
          </div>
        </div>
      </section>
      )}

      <Threshold />

      {/* 8 · Festival calendar: the next festival is the big tile, with a countdown. */}
      {festivals.length > 0 && (
        <section className="bg-paper py-10 lg:py-24" style={{ order: 9 }}>
          <div className="wrap grid gap-8">
            <h2 className="font-heading text-h1">{h.festivals.title}</h2>
            <FestivalTiles festivals={festivals} t={h.festivals} locale={locale} remind={{ t: t.remind, forms: { errors: t.forms.errors, required: t.forms.required } }} />
          </div>
        </section>
      )}

      <div style={{ order: 10 }}>
        <Testimonials items={testimonials} t={t.testimonials} />
      </div>

      <div className="max-lg:hidden" style={{ order: 11 }}>
        <InstagramStrip {...instagram} t={h.instagram} />
      </div>

      {/* 9 · A note for first-time online buyers. */}
      <section className="bg-paper pt-4 pb-20 lg:pb-28" style={{ order: 12 }}>
        <div className="wrap">
          <div className="lined-paper torn mx-auto max-w-3xl rotate-[0.5deg] py-12 pr-6 pl-14 shadow-frame sm:pr-12 lg:pl-20">
            <h2 className="font-heading text-h2">{h.help.title}</h2>
            <p className="mt-3 text-muted">{h.help.body}</p>
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
              <Link href={p('/help')} className="ink-link inline-flex min-h-11 items-center font-semibold text-peacock">
                {h.help.cta}
              </Link>
              <a
                href={whatsappLink(t.whatsapp.message)}
                target="_blank"
                rel="noopener noreferrer"
                className="ink-link inline-flex min-h-11 items-center font-semibold text-leaf"
              >
                {t.whatsapp.aria}
              </a>
            </div>
          </div>
        </div>
      </section>
      </div>
    </>
  )
}
