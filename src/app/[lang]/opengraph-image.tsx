import { isLocale } from '@/i18n/config'
import en from '@/i18n/messages/en.json'
import hi from '@/i18n/messages/hi.json'
import mr from '@/i18n/messages/mr.json'
import { ogImage, ogSize, ogType } from '@/server/og'

// Share picture for every page without its own (home, artwork, events…): the branded card.
export const alt = 'Siddesh Mokashi'
export const size = ogSize
export const contentType = ogType

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const t = { en, mr, hi }[isLocale(lang) ? lang : 'en']
  return ogImage({ title: t.meta.title })
}
