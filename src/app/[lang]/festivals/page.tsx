import type { Metadata } from 'next'
import Link from 'next/link'
import { FestivalMotif } from '@/components/Art'
import { PageHero } from '@/components/PageHero'
import { alternates, localePath } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { festivalLook, getFestivals } from '@/server/content'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.festivalsPage.metaTitle, description: t.festivalsPage.metaDesc, alternates: alternates(await getLocale(), '/festivals') }
}

export default async function FestivalsPage() {
  const locale = await getLocale()
  const t = await getDictionary()
  const festivals = await getFestivals(locale)

  return (
    <>
      <PageHero title={t.festivalsPage.title} sub={t.festivalsPage.intro} word="सण" />
      <section className="bg-paper pb-20 lg:pb-28">
        <div className="wrap">
          {festivals.length === 0 ? (
            <p className="rounded-ui bg-surface p-8 text-center text-muted">{t.festivalsPage.empty}</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {festivals.map((f) => {
                const look = festivalLook(f.slug)
                return (
                  <li key={f.id}>
                    <Link
                      href={localePath(locale, `/festivals/${f.slug}`)}
                      className={`card group relative flex min-h-64 flex-col justify-end overflow-hidden rounded-ui p-5 text-paper grain-dark ${look.floor}`}
                    >
                      <FestivalMotif kind={look.kind} live="scroll" className="absolute -top-2 -right-4 w-40 opacity-90 transition-transform duration-500 group-hover:scale-105" />
                      <span className="relative font-heading text-h2">{f.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  )
}
