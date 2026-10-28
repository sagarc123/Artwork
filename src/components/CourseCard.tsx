import { Clock, Layers, Users } from 'lucide-react'
import Link from 'next/link'
import { localeNames, localePath, type Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { pickMedium } from '@/lib/art'
import { coursePrice, formatDuration, forUnder18 } from '@/lib/courses'
import { formatPrice } from '@/lib/site'
import type { CourseCard as Course } from '@/server/content'
import { MediaImage } from './MediaImage'

export const lessonCount = (t: Dictionary['courses'], n: number) => (n === 1 ? t.lessonOne : t.lessons.replace('{n}', String(n)))

/** One course in a grid: matted thumbnail, level, lessons and length, languages, price. The whole card opens the course. */
export function CourseCard({ course, locale, t }: { course: Course; locale: Locale; t: Dictionary['courses'] }) {
  const cat = typeof course.category === 'object' ? course.category : null
  const price = coursePrice(course)
  const thumb = typeof course.thumbnail === 'object' ? course.thumbnail : null
  return (
    <li>
      <Link href={localePath(locale, `/courses/${course.slug}`)} className="card grid h-full content-start gap-3">
        <span className="tape relative block bg-surface p-2 shadow-frame lg:p-3">
          <MediaImage media={thumb} alt={course.title} ratio="16/10" seed={course.slug} medium={pickMedium([cat?.slug, cat?.name, course.title, course.slug], course.slug)} floor="charcoal" sizes="(min-width: 1024px) 33vw, 100vw" />
          {price.free && <span className="absolute top-4 left-4 rounded-ui bg-marigold px-3 py-1 font-semibold text-charcoal">{t.free}</span>}
        </span>
        {cat && <span className="font-semibold text-accent">{cat.name}</span>}
        <span className="font-heading text-h3-sm">{course.title}</span>
        <span className="flex flex-wrap gap-x-4 gap-y-1 text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Layers aria-hidden="true" className="size-5" />
            {t.levels[course.level]}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock aria-hidden="true" className="size-5" />
            {lessonCount(t, course.lessonCount)} · {formatDuration(course.seconds, t.units)}
          </span>
        </span>
        <span className="text-muted">
          {t.languagesLabel}:{' '}
          {course.languages.map((l, i) => (
            <span key={l} lang={l}>
              {i > 0 && ' · '}
              {localeNames[l]}
            </span>
          ))}
        </span>
        {forUnder18(course.audience) && (
          <span className="inline-flex items-start gap-1.5 text-muted">
            <Users aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            {t.under18}
          </span>
        )}
        <span className="font-semibold">
          {price.free ? t.free : formatPrice(price.now)}
          {price.was && <s className="ml-2 font-normal text-muted">{formatPrice(price.was)}</s>}
        </span>
        <span className="inline-flex h-12 items-center justify-center rounded-ui border-[1.5px] border-charcoal font-semibold">{t.view}</span>
      </Link>
    </li>
  )
}
