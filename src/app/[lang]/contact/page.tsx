import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import type { Metadata } from 'next'
import { Threshold } from '@/components/Art'
import { EnquiryForm } from '@/components/EnquiryForm'
import { Filled } from '@/components/OwnerText'
import { PageHero } from '@/components/PageHero'
import { alternates } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { whatsappLink } from '@/lib/site'
import { getBusiness } from '@/server/content'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.contactPage.metaTitle, description: t.contactPage.metaDesc, alternates: alternates(await getLocale(), '/contact') }
}

export default async function ContactPage() {
  const locale = await getLocale()
  const t = await getDictionary()
  const c = t.contactPage
  const b = await getBusiness()
  const row = 'flex min-h-12 items-center gap-3'

  return (
    <>
      <PageHero floor="leaf" kicker={c.kicker} title={c.title} sub={c.sub} word="संवाद">
        <a
          href={whatsappLink(t.whatsapp.message, b.whatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          className="press inline-flex h-14 items-center justify-center gap-3 rounded-ui border-[1.5px] border-leaf bg-paper px-7 text-h3-sm font-semibold text-leaf hover:bg-white"
        >
          <MessageCircle aria-hidden="true" className="size-7" />
          {c.whatsapp}
        </a>
        <p className="font-semibold text-on/90">{c.reply.replace('{hours}', String(b.replyHours))}</p>
      </PageHero>

      <Threshold />

      <section className="bg-paper py-16 lg:py-24">
        <div className="wrap grid gap-10 lg:grid-cols-12">
          {/* Details first on phones: quick tap-to-call. */}
          <aside className="grid content-start gap-6 rounded-ui bg-surface p-6 shadow-frame lg:order-2 lg:col-span-5 lg:p-8">
            <h2 className="font-heading text-h2">{c.detailsTitle}</h2>
            <ul className="grid gap-2">
              {b.phone && (
                <li>
                  <a href={`tel:${b.phone}`} className={`${row} ink-link font-semibold text-peacock`}>
                    <Phone aria-hidden="true" className="size-6 shrink-0" />
                    {c.call}: {b.phone}
                  </a>
                </li>
              )}
              {b.email && (
                <li>
                  <a href={`mailto:${b.email}`} className={`${row} ink-link font-semibold break-all text-peacock`}>
                    <Mail aria-hidden="true" className="size-6 shrink-0" />
                    {c.email}: {b.email}
                  </a>
                </li>
              )}
              <li className={row}>
                <MapPin aria-hidden="true" className="size-6 shrink-0 text-muted" />
                <span>
                  {c.studio}: <Filled text="{city}" values={b.values} missing={t.missing} />
                </span>
              </li>
            </ul>
            {b.social.length > 0 && (
              <div className="grid gap-2">
                <h3 className="font-semibold">{c.follow}</h3>
                <ul className="flex flex-wrap gap-x-6">
                  {b.social.map((s) => (
                    <li key={s.label}>
                      <a href={s.href} target="_blank" rel="noopener noreferrer" className="ink-link inline-flex min-h-11 items-center font-semibold text-peacock">
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid gap-2 border-t border-border/30 pt-6">
              <h3 className="font-semibold">{c.grievanceTitle}</h3>
              <p className="text-muted">{c.grievanceBody}</p>
              <p>
                <Filled text="{grievanceName}" values={b.values} missing={t.missing} />
                {' · '}
                {b.grievanceEmail ? (
                  <a href={`mailto:${b.grievanceEmail}`} className="ink-link break-all text-peacock">
                    {b.grievanceEmail}
                  </a>
                ) : (
                  <Filled text="{grievanceEmail}" values={b.values} missing={t.missing} />
                )}
              </p>
            </div>
          </aside>

          <div className="grid content-start gap-2 lg:order-1 lg:col-span-7">
            <h2 className="font-heading text-h2">{c.formTitle}</h2>
            <p className="mb-6 text-muted">{c.formSub}</p>
            <EnquiryForm kind="general" locale={locale} t={t.forms} typeLabel={c.typeLabel} />
          </div>
        </div>
      </section>
    </>
  )
}
