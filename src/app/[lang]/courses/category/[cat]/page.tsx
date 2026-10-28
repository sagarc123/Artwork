import type { Metadata } from 'next'
import { CoursesView } from '@/components/CoursesView'
import { alternates } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { getCourses } from '@/server/content'

// Unknown categories must wait for the full render so notFound() can still send a real 404 (not the streamed App Shell).
export const ensureStatic = 'navigation'
export const instant = false

const slugOf = (c: { category: unknown }) => (c.category && typeof c.category === 'object' && 'slug' in c.category ? String(c.category.slug) : '')

export async function generateStaticParams() {
  const slugs = [...new Set((await getCourses('en')).map(slugOf).filter(Boolean))]
  return (slugs.length ? slugs : ['_']).map((cat) => ({ cat }))
}

export async function generateMetadata({ params }: PageProps<'/[lang]/courses/category/[cat]'>): Promise<Metadata> {
  const { cat } = await params
  const locale = await getLocale()
  const t = await getDictionary()
  const course = (await getCourses(locale)).find((c) => slugOf(c) === cat)
  const name = course && typeof course.category === 'object' ? course.category.name : undefined
  return { title: name ?? t.courses.metaTitle, description: t.courses.metaDesc, alternates: alternates(locale, `/courses/category/${cat}`) }
}

export default async function CoursesCategoryPage({ params }: PageProps<'/[lang]/courses/category/[cat]'>) {
  const { cat } = await params
  return <CoursesView locale={await getLocale()} t={await getDictionary()} categorySlug={cat} />
}
