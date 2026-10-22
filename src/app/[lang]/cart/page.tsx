import type { Metadata } from 'next'
import { CartPage } from '@/components/CartPanels'
import { PageHero } from '@/components/PageHero'
import { localePath } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.cart.title, robots: { index: false, follow: true } }
}

export default async function Cart() {
  const locale = await getLocale()
  const t = await getDictionary()
  return (
    <>
      <PageHero title={t.cart.title} />
      <section className="bg-paper pb-20 lg:pb-28">
        <div className="wrap">
          <CartPage locale={locale} t={t} checkoutHref={localePath(locale, '/checkout')} shopHref={localePath(locale, '/shop')} />
        </div>
      </section>
    </>
  )
}
