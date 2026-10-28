import type { Metadata } from 'next'
import { CheckoutForm } from '@/components/CartPanels'
import { PageHero } from '@/components/PageHero'
import { localePath } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { getCustomer } from '@/server/customer'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.checkout.title, robots: { index: false, follow: false } }
}

// Courses need the visitor's sign-in, so this is rendered per request.
export const instant = false

export default async function Checkout() {
  const locale = await getLocale()
  const t = await getDictionary()
  const customer = await getCustomer()
  return (
    <>
      <PageHero title={t.checkout.title} />
      <section className="bg-paper pt-4 pb-20 lg:pt-8 lg:pb-28">
        <div className="wrap">
          <CheckoutForm locale={locale} t={t} orderPath={localePath(locale, '/order')} cartHref={localePath(locale, '/cart')} me={customer && { name: customer.name, phone: customer.phone }} />
        </div>
      </section>
    </>
  )
}
