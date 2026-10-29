// Everyday home page: the Warm Studio sections (hero art, trust line, how it works, event tiles, portrait band, course band).
// Each is wrapped in .look-everyday by the page, so the festive home is unchanged.
import { Clock, Layers } from 'lucide-react'
import Link from 'next/link'
import { localePath, type Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { pickMedium } from '@/lib/art'
import { coursePrice, formatDuration } from '@/lib/courses'
import { formatPrice, whatsappLink } from '@/lib/site'
import type { CourseCard as Course, getTrust } from '@/server/content'
import { lessonCount } from './CourseCard'
import { MediaImage } from './MediaImage'
import { PhotoPlaceholder } from './PhotoPlaceholder'
import { PhotoStandIn, SketchStandIn } from './StandIns'
import { RimBadge, Thali } from './Thali'

type Home = Dictionary['home']

/** "8 years · 150+ events · Pune, Mumbai · ★ 4.9 (32 ratings)": only the parts that are filled in; nothing at all when none are. */
export function TrustLine({ trust, t }: { trust: Awaited<ReturnType<typeof getTrust>>; t: Home['trust'] }) {
  const { rating } = trust
  const parts = [
    trust.years > 0 && <span key="y">{t.years.replace('{n}', String(trust.years))}</span>,
    trust.events > 0 && <span key="e">{t.events.replace('{n}', String(trust.events))}</span>,
    trust.cities && <span key="c">{trust.cities}</span>,
    rating && (
      <span key="r" role="img" aria-label={t.rating.replace('{rating}', String(rating.average))}>
        ★ {rating.average}
        {rating.count > 0 && <span className="ml-1 text-[0.9375rem]">{t.count.replace('{n}', String(rating.count))}</span>}
      </span>
    ),
  ].filter(Boolean)
  if (parts.length === 0) return null
  return (
    <p className="ws-trust">
      {parts.map((x, i) => (
        <span key={i} className="contents">
          {i > 0 && <span aria-hidden="true">·</span>}
          {x}
        </span>
      ))}
    </p>
  )
}

const WaIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-6 shrink-0">
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 13.9c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2 1.3 2.3 1.4.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.8-.2 1.5z" />
  </svg>
)

/** The one big WhatsApp action (green, white text). */
export function WaButton({ href, children, className = '' }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`ws-wa ${className}`}>
      <WaIcon />
      {children}
    </a>
  )
}

/** Hero art: one large plate with a small portrait plate overlapping its lower left, on a soft disc. Phones: the one plate. */
export function HeroStage({ rangoli, portrait }: { rangoli: React.ReactNode; portrait: React.ReactNode }) {
  return (
    <div className="ws-stage">
      <span aria-hidden="true" className="ws-halo" />
      <Thali category="rangoli" seed="siddesh-home" n={21} width="82%" className="ws-big">
        {rangoli}
      </Thali>
      <Thali category="portrait" seed="siddesh-portrait" n={16} width="42%" className="ws-small">
        {portrait}
      </Thali>
    </div>
  )
}

/** Three numbered steps on a white band. Events and portraits are enquiries: nothing is paid until the price is agreed. */
export function HowItWorks({ t }: { t: Home['how'] }) {
  return (
    <section className="ws-how" aria-labelledby="how-title">
      <div className="wrap grid gap-8">
        <h2 id="how-title" className="font-heading text-h1">
          {t.title}
        </h2>
        <ol className="grid gap-4 md:grid-cols-3 md:gap-6">
          {t.steps.map((s, i) => (
            <li key={s.t} className="ws-step rv">
              <span aria-hidden="true" className="ws-n">
                {i + 1}
              </span>
              <span className="grid gap-1">
                <b className="font-heading text-[1.125rem] leading-snug font-medium">{s.t}</b>
                <span>{s.b}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/** Wedding, Festival, Society: a stand-in, the real "from" price, and "Check my date" on WhatsApp naming the event type. */
export function EventTiles({ t, price }: { t: Home['events']; price: string | null }) {
  return (
    <section className="ws-section">
      <div className="dotline dl" aria-hidden="true" />
      <div className="wrap grid gap-8">
        <div className="grid max-w-3xl gap-3">
          <h2 className="font-heading text-h1">{t.title}</h2>
          <p>{t.sub}</p>
        </div>
        <ul className="ws-tiles grid gap-4 md:grid-cols-3 md:gap-6">
          {t.scenes.map((name, i) => (
            <li key={name} className="rv">
              <div className="art-card grid">
                <span className="relative block">
                  <PhotoPlaceholder ratio="16/11" seed={`doorstep-${i}`} style={(['phool', 'kolam', 'poster'] as const)[i]} floor="paper" alt="" slot={`Event photo: ${name}`} />
                  <RimBadge category="rangoli" seed={`tile-${i}`} />
                </span>
                <span className="kind">{t.kicker}</span>
                <h3 className="font-heading text-h3-sm">{name}</h3>
                {price && <span className="price-pill font-semibold">{price}</span>}
                <a
                  href={whatsappLink(t.tileMsg.replace('{type}', name))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-btn mt-2 inline-flex min-h-12 items-center justify-center rounded-ui border-[1.5px] px-4 font-semibold"
                >
                  {t.check}
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** "Your photo, drawn by hand": photo → sketch, the real "from" price, the delivery time from the portrait copy, and WhatsApp. */
export function PortraitBand({ t, price, locale }: { t: Home['portraits']; price: string | null; locale: Locale }) {
  return (
    <section className="ws-band">
      <div className="wrap grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
        <div className="grid content-start gap-4">
          <h2 className="font-heading text-h1">{t.title}</h2>
          <p className="max-w-[42ch]">{t.sub}</p>
          {price && <span className="price-pill font-semibold">{price}</span>}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <WaButton href={whatsappLink(t.waMsg)}>{t.waCta}</WaButton>
            <Link href={localePath(locale, '/custom-portraits')} data-variant="secondary" className="inline-flex min-h-12 items-center justify-center rounded-ui border-[1.5px] px-5 font-semibold">
              {t.cta}
            </Link>
          </div>
        </div>
        <div className="ws-ba rv max-lg:hidden">
          <figure>
            <div aria-hidden="true" className="ws-mat">
              <PhotoStandIn seed="portrait-pair" />
            </div>
            <figcaption>{t.photo}</figcaption>
          </figure>
          <span aria-hidden="true" className="ws-arrow">
            →
          </span>
          <figure>
            <div aria-hidden="true" className="ws-mat">
              <SketchStandIn seed="portrait-pair" subject="face" />
            </div>
            <figcaption>{t.drawing}</figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}

/** The featured (newest published) course on a deep peacock band. The page hides it when there is none. */
export function CourseBand({ course, t, c, locale }: { course: Course; t: Home['course']; c: Dictionary['courses']; locale: Locale }) {
  const cat = typeof course.category === 'object' ? course.category : null
  const thumb = typeof course.thumbnail === 'object' ? course.thumbnail : null
  const price = coursePrice(course)
  return (
    <section className="ws-course text-paper">
      <div className="wrap grid gap-8 lg:grid-cols-[18rem_1fr] lg:items-center lg:gap-14">
        <Thali category="course" seed={course.slug} width="min(18rem, 62%)" className="rv mx-auto">
          <MediaImage media={thumb} alt={course.title} ratio="1/1" seed={course.slug} medium={pickMedium([cat?.slug, cat?.name, course.title, course.slug], course.slug)} floor="charcoal" sizes="300px" />
        </Thali>
        <div className="rv grid content-start gap-4 max-lg:text-center max-lg:justify-items-center">
          <p className="font-semibold">{t.kicker}</p>
          <h2 className="font-heading text-h1">{course.title}</h2>
          {course.subtitle && <p className="max-w-[46ch] text-paper/90">{course.subtitle}</p>}
          <p className="flex flex-wrap gap-x-5 gap-y-1 text-paper/90 max-lg:justify-center">
            <span className="inline-flex items-center gap-1.5">
              <Layers aria-hidden="true" className="size-5" />
              {c.levels[course.level]}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock aria-hidden="true" className="size-5" />
              {lessonCount(c, course.lessonCount)} · {formatDuration(course.seconds, c.units)}
            </span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-4 max-lg:justify-center">
            <Link href={localePath(locale, `/courses/${course.slug}`)} className="ws-pop">
              {t.cta}
            </Link>
            <span className="price-pill font-semibold">{price.free ? c.free : formatPrice(price.now)}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
