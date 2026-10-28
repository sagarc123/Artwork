import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EnrolButton } from '@/components/CourseEnrol'
import { CourseVideo } from '@/components/CourseVideo'
import { alternates, localePath } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { formatDuration, forUnder18, videoReady } from '@/lib/courses'
import { getCourse, getCourses } from '@/server/content'

// Unknown or locked lessons must wait for the full render so notFound() can still send a real 404.
export const ensureStatic = 'navigation'
export const instant = false

export async function generateStaticParams() {
  const params = (await getCourses('en')).flatMap((c) => (c.sample ? [{ slug: c.slug, lesson: String(c.sample.id) }] : []))
  return params.length ? params : [{ slug: '_', lesson: '_' }]
}

/** Only free-preview lessons are public: any other id is a 404, so a locked lesson's video id never leaves the server. */
async function load(params: PageProps<'/[lang]/courses/[slug]/sample/[lesson]'>['params']) {
  const { slug, lesson: id } = await params
  const locale = await getLocale()
  const found = await getCourse(locale, slug)
  const lesson = found?.lessons.find((l) => String(l.id) === id && l.isFreePreview)
  if (!found || !lesson) notFound()
  return { course: found.course, lesson, locale }
}

export async function generateMetadata({ params }: PageProps<'/[lang]/courses/[slug]/sample/[lesson]'>): Promise<Metadata> {
  const { course, lesson, locale } = await load(params)
  const t = await getDictionary()
  return {
    title: `${lesson.title} (${t.courses.sampleTitle})`,
    description: course.subtitle || course.title,
    alternates: alternates(locale, `/courses/${course.slug}/sample/${lesson.id}`),
  }
}

export default async function SampleLessonPage({ params }: PageProps<'/[lang]/courses/[slug]/sample/[lesson]'>) {
  const { course, lesson, locale } = await load(params)
  const c = (await getDictionary()).courses
  const courseHref = localePath(locale, `/courses/${course.slug}`)
  return (
    <article className="bg-paper grain pb-20 lg:pb-28">
      {forUnder18(course.audience) && <span hidden data-no-signup />}
      <div className="wrap grid max-w-4xl gap-6 pt-4 lg:pt-10">
        <Link href={courseHref} className="ink-link inline-flex min-h-11 items-center gap-2 justify-self-start font-semibold text-peacock">
          <ArrowLeft aria-hidden="true" className="size-5" />
          {c.sampleFrom}: {course.title}
        </Link>
        <CourseVideo videoId={lesson.bunnyVideoId} title={lesson.title} soon={c.videoSoon} soonNote={c.videoSoonNote} seed={`${course.slug}-${lesson.id}`} />
        <div className="grid gap-2">
          <p className="font-semibold text-accent">{videoReady(lesson.bunnyVideoId) ? c.sampleTitle : c.previewSoon}</p>
          <h1 className="font-heading text-h1">{lesson.title}</h1>
          {!!lesson.durationSeconds && <p className="text-muted">{formatDuration(lesson.durationSeconds, c.units)}</p>}
        </div>
        <div className="grid gap-4 rounded-ui bg-surface p-6 shadow-frame sm:grid-cols-[1fr_auto] sm:items-center">
          <p className="font-heading text-h3-sm">{course.title}</p>
          <div className="grid gap-3 sm:flex">
            <Link href={courseHref} className="press inline-flex h-13 items-center justify-center rounded-ui border-[1.5px] border-charcoal px-6 font-semibold sm:h-12">
              {c.continueCourse}
            </Link>
            <EnrolButton course={course} locale={locale} t={c} />
          </div>
        </div>
      </div>
    </article>
  )
}
