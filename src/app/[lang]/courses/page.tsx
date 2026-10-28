import type { Metadata } from 'next'
import { CoursesView } from '@/components/CoursesView'
import { alternates } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.courses.metaTitle, description: t.courses.metaDesc, alternates: alternates(await getLocale(), '/courses') }
}

export default async function CoursesPage() {
  return <CoursesView locale={await getLocale()} t={await getDictionary()} />
}
