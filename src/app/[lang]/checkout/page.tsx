import type { Metadata } from 'next'
import { CheckoutForm } from '@/components/CartPanels'
import { PageHero } from '@/components/PageHero'
import { localePath } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.checkout.title, robots: { index: false, follow: false } }
}

export default async function Checkout() {
  const locale = await getLocale()
  const t = await getDictionary()
  return (
    <>
      <PageHero title={t.checkout.title} />
      <section className="bg-paper pb-20 lg:pb-28">
        <div className="wrap">
          <CheckoutForm locale={locale} t={t} orderPath={localePath(locale, '/order')} cartHref={localePath(locale, '/cart')} />
        </div>
      </section>
    </>
  )
}
