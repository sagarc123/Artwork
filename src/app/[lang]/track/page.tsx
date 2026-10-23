import type { Metadata } from 'next'
import { PageHero } from '@/components/PageHero'
import { TrackForm } from '@/components/TrackForm'
import { alternates } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { whatsappLink } from '@/lib/site'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.trackPage.metaTitle, robots: { index: false, follow: true }, alternates: alternates(await getLocale(), '/track') }
}

/** Order lookup for buyers without the order link to hand. */
export default async function TrackPage() {
  const locale = await getLocale()
  const t = await getDictionary()
  return (
    <>
      <PageHero title={t.trackPage.title} sub={t.trackPage.sub} word="पार्सल" />
      <section className="bg-paper pb-20 lg:pb-28">
        <div className="wrap">
          <div className="grid max-w-xl gap-6 rounded-ui bg-surface p-6 shadow-frame lg:p-10">
            <TrackForm locale={locale} t={t.trackPage} forms={t.forms} />
            <a href={whatsappLink(t.whatsapp.message)} target="_blank" rel="noopener noreferrer" className="ink-link inline-flex min-h-11 items-center justify-self-start font-semibold text-leaf">
              {t.order.whatsapp}
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
