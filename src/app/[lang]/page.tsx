import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { BrushUnderline, DisplayWord, DoorstepScene, KolamWeave, PortraitPair, PowderHeap, StepList, Threshold } from '@/components/Art'
import { ButtonLink } from '@/components/ButtonLink'
import { FestivalTiles } from '@/components/FestivalTiles'
import { GenerativeRangoli } from '@/components/GenerativeRangoli'
import { MediaImage } from '@/components/MediaImage'
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder'
import { Signature } from '@/components/Signature'
import { Testimonials } from '@/components/Testimonials'
import { alternates, localePath } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { eventFrom, fromText, portraitFrom } from '@/lib/prices'
import { formatPrice, site, whatsappLink } from '@/lib/site'
import { festivalLook, getCategories, getFestivals, getProducts, getServicePrices, getTestimonials, toShopItem } from '@/server/content'

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: alternates(await getLocale(), '/') }
}

const n = (i: number) => ({ '--n': i }) as CSSProperties

export default async function HomePage() {
  const locale = await getLocale()
  const t = await getDictionary()
  const h = t.home
  const p = (path: string) => localePath(locale, path)
  const [products, categories, festivalDocs, prices, testimonials] = await Promise.all([
    getProducts(locale),
    getCategories(locale, 'shop'),
    getFestivals(locale),
    getServicePrices(locale),
    getTestimonials(locale),
  ])

  // Each heap opens its own shop category (matched by slug, which doesn't change with the language).
  const shopFor = (word: string) => {
    const c = categories.find((x) => x.slug.includes(word))
    return p(c ? `/shop/${c.slug}` : '/shop')
  }
  const heaps = [
    { href: shopFor('drawing'), label: h.categories.drawings, color: '#ece4d6' },
    { href: shopFor('painting'), label: h.categories.paintings, color: 'var(--color-marigold)' },
    { href: shopFor('rangoli'), label: h.categories.rangoli, color: '#d0473b' },
    { href: p('/custom-portraits'), label: h.categories.portraits, color: 'var(--color-turmeric)' },
    ...(site.coursesLive ? [{ href: p('/courses'), label: h.categories.courses, color: '#5aa16a' }] : []),
  ]
  // Latest pieces, the ones marked "featured" first.
  const featured = [...products]
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured))
    .slice(0, 5)
    .map((x) => toShopItem(x, locale))
  const festivals = festivalDocs.map((f) => ({
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
      {/* 1 · The doorstep: headline on paper, a rangoli drawing itself on the charcoal floor. */}
      <section className="relative overflow-hidden bg-paper grain">
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
            <div className="hero-in grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-x-7" style={n(2)}>
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
            <div className="relative mx-auto grid aspect-square w-[60vw] max-w-80 place-items-center bg-charcoal shadow-frame grain-dark lg:aspect-auto lg:h-full lg:min-h-[620px] lg:w-auto lg:max-w-none lg:shadow-none">
              <GenerativeRangoli seed="siddesh-home" style="sanskar" tone="dark" animate className="w-[84%] max-w-[560px] -translate-y-[3%]" />
              {/* Finale: a diya lights at the foot of the rangoli, then he signs it. */}
              <span className="diya hero-diya absolute bottom-[5%] left-1/2 -translate-x-1/2 max-lg:scale-75 lg:bottom-[8%]" />
              <Signature draw="load" className="absolute right-[5%] bottom-[4%] text-paper/85" />
            </div>
          </div>
        </div>
      </section>

      <Threshold />

      {/* 2 · Event rangoli: three steps to your door. */}
      <section className="relative overflow-hidden bg-paper py-16 lg:py-28">
        <DisplayWord className="absolute top-4 -right-4 text-charcoal/[0.05]">दारी</DisplayWord>
        <div className="wrap relative grid gap-12 lg:grid-cols-12">
          <div className="grid content-start gap-6 lg:col-span-5">
            <p className="font-semibold text-kumkum">{h.events.kicker}</p>
            <h2 className="font-heading text-h1">{h.events.title}</h2>
            <p className="text-muted">{h.events.sub}</p>
            {eventPrice && <p className="text-h3-sm font-semibold">{eventPrice}</p>}
            <StepList steps={h.events.steps} />
            <ButtonLink href={p('/events')} variant="secondary" className="sm:justify-self-start">
              {h.events.cta}
            </ButtonLink>
          </div>
          <div className="grid grid-cols-3 items-start gap-3 sm:gap-5 lg:col-span-7">
            {h.events.scenes.map((label, i) => (
              <DoorstepScene key={label} seed={`doorstep-${i}`} style={(['phool', 'kolam', 'poster'] as const)[i]} label={label} className={['', 'lg:mt-14', 'lg:mt-28'][i]} />
            ))}
          </div>
        </div>
      </section>

      <Threshold />

      {/* 3 · Custom portraits on a kumkum floor: your photo → drawn by hand. */}
      <section className="bg-kumkum grain-dark py-16 text-paper lg:py-28">
        <div className="wrap grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="grid gap-5 lg:col-span-5">
            <h2 className="font-heading text-h1">{h.portraits.title}</h2>
            <p className="text-paper/90">{h.portraits.sub}</p>
            {portraitPrice && <p className="text-h3-sm font-semibold">{portraitPrice}</p>}
            <ButtonLink href={p('/custom-portraits')} variant="light" className="sm:justify-self-start">
              {h.portraits.cta}
            </ButtonLink>
          </div>
          <div className="scroll-draw px-2 lg:col-span-6 lg:col-start-7">
            <PortraitPair photoLabel={h.portraits.photo} drawingLabel={h.portraits.drawing} />
          </div>
        </div>
      </section>

      <Threshold />

      {/* 4 · Categories as heaps of rangoli powder. */}
      <section className="bg-charcoal grain-dark py-16 text-paper lg:py-24">
        <div className="wrap grid gap-10">
          <h2 className="font-heading text-h1">{h.categories.title}</h2>
          <ul className={`grid gap-2 sm:grid-cols-3 lg:gap-6 ${heaps.length > 4 ? 'lg:grid-cols-5' : 'sm:grid-cols-4'}`}>
            {heaps.map((c) => (
              <li key={c.label}>
                <Link
                  href={c.href}
                  className="card flex min-h-16 items-center gap-4 rounded-ui p-3 hover:bg-paper/5 sm:grid sm:justify-items-center sm:gap-4 sm:p-6 sm:text-center"
                >
                  <PowderHeap color={c.color} className="w-20 shrink-0 sm:w-28" />
                  <span className="text-h3">{c.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Threshold />

      {/* 5 · New from the studio: framed, taped, different sizes. */}
      <section className="bg-paper grain py-16 lg:py-28">
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
            <ul className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4 lg:gap-x-8">
              {featured.map((f, i) => (
                <li key={f.slug} className={i === 0 ? 'col-span-2 lg:row-span-2' : ''}>
                  <Link href={f.href} className="card grid gap-3">
                    <div className="tape relative bg-surface p-3 shadow-frame lg:p-4">
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
                    </div>
                    <span className={`font-heading ${i === 0 ? 'text-h2' : 'text-h3'}`}>{f.title}</span>
                    <span className="font-semibold">
                      {f.sold ? (
                        t.shop.sold
                      ) : (
                        <>
                          {f.hasMorePrices && <span className="font-normal text-muted">{t.shop.from} </span>}
                          {formatPrice(f.price)}
                        </>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <a
            href={whatsappLink(t.whatsapp.message)}
            target="_blank"
            rel="noopener noreferrer"
            className="ink-link inline-flex min-h-11 items-center justify-self-start font-semibold text-leaf"
          >
            {h.featured.ask}
          </a>
        </div>
      </section>

      <Threshold />

      {/* 6 · Meet the artist on a charcoal floor. */}
      <section className="relative overflow-hidden bg-charcoal grain-dark py-20 text-paper lg:py-32">
        <DisplayWord className="absolute top-2 -left-6 text-paper/[0.07]">सिद्धेश</DisplayWord>
        <div className="wrap relative grid gap-14 lg:grid-cols-12 lg:items-center">
          <div className="relative mx-4 lg:col-span-5 lg:mx-0">
            <div className="tilt-left bg-paper p-3 shadow-frame">
              <PhotoPlaceholder ratio="4/5" seed="artist-portrait" medium="artist" note={t.photo.artist} alt={t.about.photoAlt} slot="Artist portrait 4:5" />
            </div>
          </div>
          <div className="grid gap-6 lg:col-span-6 lg:col-start-7">
            <h2 className="font-heading text-h1">{h.artist.title}</h2>
            <blockquote className="font-heading text-h3 text-paper/95 lg:text-[1.875rem] lg:leading-snug">“{h.artist.body}”</blockquote>
            <Link href={p('/about')} className="ink-link inline-flex min-h-11 items-center justify-self-start font-semibold">
              {h.artist.cta}
            </Link>
          </div>
        </div>
      </section>

      {/* 7 · Course on a peacock floor: a kolam line weaves through the dots as you scroll. */}
      {site.coursesLive && <Threshold />}
      {site.coursesLive && (
      <section className="bg-peacock grain-dark py-16 text-paper lg:py-28">
        <div className="wrap grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <KolamWeave className="scroll-draw mx-auto w-full max-w-sm" />
          </div>
          <div className="grid gap-5 lg:col-span-6 lg:col-start-7">
            <p className="font-semibold text-paper/85">{h.course.kicker}</p>
            <h2 className="font-heading text-h1">{h.course.name}</h2>
            <p className="text-paper/90">
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
        <section className="bg-paper py-16 lg:py-24">
          <div className="wrap grid gap-8">
            <h2 className="font-heading text-h1">{h.festivals.title}</h2>
            <FestivalTiles festivals={festivals} t={h.festivals} locale={locale} />
          </div>
        </section>
      )}

      <Testimonials items={testimonials} t={t.testimonials} />

      {/* 9 · A note for first-time online buyers. */}
      <section className="bg-paper pt-4 pb-20 lg:pb-28">
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
    </>
  )
}
