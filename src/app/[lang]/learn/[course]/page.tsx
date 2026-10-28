import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { EmptyState } from '@/components/EmptyState'
import { localePath } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { resumeLesson } from '@/lib/learn'
import { getCustomer } from '@/server/customer'
import { playerData } from '@/server/learn'

// Per person, per request.
export const instant = false

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.learn.metaTitle, robots: { index: false, follow: false } }
}

/** /learn/[course]: opens the lesson you were last on, or the first one. */
export default async function LearnCourse({ params }: PageProps<'/[lang]/learn/[course]'>) {
  const { course: slug } = await params
  const locale = await getLocale()
  const me = await getCustomer()
  if (!me) redirect(`${localePath(locale, '/login')}?next=${encodeURIComponent(`/learn/${slug}`)}`)
  const data = await playerData(me.id, slug, locale)
  if (data.status === 'missing') notFound()
  if (data.status === 'not_enrolled') redirect(localePath(locale, `/courses/${slug}`))
  const lesson = resumeLesson(data.lessons, typeof data.enrolment.lastLesson === 'number' ? data.enrolment.lastLesson : null)
  if (lesson) redirect(localePath(locale, `/learn/${slug}/${lesson.id}`))
  const t = await getDictionary()
  return (
    <section className="bg-paper py-12 lg:py-20">
      <div className="wrap">
        <EmptyState title={data.course.title} body={t.learn.noLessons}>
          <Link href={localePath(locale, '/account')} className="press mt-2 inline-flex h-13 items-center rounded-ui bg-kumkum px-6 font-semibold text-white">
            {t.learn.back}
          </Link>
        </EmptyState>
      </div>
    </section>
  )
}
