import { Check, ImageUp, X } from 'lucide-react'
import type { Metadata } from 'next'
import { PortraitPair, StepList, Threshold } from '@/components/Art'
import { BeforeAfter } from '@/components/BeforeAfter'
import { ButtonLink } from '@/components/ButtonLink'
import { EnquiryForm } from '@/components/EnquiryForm'
import { MediaImage } from '@/components/MediaImage'
import { PageHero } from '@/components/PageHero'
import { PhotoStandIn, SketchStandIn } from '@/components/StandIns'
import { Testimonials } from '@/components/Testimonials'
import { alternates } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { PAPER_SIZES, PORTRAIT_MEDIUMS, portraitHints } from '@/lib/prices'
import { formatPrice } from '@/lib/site'
import { getServicePrices, getTestimonials, portraitExamples } from '@/server/content'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.portraitsPage.metaTitle, description: t.portraitsPage.metaDesc, alternates: alternates(await getLocale(), '/custom-portraits') }
}

export default async function CustomPortraitsPage() {
  const locale = await getLocale()
  const t = await getDictionary()
  const p = t.portraitsPage
  const h = t.home.portraits
  const [prices, testimonials] = await Promise.all([getServicePrices(locale), getTestimonials(locale, 'portrait')])
  const pr = prices.portraits
  const examples = portraitExamples(prices)
  const ex = p.examples
  const labels = { before: ex.photo, after: ex.drawing, slider: ex.slider, value: ex.value }
  const rows = PORTRAIT_MEDIUMS.filter((m) => PAPER_SIZES.some((s) => pr?.[m]?.[s]))
  const fromHint = (n: number) => t.forms.fromHint.replace('{price}', formatPrice(n))

  return (
    <>
      <PageHero floor="kumkum" title={h.title} sub={h.sub} word="चित्र" art={<PortraitPair photoLabel={h.photo} drawingLabel={h.drawing} draw />}>
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

      <section className="bg-paper pb-16 lg:pb-24">
        <div className="wrap grid gap-8">
          <div>
            <h2 className="font-heading text-h1">{ex.title}</h2>
            <p className="mt-2 max-w-[60ch] text-muted">{ex.sub}</p>
          </div>
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {(examples.length
              ? examples.map((e, i) => (
                  <li key={e.id} className="grid content-start gap-3">
                    <div className="bg-surface p-2 shadow-frame">
                      <BeforeAfter
                        labels={labels}
                        before={<MediaImage media={e.photo} alt="" ratio="4/5" seed={`ex-photo-${i}`} sizes="(min-width: 1024px) 30vw, 100vw" />}
                        after={<MediaImage media={e.drawing} alt="" ratio="4/5" seed={`ex-drawing-${i}`} sizes="(min-width: 1024px) 30vw, 100vw" />}
                      />
                    </div>
                    {e.caption && <p className="text-muted">{e.caption}</p>}
                  </li>
                ))
              : [
                  <li key="sample" className="grid content-start gap-3 sm:col-span-2 sm:max-w-md lg:col-span-1">
                    <div className="bg-surface p-2 shadow-frame">
                      <BeforeAfter labels={labels} before={<PhotoStandIn seed="portrait-sample" />} after={<div className="size-full bg-paper grain"><SketchStandIn seed="portrait-sample" subject="face" fill /></div>} />
                    </div>
                    <p className="text-muted">{ex.sample}</p>
                  </li>,
                ])}
          </ul>
        </div>
      </section>

      <section className="bg-paper pb-16 lg:pb-24">
        <div className="wrap grid gap-8 lg:grid-cols-12">
          {rows.length > 0 && (
            <div className="grid content-start gap-4 lg:col-span-7">
              <h2 className="font-heading text-h1">{p.prices.title}</h2>
              <div className="overflow-x-auto rounded-ui bg-surface shadow-frame">
                <table className="w-full min-w-[22rem] text-left">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th scope="col" className="p-4 font-semibold">{p.prices.medium}</th>
                      {PAPER_SIZES.map((s) => (
                        <th key={s} scope="col" className="p-4 font-semibold">{s.toUpperCase()}</th>
                      ))}
                      <th scope="col" className="p-4 font-semibold">{p.prices.ready}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((m) => (
                      <tr key={m} className="border-b border-border/20 last:border-0">
                        <th scope="row" className="p-4 font-semibold">{t.forms.mediums[m]}</th>
                        {PAPER_SIZES.map((s) => (
                          <td key={s} className="p-4 whitespace-nowrap">{pr?.[m]?.[s] ? formatPrice(pr[m][s]) : '—'}</td>
                        ))}
                        <td className="p-4 whitespace-nowrap">{pr?.[m]?.days ? p.prices.days.replace('{days}', pr[m].days) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="grid gap-2">
                <li className="text-muted">{p.prices.from}</li>
                {pr?.extraPersonPercent ? <li>{p.prices.extraPerson.replace('{pct}', String(pr.extraPersonPercent))}</li> : null}
                {pr?.advancePercent ? <li>{p.prices.advance.replace('{pct}', String(pr.advancePercent))}</li> : null}
                <li className="font-semibold">{p.prices.changes}</li>
              </ul>
            </div>
          )}
          {/* For the old family photo: a faded or torn print is fine. */}
          <div className={`grid content-start gap-3 self-start rounded-ui border-2 border-peacock bg-surface p-6 ${rows.length ? 'lg:col-span-5 lg:mt-20' : 'lg:col-span-8'}`}>
            <ImageUp aria-hidden="true" className="size-9 text-peacock" />
            <h2 className="font-heading text-h2">{p.oldPhoto.title}</h2>
            <p>{p.oldPhoto.body}</p>
            {rows.length === 0 && <p className="font-semibold">{p.prices.changes}</p>}
          </div>
        </div>
      </section>

      <Testimonials items={testimonials} t={t.testimonials} className="bg-paper grain" />

      <Threshold />

      <section className="bg-paper grain py-16 lg:py-24">
        <div id="enquire" className="wrap scroll-mt-32">
          <div className="mx-auto max-w-3xl rounded-ui bg-surface p-6 shadow-frame lg:p-10">
            <h2 className="font-heading text-h2">{p.formTitle}</h2>
            <p className="mt-2 mb-8 text-muted">{p.formSub}</p>
            <EnquiryForm kind="portrait" locale={locale} t={t.forms} typeLabel={t.nav.portraits} hints={portraitHints(prices, fromHint)} />
          </div>
        </div>
      </section>
    </>
  )
}
