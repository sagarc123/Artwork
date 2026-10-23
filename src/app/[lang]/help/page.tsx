import { MessageCircle } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Filled, fillText } from '@/components/OwnerText'
import { PageHero } from '@/components/PageHero'
import { alternates, localePath } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { whatsappLink } from '@/lib/site'
import { getBusiness } from '@/server/content'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.helpPage.metaTitle, description: t.helpPage.metaDesc, alternates: alternates(await getLocale(), '/help') }
}

export default async function HelpPage() {
  const locale = await getLocale()
  const t = await getDictionary()
  const h = t.helpPage
  const b = await getBusiness()

  // FAQ rich results in Google.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: h.groups.flatMap((g) =>
      g.items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: fillText(i.a, b.values) } })),
    ),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <PageHero kicker={h.kicker} title={h.title} sub={h.sub} word="मदत" />

      <section className="bg-paper pb-16 lg:pb-24">
        <div className="wrap grid gap-12 lg:grid-cols-12">
          <div className="grid content-start gap-12 lg:col-span-8">
            {h.groups.map((g) => (
              <div key={g.title} className="grid gap-4">
                <h2 className="font-heading text-h2">{g.title}</h2>
                <div className="divide-y divide-border/30 rounded-ui bg-surface shadow-frame">
                  {g.items.map((i) => (
                    <details key={i.q} className="group">
                      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-h3-sm font-semibold [&::-webkit-details-marker]:hidden">
                        {i.q}
                        <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full border-[1.5px] border-charcoal text-xl leading-none transition-transform group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <p className="max-w-[65ch] px-5 pb-5">
                        <Filled text={i.a} values={b.values} missing={t.missing} />
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <aside className="lg:col-span-4">
            <div className="grid gap-4 rounded-ui bg-leaf p-6 text-paper grain-dark lg:sticky lg:top-32">
              <h2 className="font-heading text-h2">{h.stillTitle}</h2>
              <p>{h.stillBody}</p>
              <a
                href={whatsappLink(t.whatsapp.message, b.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="press inline-flex h-13 items-center justify-center gap-2 rounded-ui bg-paper px-6 font-semibold text-leaf hover:bg-white"
              >
                <MessageCircle aria-hidden="true" className="size-6" />
                {t.contactPage.whatsapp}
              </a>
              <Link href={localePath(locale, '/contact')} className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
                {h.contact} →
              </Link>
              <Link href={localePath(locale, '/track')} className="-mt-3 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
                {t.footer.track} →
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
