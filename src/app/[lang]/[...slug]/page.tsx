import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ButtonLink } from '@/components/ButtonLink'
import { GenerativeRangoli } from '@/components/GenerativeRangoli'
import { localePath } from '@/i18n/config'
import { getDictionary, getLocale, type Dictionary } from '@/i18n/dictionaries'
import { whatsappLink } from '@/lib/site'
import en from '@/i18n/messages/en.json'

// ponytail: one "coming soon" page for every section not built yet; each milestone replaces its slug with a real route.
type PageKey = keyof Dictionary['pages']
const PAGES = Object.keys(en.pages) as PageKey[]

export function generateStaticParams() {
  return PAGES.map((key) => ({ slug: key.split('/') }))
}

async function pageKey(params: PageProps<'/[lang]/[...slug]'>['params']): Promise<PageKey> {
  const key = (await params).slug.join('/') as PageKey
  if (!PAGES.includes(key)) notFound()
  return key
}

export async function generateMetadata({ params }: PageProps<'/[lang]/[...slug]'>): Promise<Metadata> {
  const t = await getDictionary()
  // Not indexed until the real page exists.
  return { title: t.pages[await pageKey(params)], robots: { index: false, follow: true } }
}

export default async function ComingSoonPage({ params }: PageProps<'/[lang]/[...slug]'>) {
  const key = await pageKey(params)
  const locale = await getLocale()
  const t = await getDictionary()

  return (
    <section className="bg-paper grain">
      <div className="wrap grid justify-items-center gap-6 py-20 text-center lg:py-28">
        <GenerativeRangoli seed={key} animate className="size-36" />
        <h1 className="font-heading text-h1 lg:text-h1-lg">{t.pages[key]}</h1>
        <p className="font-heading text-h3">{t.comingSoon.title}</p>
        <p className="max-w-[48ch] text-muted">{t.comingSoon.body}</p>
        <div className="grid w-full gap-3 sm:flex sm:w-auto">
          <ButtonLink href={localePath(locale, '/')}>{t.comingSoon.home}</ButtonLink>
          <ButtonLink href={whatsappLink(t.whatsapp.message)} variant="secondary" target="_blank" rel="noopener noreferrer">
            {t.whatsapp.aria}
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}
