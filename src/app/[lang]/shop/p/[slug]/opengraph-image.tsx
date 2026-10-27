import { isLocale } from '@/i18n/config'
import { formatPrice } from '@/lib/site'
import { getProduct } from '@/server/content'
import { ogImage, ogSize, ogType } from '@/server/og'

export const alt = 'A piece by Siddesh Mokashi'
export const size = ogSize
export const contentType = ogType

/** The product's first photo with its name and price; the branded card while it has no real photo. */
export default async function Image({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params
  const product = await getProduct(isLocale(lang) ? lang : 'en', slug)
  if (!product) return ogImage({ title: 'Siddesh Mokashi' })
  const media = Array.isArray(product.images) ? product.images[0] : null
  return ogImage({ title: product.title, kicker: formatPrice(Math.min(...product.variants.map((v) => v.price))), media })
}
