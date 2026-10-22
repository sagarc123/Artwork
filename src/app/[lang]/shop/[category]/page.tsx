import type { Metadata } from 'next'
import { ShopView } from '@/components/ShopView'
import { alternates } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { getCategories } from '@/server/content'

export async function generateStaticParams() {
  const slugs = (await getCategories('en', 'shop')).map((c) => c.slug)
  return (slugs.length ? slugs : ['_']).map((category) => ({ category }))
}

export async function generateMetadata({ params }: PageProps<'/[lang]/shop/[category]'>): Promise<Metadata> {
  const { category } = await params
  const locale = await getLocale()
  const name = (await getCategories(locale, 'shop')).find((c) => c.slug === category)?.name
  const t = await getDictionary()
  return { title: name ?? t.shop.metaTitle, description: t.shop.metaDesc, alternates: alternates(locale, `/shop/${category}`) }
}

export default async function ShopCategoryPage({ params }: PageProps<'/[lang]/shop/[category]'>) {
  const { category } = await params
  return <ShopView locale={await getLocale()} t={await getDictionary()} categorySlug={category} />
}
