import { isLocale } from '@/i18n/config'
import { getCourse } from '@/server/content'
import { ogImage, ogSize, ogType } from '@/server/og'

export const alt = 'A drawing course by Siddesh Mokashi'
export const size = ogSize
export const contentType = ogType

/** The course thumbnail with its title; the branded card while it has no real photo. */
export default async function Image({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params
  const found = await getCourse(isLocale(lang) ? lang : 'en', slug)
  if (!found) return ogImage({ title: 'Siddesh Mokashi' })
  return ogImage({ title: found.course.title, kicker: found.course.subtitle?.slice(0, 60), media: found.course.thumbnail })
}
