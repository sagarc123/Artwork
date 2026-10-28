import Link from 'next/link'
import { localePath, type Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { site, whatsappLink } from '@/lib/site'
import { LanguageSwitcher } from './LanguagePicker'
import { MotionToggle } from './MotionSettings'
import { Signature } from './Signature'
import { getBusiness, getCategories } from '@/server/content'

export async function Footer({ locale, t }: { locale: Locale; t: Dictionary }) {
  const p = (path: string) => localePath(locale, path)
  const [categories, b] = await Promise.all([getCategories(locale, 'shop'), getBusiness()])
  const columns = [
    {
      title: t.footer.shop,
      links: [
        ...(categories.length ? categories.slice(0, 5).map((c) => ({ href: p(`/shop/${c.slug}`), label: c.name })) : [{ href: p('/shop'), label: t.nav.shop }]),
        { href: p('/artwork'), label: t.nav.artwork },
      ],
    },
    {
      title: t.footer.workWithMe,
      links: [
        { href: p('/events'), label: t.nav.events },
        { href: p('/custom-portraits'), label: t.nav.portraits },
        ...(site.coursesLive ? [{ href: p('/courses'), label: t.nav.courses }] : []),
        { href: p('/about'), label: t.nav.about },
      ],
    },
    {
      title: t.footer.help,
      links: [
        { href: p('/track'), label: t.footer.track },
        { href: p('/help'), label: t.nav.help },
        { href: p('/contact'), label: t.nav.contact },
        { href: p('/policies/shipping'), label: t.footer.shipping },
        { href: p('/policies/returns'), label: t.footer.returns },
        { href: p('/policies/privacy'), label: t.footer.privacy },
        { href: p('/policies/terms'), label: t.footer.terms },
      ],
    },
  ]
  const social = [
    { href: site.instagram, label: 'Instagram' },
    { href: site.youtube, label: 'YouTube' },
    { href: site.facebook, label: 'Facebook' },
  ].filter((s) => s.href)

  return (
    <footer className="site-footer bg-charcoal pb-40 text-paper grain-dark lg:pb-20">
      <div aria-hidden="true" className="paithani" />
      <div className="wrap grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="grid content-start gap-4">
          <p className="font-heading text-h2-sm">{t.brand}</p>
          <p className="max-w-[40ch] text-paper/85">{t.footer.brandLine}</p>
          {/* Desktop only: on phones the empty space before it draws in read as a gap. */}
          <div className="max-lg:hidden">
            <Signature draw="scroll" className="text-marigold" />
          </div>
          <ul className="grid gap-2">
            <li>
              <a href={whatsappLink(t.whatsapp.message)} target="_blank" rel="noopener noreferrer" className="footer-link inline-flex min-h-11 items-center">
                {t.footer.whatsapp}
              </a>
            </li>
            {b.phone && (
              <li>
                <a href={`tel:${b.phone}`} className="footer-link inline-flex min-h-11 items-center">
                  {t.footer.call}: {b.phone}
                </a>
              </li>
            )}
            {site.email && (
              <li>
                <a href={`mailto:${site.email}`} className="footer-link inline-flex min-h-11 items-center">
                  {t.footer.email}: {site.email}
                </a>
              </li>
            )}
          </ul>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h2 className="mb-3 font-semibold">{col.title}</h2>
            <ul className="grid gap-1">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="footer-link inline-flex min-h-11 items-center">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-paper/15">
        <div className="wrap grid gap-4 py-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <p>
            <span className="font-semibold">{t.footer.payments}:</span> {t.footer.paymentList}
          </p>
          <div className="flex flex-wrap items-center gap-4 [&_button]:text-paper [&_button:hover]:bg-paper/10 [&_button[aria-pressed=true]]:bg-paper [&_button[aria-pressed=true]]:text-charcoal [&_svg]:text-paper/70">
            {social.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="footer-link inline-flex min-h-11 items-center">
                {s.label}
              </a>
            ))}
            <LanguageSwitcher current={locale} label={t.nav.language} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 lg:col-span-2">
            <p className="text-paper/70">© {t.brand}</p>
            <MotionToggle stopLabel={t.footer.motionStop} startLabel={t.footer.motionStart} />
          </div>
        </div>
      </div>
    </footer>
  )
}
