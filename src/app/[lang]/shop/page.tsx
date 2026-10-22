import type { Metadata } from 'next'
import { ShopView } from '@/components/ShopView'
import { alternates } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.shop.metaTitle, description: t.shop.metaDesc, alternates: alternates(await getLocale(), '/shop') }
}

export default async function ShopPage() {
  return <ShopView locale={await getLocale()} t={await getDictionary()} />
}
