import { ArrowLeft, Award, Check } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { CourseVideo } from '@/components/CourseVideo'
import { LessonActions } from '@/components/LessonActions'
import { ProgressBar } from '@/components/ProgressBar'
import { localePath, type Locale } from '@/i18n/config'
import { getDictionary, getLocale, type Dictionary } from '@/i18n/dictionaries'
import { formatDuration, groupSections } from '@/lib/courses'
import { neighbours, nextToDo, progressCount } from '@/lib/learn'
import { MIN_PROGRESS } from '@/lib/reviews'
import { getCustomer } from '@/server/customer'
import { playerData } from '@/server/learn'
import { hasReviewed } from '@/server/reviews'

// Per person, per request: nothing here is cached or shared, and a paid lesson's video id is only read after the enrolment check.
export const instant = false

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.learn.metaTitle, robots: { index: false, follow: false } }
}

type Lesson = { id: number; title: string; section: string; order: number; durationSeconds?: number | null }

function LessonList({ lessons, doneIds, currentId, href, t, units }: { lessons: Lesson[]; doneIds: number[]; currentId: number; href: (id: number) => string; t: Dictionary['learn']; units: { h: string; m: string } }) {
  const done = new Set(doneIds)
  return (
    <div className="grid gap-5">
      {groupSections(lessons).map((s) => (
        <section key={s.title} className="grid gap-1">
          <h3 className="font-semibold text-muted">{s.title}</h3>
          <ol className="grid">
            {s.lessons.map((l) => (
              <li key={l.id}>
                <Link
                  href={href(l.id)}
                  aria-current={l.id === currentId ? 'page' : undefined}
                  className="flex min-h-12 items-center gap-3 border-l-4 border-transparent py-2 pr-2 pl-3 hover:bg-charcoal/5 aria-[current=page]:border-peacock aria-[current=page]:bg-peacock/10 aria-[current=page]:font-semibold"
                >
                  <span aria-hidden="true" className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${done.has(l.id) ? 'border-leaf bg-leaf text-white' : 'border-border/60'}`}>
                    {done.has(l.id) && <Check className="size-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    {l.title}
                    {done.has(l.id) && <span className="sr-only"> ({t.done})</span>}
                    {l.id === currentId && <span className="sr-only"> ({t.current})</span>}
                  </span>
                  {!!l.durationSeconds && <span className="shrink-0 text-muted">{formatDuration(l.durationSeconds, units)}</span>}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}

/** /learn/[course]/[lesson]: for enrolled customers only. */
export default async function LessonPage({ params }: PageProps<'/[lang]/learn/[course]/[lesson]'>) {
  const { course: slug, lesson: raw } = await params
  const locale: Locale = await getLocale()
  const here = `/learn/${slug}/${raw}`
  const me = await getCustomer()
  if (!me) redirect(`${localePath(locale, '/login')}?next=${encodeURIComponent(here)}`)
  if (!/^\d{1,9}$/.test(raw)) notFound()
  const data = await playerData(me.id, slug, locale)
  if (data.status === 'missing') notFound()
  // Signed in but not enrolled: the course page, where Enrol is. No lesson data is read for them.
  if (data.status === 'not_enrolled') redirect(localePath(locale, `/courses/${slug}`))
  const { course, lessons, doneIds, certificate } = data
  const lesson = lessons.find((l) => l.id === Number(raw))
  if (!lesson) notFound()

  const t = await getDictionary()
  const l = t.learn
  const c = t.courses
  const href = (id: number) => localePath(locale, `/learn/${slug}/${id}`)
  const progress = progressCount(lessons.map((x) => x.id), doneIds)
  const { prev, next } = neighbours(lessons, lesson.id)
  const done = doneIds.includes(lesson.id)
  const open = (n: { id: number; title: string } | null) => (n ? { href: href(n.id), title: n.title } : null)
  const afterDone = nextToDo(lessons, lesson.id, [...doneIds, lesson.id])
  const index = lessons.findIndex((x) => x.id === lesson.id) + 1
  const list = <LessonList lessons={lessons} doneIds={doneIds} currentId={lesson.id} href={href} t={l} units={c.units} />
  const name = me.name || ''
  // "Write a review" appears once 30% of the lessons are done (the form page checks again on the server).
  const canReview = progress.percent >= MIN_PROGRESS && !(await hasReviewed(me.id, 'course', course.id))

  return (
    <article className="bg-paper grain pb-20 lg:pb-28">
      {/* Learners may be under 18: no newsletter box in the footer here. */}
      <span hidden data-no-signup />
      <div className="wrap grid gap-8 pt-4 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-10 lg:pt-8">
        <div className="grid min-w-0 content-start gap-6">
          <div className="grid gap-3">
            <Link href={localePath(locale, '/account')} className="ink-link inline-flex min-h-11 items-center gap-2 justify-self-start font-semibold text-peacock">
              <ArrowLeft aria-hidden="true" className="size-5" />
              {l.back}
            </Link>
            <p className="font-heading text-h3-sm">{course.title}</p>
            <ProgressBar done={progress.done} total={progress.total} label={l.progress.replace('{done}', String(progress.done)).replace('{total}', String(progress.total))} />
          </div>

          {/* The player when the lesson has a real video (id and library), else the "coming soon" card. */}
          <CourseVideo key={lesson.id} videoId={lesson.bunnyVideoId} title={lesson.title} soon={c.videoSoon} soonNote={c.videoSoonNote} seed={`${course.slug}-${lesson.id}`} />

          <div className="grid gap-1">
            <p className="font-semibold text-accent">{l.lessonNo.replace('{n}', String(index))}</p>
            <h1 className="font-heading text-h1 [overflow-wrap:anywhere]">{lesson.title}</h1>
            {!!lesson.durationSeconds && <p className="text-muted">{formatDuration(lesson.durationSeconds, c.units)}</p>}
          </div>

          <LessonActions lessonId={lesson.id} done={done} hasNext={!!afterDone} lessonBase={localePath(locale, `/learn/${slug}`)} prev={open(prev)} next={open(next)} t={l} />

          {progress.complete && (
            <section aria-labelledby="complete" className="grid gap-3 rounded-ui border-2 border-leaf bg-surface p-6 shadow-frame">
              <Award aria-hidden="true" className="size-10 text-leaf" />
              <h2 id="complete" className="font-heading text-h2">
                {l.completeTitle.replace('{name}', name || '')}
              </h2>
              <p>{l.completeBody.replace('{course}', course.title)}</p>
              {certificate ? (
                <Link href={localePath(locale, `/certificate/${certificate.publicId}`)} className="press inline-flex h-13 items-center justify-center rounded-ui bg-kumkum px-6 font-semibold text-white hover:bg-kumkum/90 sm:justify-self-start">
                  {l.viewCert}
                </Link>
              ) : (
                <p role="status" className="font-semibold">
                  {l.certWait}
                </p>
              )}
            </section>
          )}

          {canReview && (
            <Link href={localePath(locale, `/review/course/${course.id}`)} className="press inline-flex h-13 items-center justify-center rounded-ui border-[1.5px] border-charcoal px-6 font-semibold sm:justify-self-start">
              {t.reviews.write}
            </Link>
          )}

          {lesson.transcript?.trim() && (
            <section className="grid max-w-[65ch] gap-2">
              <h2 className="font-heading text-h3">{l.transcript}</h2>
              <p className="whitespace-pre-line">{lesson.transcript}</p>
            </section>
          )}

          {/* Phones and tablets: the lessons are a list under the lesson. */}
          <details className="group rounded-ui border border-border/40 px-4 lg:hidden">
            <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-3 font-semibold">
              {l.lessonsToggle.replace('{done}', String(progress.done)).replace('{total}', String(progress.total))}
              <span aria-hidden="true" className="text-xl transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="pb-4">{list}</div>
          </details>
        </div>

        <aside aria-label={l.lessonsTitle} className="hidden lg:block">
          <div className="sticky top-32 grid max-h-[calc(100dvh-9rem)] gap-4 overflow-y-auto rounded-ui bg-surface p-5 shadow-frame">
            <h2 className="font-heading text-h3">{l.lessonsTitle}</h2>
            {list}
          </div>
        </aside>
      </div>
    </article>
  )
}
