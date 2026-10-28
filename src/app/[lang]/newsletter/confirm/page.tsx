import type { Metadata } from 'next'
import { ConfirmNewsletter } from '@/components/ConfirmNewsletter'
import { PageHero } from '@/components/PageHero'
import { localePath } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'

// Per visitor (the signed link is in the address) and never indexed.
export const instant = false

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.newsletter.confirmMeta, robots: { index: false, follow: false } }
}

/** /newsletter/confirm?t=…: the link in the confirm email. */
export default async function ConfirmPage({ searchParams }: PageProps<'/[lang]/newsletter/confirm'>) {
  const { t: raw } = await searchParams
  const token = (Array.isArray(raw) ? raw[0] : raw) ?? ''
  const locale = await getLocale()
  const n = (await getDictionary()).newsletter
  return (
    <>
      <PageHero title={n.confirmTitle} />
      <section className="bg-paper pt-4 pb-20 lg:pt-8 lg:pb-28">
        <div className="wrap grid max-w-xl gap-6">
          <p>{n.confirmBody}</p>
          <ConfirmNewsletter token={token} home={localePath(locale, '/')} t={n} />
        </div>
      </section>
    </>
  )
}
