import { Clock, Play } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { localePath, type Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { formatDuration } from '@/lib/courses'
import { getCourses } from '@/server/content'
import { CourseCard } from './CourseCard'
import { EmptyState } from './EmptyState'
import { GenerativeRangoli } from './GenerativeRangoli'
import { PageHero } from './PageHero'
import { whatsappLink } from '@/lib/site'

/** Course listing for /courses and /courses/category/[cat]. */
export async function CoursesView({ locale, t, categorySlug }: { locale: Locale; t: Dictionary; categorySlug?: string }) {
  const c = t.courses
  const all = await getCourses(locale)
  // Tabs come from the courses themselves, so a type with no published course never shows as an empty tab.
  const cats = new Map<string, string>()
  for (const x of all) if (typeof x.category === 'object') cats.set(x.category.slug, x.category.name)
  if (categorySlug && !cats.has(categorySlug)) notFound()
  const courses = all.filter((x) => !categorySlug || (typeof x.category === 'object' && x.category.slug === categorySlug))
  const tabs = [{ href: localePath(locale, '/courses'), name: c.all, active: !categorySlug }, ...[...cats].map(([slug, name]) => ({ href: localePath(locale, `/courses/category/${slug}`), name, active: slug === categorySlug }))]
  const samples = courses.filter((x) => x.sample)

  return (
    <>
      <PageHero
        floor="leaf"
        title={categorySlug ? cats.get(categorySlug)! : c.title}
        sub={c.intro}
        artOnPhones={false}
        art={<GenerativeRangoli seed="courses-hero" style="kolam" tone="dark" className="ml-auto w-56 xl:w-64" />}
      >
        {samples.length > 0 && (
          <a href="#free" className="press inline-flex h-13 items-center justify-center gap-2 rounded-ui bg-(--btn-bg) px-6 font-semibold text-(--btn-fg) sm:h-12">
            <Play aria-hidden="true" className="size-5" />
            {c.ctaFree}
          </a>
        )}
        <a href="#all" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4 hover:no-underline">
          {c.ctaAll}
        </a>
      </PageHero>

      <section id="all" className="bg-paper pt-10 pb-16 lg:pb-24">
        <div className="wrap grid gap-8">
          <nav aria-label={c.typeLabel} className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-2">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={tab.active ? 'page' : undefined}
                className="inline-flex min-h-12 shrink-0 items-center rounded-full border-[1.5px] border-charcoal px-5 aria-[current=page]:bg-charcoal aria-[current=page]:text-paper"
              >
                {tab.name}
              </Link>
            ))}
          </nav>
          {courses.length === 0 ? (
            <EmptyState title={c.empty}>
              <a href={whatsappLink(c.title)} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center rounded-ui border-[1.5px] border-leaf px-6 font-semibold text-leaf">
                WhatsApp
              </a>
            </EmptyState>
          ) : (
            <ul className="pin-in grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} locale={locale} t={c} />
              ))}
            </ul>
          )}
        </div>
      </section>

      {samples.length > 0 && (
        <section id="free" className="bg-placeholder py-16 lg:py-24">
          <div className="wrap grid gap-8">
            <div className="grid gap-2">
              <h2 className="font-heading text-h1">{c.freeTitle}</h2>
              <p className="max-w-[55ch] text-muted">{c.freeSub}</p>
            </div>
            <ul className="grid gap-4 md:grid-cols-3">
              {samples.map((x) => (
                <li key={x.id}>
                  <Link href={localePath(locale, `/courses/${x.slug}/sample/${x.sample!.id}`)} className="card grid h-full gap-2 rounded-ui bg-surface p-5 shadow-frame">
                    <span className="inline-flex w-fit items-center gap-2 rounded-ui bg-marigold px-3 py-1 font-semibold text-charcoal">
                      <Play aria-hidden="true" className="size-4" />
                      {c.freeBadge}
                    </span>
                    <span className="font-heading text-h3-sm">{x.sample!.title}</span>
                    <span className="text-muted">{x.title}</span>
                    <span className="inline-flex items-center gap-1.5 text-muted">
                      <Clock aria-hidden="true" className="size-5" />
                      {formatDuration(x.sample!.seconds, c.units)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="bg-paper py-16 lg:py-24">
        <div className="wrap grid gap-6">
          <h2 className="font-heading text-h1">{c.faqTitle}</h2>
          <div className="grid max-w-3xl">
            {c.faq.slice(0, 4).map((f) => (
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
          </div>
        </div>
      </section>
    </>
  )
}
