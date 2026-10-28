import { ArrowLeft, Award, Check, Lock, Play } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CourseCard } from '@/components/CourseCard'
import { EnrolButton, EnrolCard } from '@/components/CourseEnrol'
import { CourseVideo } from '@/components/CourseVideo'
import { alternates, localeNames, localePath } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { coursePrice, formatDuration, groupSections } from '@/lib/courses'
import { formatPrice, site } from '@/lib/site'
import type { Media } from '@/payload-types'
import { getCourse, getCourses, getSlugs } from '@/server/content'

// Unknown slugs must wait for the full render so notFound() can still send a real 404 (not the streamed App Shell).
export const ensureStatic = 'navigation'
export const instant = false

export async function generateStaticParams() {
  return (await getSlugs('courses')).map((slug) => ({ slug }))
}

async function load(params: PageProps<'/[lang]/courses/[slug]'>['params']) {
  const { slug } = await params
  const locale = await getLocale()
  const found = await getCourse(locale, slug)
  if (!found) notFound()
  return { ...found, locale }
}

export async function generateMetadata({ params }: PageProps<'/[lang]/courses/[slug]'>): Promise<Metadata> {
  const { course, locale } = await load(params)
  const title = course.seo?.title || course.title
  const description = course.seo?.description || course.subtitle || undefined
  return {
    title,
    description,
    alternates: alternates(locale, `/courses/${course.slug}`),
    openGraph: { siteName: site.brandName, type: 'website', title, description },
  }
}

const catId = (c: { category: unknown }) => (c.category && typeof c.category === 'object' && 'id' in c.category ? c.category.id : c.category)

export default async function CoursePage({ params }: PageProps<'/[lang]/courses/[slug]'>) {
  const { course, lessons, locale } = await load(params)
  const t = await getDictionary()
  const c = t.courses
  const cat = typeof course.category === 'object' ? course.category : null
  const thumb = typeof course.thumbnail === 'object' ? (course.thumbnail as Media) : null
  const outcomes = (course.outcomes ?? []).filter((o) => o.text?.trim())
  const materials = (course.materials ?? []).filter((m) => m.text?.trim())
  const sections = groupSections(lessons)
  const seconds = lessons.reduce((n, l) => n + (l.durationSeconds ?? 0), 0)
  const time = formatDuration(seconds, c.units)
  const price = coursePrice(course)
  const faq = course.faq?.length ? course.faq.map((f) => ({ q: f.question, a: f.answer })) : c.faq
  const related = (await getCourses(locale))
    .filter((x) => x.id !== course.id)
    .sort((a, b) => Number(catId(b) === catId(course)) - Number(catId(a) === catId(course)))
    .slice(0, 3)
  const enrol = { slug: course.slug, title: course.title, price: course.price, salePrice: course.salePrice, audience: course.audience, certificateEnabled: course.certificateEnabled }

  // Structured data so Google can show the course with its price.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.subtitle ?? course.title,
    image: thumb?.url ? [new URL(thumb.url, site.url).toString()] : undefined,
    inLanguage: course.languages,
    educationalLevel: course.level,
    provider: { '@type': 'Person', name: site.artistName, url: site.url },
    hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online', courseWorkload: `PT${Math.max(1, Math.round(seconds / 60))}M` },
    offers: { '@type': 'Offer', category: price.free ? 'Free' : 'Paid', price: price.now, priceCurrency: 'INR', url: new URL(localePath(locale, `/courses/${course.slug}`), site.url).toString() },
  }

  return (
    <article className="bg-paper grain pb-40 lg:pb-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="wrap grid gap-6 pt-4 lg:grid-cols-12 lg:gap-12 lg:pt-10">
        <nav aria-label={c.breadcrumb} className="flex flex-wrap items-center gap-x-2 lg:col-span-12">
          <Link href={localePath(locale, '/courses')} className="ink-link inline-flex min-h-11 items-center gap-2 font-semibold text-peacock">
            <ArrowLeft aria-hidden="true" className="size-5" />
            {c.back}
          </Link>
          {cat && (
            <>
              <span aria-hidden="true">›</span>
              <Link href={localePath(locale, `/courses/category/${cat.slug}`)} className="ink-link inline-flex min-h-11 items-center font-semibold text-peacock">
                {cat.name}
              </Link>
            </>
          )}
        </nav>

        <div className="grid content-start gap-10 lg:col-span-7">
          <div className="grid gap-5">
            <CourseVideo videoId={course.introVideoId} title={`${c.introVideo}: ${course.title}`} soon={c.videoSoon} soonNote={c.videoSoonNote} seed={course.slug} />
            <h1 className="font-heading text-h1">{course.title}</h1>
            {course.subtitle && <p className="max-w-[55ch] text-h3-sm text-muted">{course.subtitle}</p>}
            <p className="flex flex-wrap gap-x-5 gap-y-1 text-muted">
              <span>{c.levels[course.level]}</span>
              <span>{c.lessonsMeta.replace('{lessons}', String(lessons.length)).replace('{time}', time)}</span>
              <span>
                {c.languagesLabel}:{' '}
                {course.languages.map((l, i) => (
                  <span key={l} lang={l}>
                    {i > 0 && ' · '}
                    {localeNames[l]}
                  </span>
                ))}
              </span>
              {course.certificateEnabled && (
                <span className="inline-flex items-center gap-1.5">
                  <Award aria-hidden="true" className="size-5" />
                  {c.certificate}
                </span>
              )}
            </p>
          </div>

          {outcomes.length > 0 && (
            <section className="grid gap-4">
              <h2 className="font-heading text-h2">{c.learn}</h2>
              <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {outcomes.map((o) => (
                  <li key={o.id ?? o.text} className="flex gap-3">
                    <Check aria-hidden="true" className="mt-1 size-5 shrink-0 text-leaf" />
                    {o.text}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="grid gap-4">
            <h2 className="font-heading text-h2">{c.curriculum}</h2>
            <p className="text-muted">{c.summary.replace('{sections}', String(sections.length)).replace('{lessons}', String(lessons.length)).replace('{time}', time)}</p>
            <div className="grid gap-3">
              {sections.map((s, i) => (
                <details key={`${s.title}-${i}`} open className="group rounded-ui bg-surface shadow-frame">
                  <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 px-5 font-semibold">
                    {s.title}
                    <span aria-hidden="true" className="transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <ul className="border-t border-border/30">
                    {s.lessons.map((l) => {
                      const row = (
                        <>
                          {l.isFreePreview ? <Play aria-hidden="true" className="size-5 shrink-0 text-leaf" /> : <Lock aria-hidden="true" className="size-5 shrink-0 text-muted" />}
                          <span className="grow">{l.title}</span>
                          <span className={`shrink-0 font-semibold ${l.isFreePreview ? 'text-leaf' : 'text-muted'}`}>{l.isFreePreview ? c.preview : c.locked}</span>
                          {!!l.durationSeconds && <span className="shrink-0 text-muted">{formatDuration(l.durationSeconds, c.units)}</span>}
                        </>
                      )
                      const cls = 'flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 border-b border-border/20 px-5 py-2 last:border-b-0'
                      return (
                        <li key={l.id}>
                          {l.isFreePreview ? (
                            <Link href={localePath(locale, `/courses/${course.slug}/sample/${l.id}`)} className={`${cls} hover:bg-placeholder`}>
                              {row}
                            </Link>
                          ) : (
                            <div className={cls} title={c.lockedHint}>
                              {row}
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </details>
              ))}
            </div>
            {lessons.some((l) => !l.isFreePreview) && <p className="text-muted">{c.lockedHint}</p>}
          </section>

          {materials.length > 0 && (
            <section className="grid gap-4">
              <h2 className="font-heading text-h2">{c.materials}</h2>
              <ul className="grid gap-2">
                {materials.map((m) => {
                  const product = m.product && typeof m.product === 'object' ? m.product : null
                  return (
                    <li key={m.id ?? m.text} className="flex flex-wrap items-center gap-x-4">
                      <span className="flex items-center gap-3">
                        <Check aria-hidden="true" className="size-5 shrink-0 text-leaf" />
                        {m.text}
                      </span>
                      {product && (
                        <Link href={localePath(locale, `/shop/p/${product.slug}`)} className="ink-link inline-flex min-h-11 items-center font-semibold text-peacock">
                          {c.buyInShop}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          <section className="grid max-w-[65ch] gap-3">
            <h2 className="font-heading text-h2">{c.teacher}</h2>
            <p>{c.teacherBody}</p>
            <Link href={localePath(locale, '/about')} className="ink-link inline-flex min-h-11 items-center font-semibold text-peacock">
              {c.readStory}
            </Link>
          </section>

          <section className="grid gap-2">
            <h2 className="font-heading text-h2">{c.faqTitle}</h2>
            {faq.map((f) => (
              <details key={f.q} className="group border-t border-border/30 py-2">
                <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-4 font-semibold">
                  {f.q}
                  <span aria-hidden="true" className="transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pb-3 text-muted">{f.a}</p>
              </details>
            ))}
          </section>
        </div>

        <aside className="grid content-start gap-5 lg:sticky lg:top-32 lg:col-span-5 lg:self-start">
          <EnrolCard course={enrol} locale={locale} t={c} />
        </aside>
      </div>

      {related.length > 0 && (
        <section className="wrap mt-20 grid gap-8 lg:mt-28">
          <h2 className="font-heading text-h1">{c.related}</h2>
          <ul className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {related.map((x) => (
              <CourseCard key={x.id} course={x} locale={locale} t={c} />
            ))}
          </ul>
        </section>
      )}

      {/* Phones: price and Enrol stay in reach, just above the bottom tab bar. */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-border/25 bg-surface/95 backdrop-blur lg:hidden">
        <div className="wrap flex items-center justify-between gap-4 py-2">
          <p className="font-semibold">
            {price.free ? c.free : formatPrice(price.now)}
            {price.was && <s className="ml-2 font-normal text-muted">{formatPrice(price.was)}</s>}
          </p>
          <EnrolButton course={enrol} locale={locale} t={c} className="min-w-0 flex-1 sm:flex-none" />
        </div>
      </div>
    </article>
  )
}
