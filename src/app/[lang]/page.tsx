import type { Metadata } from 'next'
import Link from 'next/link'
import { ButtonLink } from '@/components/ButtonLink'
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder'
import { MandalaDivider, RangoliDraw } from '@/components/Rangoli'
import { alternates, localePath } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: alternates(await getLocale(), '/') }
}

export default async function HomePage() {
  const locale = await getLocale()
  const t = await getDictionary()
  const h = t.home
  const p = (path: string) => localePath(locale, path)

  const categories = [
    { href: p('/shop'), label: h.categories.drawings, kind: 'ART' as const },
    { href: p('/shop'), label: h.categories.paintings, kind: 'ART' as const },
    { href: p('/shop'), label: h.categories.rangoli, kind: 'RNG' as const },
    { href: p('/custom-portraits'), label: h.categories.portraits, kind: 'ART' as const },
    { href: p('/courses'), label: h.categories.courses, kind: 'PRC' as const },
  ]
  const festivals = [h.festivals.diwali, h.festivals.ganesh, h.festivals.gudi, h.festivals.weddings]

  return (
    <>
      {/* 1. Hero */}
      <section className="kolam">
        <div className="wrap grid items-center gap-8 py-10 lg:grid-cols-2 lg:gap-12 lg:py-20">
          {/* Text first on phones so the message and buttons are visible without scrolling. */}
          <div className="grid gap-6">
            <RangoliDraw className="size-16 lg:size-28" />
            <h1 className="font-heading text-display lg:text-display-lg">{h.hero.title}</h1>
            <p className="max-w-[46ch] text-muted">{h.hero.sub}</p>
            <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center">
              <ButtonLink href={p('/events')}>{h.hero.ctaEvent}</ButtonLink>
              <ButtonLink href={p('/shop')} variant="secondary">
                {h.hero.ctaShop}
              </ButtonLink>
              <ButtonLink href={p('/courses')} variant="tertiary">
                {h.hero.ctaLearn}
              </ButtonLink>
            </div>
          </div>
          <div>
            <PhotoPlaceholder ratio="4/5" kind="RNG" label="Signature rangoli · hero 4:5" alt="Signature rangoli by Siddesh Mokashi" className="shadow-frame" />
          </div>
        </div>
      </section>

      {/* 2. Event rangoli (main revenue path) */}
      <section className="py-16 lg:py-24">
        <div className="wrap grid gap-8 lg:grid-cols-[5fr_7fr] lg:items-center">
          <div className="grid gap-4">
            <h2 className="font-heading text-h2">{h.events.title}</h2>
            <p className="text-muted">{h.events.sub}</p>
            <ButtonLink href={p('/events')} variant="secondary" className="sm:justify-self-start">
              {h.events.cta}
            </ButtonLink>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {['Wedding', 'Festival', 'Society'].map((e) => (
              <li key={e}>
                <PhotoPlaceholder ratio="3/2" kind="EVT" label={`${e} event · 3:2`} alt={`${e} rangoli event photo`} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3. Custom portraits */}
      <section className="bg-surface py-16 lg:py-24">
        <div className="wrap grid gap-8 lg:grid-cols-2 lg:items-center">
          <PhotoPlaceholder ratio="1/1" kind="ART" label="Photo → hand-drawn portrait · 1:1" alt="A family photo next to the hand-drawn portrait made from it" />
          <div className="grid gap-4">
            <h2 className="font-heading text-h2">{h.portraits.title}</h2>
            <p className="text-muted">{h.portraits.sub}</p>
            <ButtonLink href={p('/custom-portraits')} variant="secondary" className="sm:justify-self-start">
              {h.portraits.cta}
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* 4. Categories */}
      <section className="py-16 lg:py-24">
        <div className="wrap grid gap-8">
          <h2 className="font-heading text-h2">{h.categories.title}</h2>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {categories.map((c) => (
              <li key={c.label}>
                <Link href={c.href} className="group grid gap-3">
                  <div className="overflow-hidden">
                    <PhotoPlaceholder ratio="4/5" kind={c.kind} label={`${c.label} · 4:5`} alt={c.label} className="transition-transform duration-400 group-hover:scale-[1.03]" />
                  </div>
                  <span className="font-heading text-h3">{c.label} →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <MandalaDivider />

      {/* 5. Featured artworks (real products arrive with the shop, milestone 7) */}
      <section className="py-16 lg:py-24">
        <div className="wrap grid gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-heading text-h2">{h.featured.title}</h2>
            <Link href={p('/shop')} className="min-h-11 content-center text-peacock underline underline-offset-4">
              {h.featured.seeAll}
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className="grid gap-3">
                <div className="bg-surface p-2 shadow-frame lg:p-3">
                  <PhotoPlaceholder ratio="4/5" kind="ART" label={`Artwork ${n} · 4:5`} alt={`${h.featured.itemTitle} ${n}`} />
                </div>
                <div>
                  <p className="font-heading text-h3">{h.featured.itemTitle}</p>
                  <p className="text-muted">{h.featured.priceSoon}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6. Meet the artist */}
      <section className="bg-surface py-16 lg:py-24">
        <div className="wrap grid gap-8 lg:grid-cols-[5fr_7fr] lg:items-center lg:gap-16">
          <div className="relative p-4">
            <RangoliDraw animate={false} className="absolute -top-2 -left-2 size-20 opacity-60" />
            <PhotoPlaceholder ratio="4/5" kind="POR" label="Artist portrait · 4:5" alt="Siddesh Mokashi in the studio" className="shadow-frame" />
          </div>
          <div className="grid gap-4">
            <h2 className="font-heading text-h2">{h.artist.title}</h2>
            <p className="max-w-[55ch] text-muted">{h.artist.body}</p>
            <ButtonLink href={p('/about')} variant="secondary" className="sm:justify-self-start">
              {h.artist.cta}
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* 7. Featured course */}
      <section className="py-16 lg:py-24">
        <div className="wrap grid gap-8 lg:grid-cols-2 lg:items-center">
          <PhotoPlaceholder ratio="16/9" kind="PRC" label="Course video thumbnail · 16:9" alt={h.course.name} />
          <div className="grid gap-4">
            <h2 className="font-heading text-h2">{h.course.title}</h2>
            <p className="font-heading text-h3">{h.course.name}</p>
            <p className="text-muted">{h.course.meta}</p>
            <ButtonLink href={p('/courses')} variant="secondary" className="sm:justify-self-start">
              {h.course.cta}
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* 8. Festivals */}
      <section className="kolam py-16 lg:py-24">
        <div className="wrap grid gap-8">
          <h2 className="font-heading text-h2">{h.festivals.title}</h2>
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {festivals.map((f) => (
              <li key={f}>
                <Link href={p('/festivals')} className="group grid gap-3">
                  <PhotoPlaceholder ratio="3/4" kind="RNG" label={`${f} rangoli · 3:4`} alt={`${f} rangoli`} />
                  <span className="font-heading text-h3">{f}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 9. Help for first-time online buyers */}
      <section className="py-16 lg:py-20">
        <div className="wrap">
          <div className="grid gap-4 rounded-ui border border-border/30 bg-surface p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
            <div className="grid gap-2">
              <h2 className="font-heading text-h3 lg:text-h2">{h.help.title}</h2>
              <p className="text-muted">{h.help.body}</p>
            </div>
            <ButtonLink href={p('/help')} variant="secondary">
              {h.help.cta}
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  )
}
