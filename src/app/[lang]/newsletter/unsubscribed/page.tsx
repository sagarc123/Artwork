import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHero } from '@/components/PageHero'
import { localePath } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'

export const instant = false

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.newsletter.unsubMeta, robots: { index: false, follow: false } }
}

/** Where the one-click unsubscribe link lands (the unsubscribing itself happens in /api/newsletter/unsubscribe). */
export default async function UnsubscribedPage({ searchParams }: PageProps<'/[lang]/newsletter/unsubscribed'>) {
  const { error } = await searchParams
  const locale = await getLocale()
  const n = (await getDictionary()).newsletter
  return (
    <>
      <PageHero title={error ? n.invalidTitle : n.unsubTitle} />
      <section className="bg-paper pt-4 pb-20 lg:pt-8 lg:pb-28">
        <div className="wrap grid max-w-xl justify-items-start gap-6">
          <p>{error ? n.invalidBody : n.unsubBody}</p>
          <Link href={localePath(locale, '/')} className="ink-link inline-flex min-h-12 items-center font-semibold text-peacock">
            {n.home}
          </Link>
        </div>
      </section>
    </>
  )
}
