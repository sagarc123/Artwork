import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/LoginForm'
import { PageHero } from '@/components/PageHero'
import { alternates, localePath, stripLocale } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { safeNext } from '@/lib/auth'
import { getCustomer } from '@/server/customer'

// Reads the visitor's session and ?next=, so it renders per request.
export const instant = false

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.login.metaTitle, robots: { index: false, follow: false }, alternates: alternates(await getLocale(), '/login') }
}

/** Phone OTP sign-in. The same steps create the account the first time. */
export default async function LoginPage({ searchParams }: PageProps<'/[lang]/login'>) {
  const locale = await getLocale()
  const t = await getDictionary()
  const { next } = await searchParams
  // A path on this site only (never another site), without the language prefix; the form adds the prefix back.
  const to = stripLocale(safeNext(Array.isArray(next) ? next[0] : next))
  if (await getCustomer()) redirect(localePath(locale, to))
  return (
    <>
      <PageHero title={t.login.title} sub={t.login.sub} />
      <section className="bg-paper pt-4 pb-20 lg:pt-8 lg:pb-28">
        <div className="wrap">
          <div className="mx-auto max-w-md rounded-ui bg-surface p-6 shadow-frame lg:p-8">
            <LoginForm locale={locale} t={t.login} next={to} />
          </div>
        </div>
      </section>
    </>
  )
}
