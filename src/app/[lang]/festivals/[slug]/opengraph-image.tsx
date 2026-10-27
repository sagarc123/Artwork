import { isLocale } from '@/i18n/config'
import { getFestivals } from '@/server/content'
import { ogImage, ogSize, ogType } from '@/server/og'

export const alt = 'Festival rangoli by Siddesh Mokashi'
export const size = ogSize
export const contentType = ogType

/** The festival's main photo with its name and next date; the branded card while it has no real photo. */
export default async function Image({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params
  const locale = isLocale(lang) ? lang : 'en'
  const festival = (await getFestivals(locale)).find((f) => f.slug === slug)
  if (!festival) return ogImage({ title: 'Siddesh Mokashi' })
  const date = festival.nextDate ? new Intl.DateTimeFormat(`${locale}-IN`, { dateStyle: 'long', timeZone: 'Asia/Kolkata' }).format(new Date(festival.nextDate)) : undefined
  return ogImage({ title: festival.name, kicker: date, media: festival.heroImage })
}
