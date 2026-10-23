import { Check, X } from 'lucide-react'
import type { Metadata } from 'next'
import { PortraitPair, StepList, Threshold } from '@/components/Art'
import { ButtonLink } from '@/components/ButtonLink'
import { EnquiryForm } from '@/components/EnquiryForm'
import { PageHero } from '@/components/PageHero'
import { alternates } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.portraitsPage.metaTitle, description: t.portraitsPage.metaDesc, alternates: alternates(await getLocale(), '/custom-portraits') }
}

export default async function CustomPortraitsPage() {
  const locale = await getLocale()
  const t = await getDictionary()
  const p = t.portraitsPage
  const h = t.home.portraits

  return (
    <>
      <PageHero floor="kumkum" title={h.title} sub={h.sub} word="चित्र" art={<PortraitPair photoLabel={h.photo} drawingLabel={h.drawing} />}>
        <ButtonLink href="#enquire" variant="light">
          {h.cta}
        </ButtonLink>
      </PageHero>

      <Threshold />

      <section className="bg-paper py-16 lg:py-24">
        <div className="wrap grid gap-12 lg:grid-cols-2">
          <div className="grid content-start gap-6">
            <h2 className="font-heading text-h1">{p.stepsTitle}</h2>
            <StepList steps={p.steps} />
          </div>
          <div className="grid content-start gap-6">
            <h2 className="font-heading text-h1">{p.tipsTitle}</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-ui border-2 border-leaf bg-surface p-5">
                <p className="mb-3 font-semibold text-leaf">{p.good}</p>
                <ul className="grid gap-2">
                  {p.tipsGood.map((tip) => (
                    <li key={tip} className="flex gap-2">
                      <Check aria-hidden="true" className="mt-1 size-5 shrink-0 text-leaf" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-ui border-2 border-kumkum bg-surface p-5">
                <p className="mb-3 font-semibold text-kumkum">{p.bad}</p>
                <ul className="grid gap-2">
                  {p.tipsBad.map((tip) => (
                    <li key={tip} className="flex gap-2">
                      <X aria-hidden="true" className="mt-1 size-5 shrink-0 text-kumkum" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Threshold />

      <section className="bg-paper grain py-16 lg:py-24">
        <div id="enquire" className="wrap scroll-mt-32">
          <div className="mx-auto max-w-3xl rounded-ui bg-surface p-6 shadow-frame lg:p-10">
            <h2 className="font-heading text-h2">{p.formTitle}</h2>
            <p className="mt-2 mb-8 text-muted">{p.formSub}</p>
            <EnquiryForm kind="portrait" locale={locale} t={t.forms} typeLabel={t.nav.portraits} />
          </div>
        </div>
      </section>
    </>
  )
}
