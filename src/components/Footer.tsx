import { MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { localePath, type Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { GA_ID, META_ID } from '@/lib/consent'
import { site, whatsappLink } from '@/lib/site'
import { LanguageSwitcher } from './LanguagePicker'
import { CookieSettingsLink } from './CookieBanner'
import { MotionToggle } from './MotionSettings'
import { NewsletterSignup } from './NewsletterSignup'
import { Signature } from './Signature'
import { getBusiness, getCategories } from '@/server/content'

// Everyday footer: a faint half-plate of jittered dots in the corner (same rim as the logo and plates), decoration only.
const HALF_PLATE = [[12.7,113.8,3.1],[16.2,98.2,3.6],[19.4,85.6,3.7],[23.5,75.6,3.4],[28.5,62.9,3.9],[34.3,56.1,3.1],[42.5,42.4,3.7],[55.3,34.1,3.9],[62.0,29.9,3.8],[77.4,21.1,3.0],[86.6,18.5,3.3],[103.0,14.6,4.1],[116.4,13.8,3.4],[126.3,14.1,3.5],[142.2,15.9,3.7],[149.5,15.8,4.2],[161.5,22.4,3.0],[175.1,29.4,3.0],[187.6,33.6,3.5],[196.2,42.7,3.0],[204.4,54.7,3.8],[212.6,68.0,3.7],[217.5,77.0,3.3],[226.1,90.9,3.1],[228.3,101.8,3.2],[226.0,114.4,3.4],[36.0,112.4,4.0],[38.4,102.9,4.1],[42.8,87.5,3.5],[49.7,73.5,2.9],[57.8,64.6,3.5],[64.3,57.4,3.4],[73.8,49.2,3.0],[90.1,43.5,4.0],[102.2,37.9,3.9],[111.8,35.4,3.5],[125.1,34.3,3.5],[139.2,36.7,3.4],[152.5,44.0,4.1],[161.8,49.2,4.3],[174.2,53.5,4.3],[182.8,67.2,3.0],[190.3,74.9,3.8],[198.1,90.6,3.1],[200.4,101.1,3.0],[204.5,113.7,3.0],[59.5,113.4,4.0],[61.7,100.1,3.1],[68.8,86.7,4.1],[78.7,78.7,3.0],[88.9,70.2,3.8],[98.1,62.9,3.2],[111.4,61.9,3.5],[126.9,60.8,3.1],[140.3,61.7,3.6],[152.4,71.8,4.3],[163.7,78.6,3.6],[172.3,87.3,3.0],[177.0,100.7,3.3],[180.6,114.1,3.0]]

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
      <svg aria-hidden="true" viewBox="0 0 240 120" className="footer-plate look-everyday">
        {HALF_PLATE.map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
        ))}
      </svg>
      {/* Everyday: the reply promise with the one big WhatsApp action. */}
      <div className="look-everyday wrap pt-10 lg:pt-14">
        <div className="footer-ask">
          <p className="font-heading">
            {t.footer.questions} {t.header.replyPromise}
          </p>
          <a href={whatsappLink(t.whatsapp.message)} target="_blank" rel="noopener noreferrer" className="footer-ask-btn">
            <MessageCircle aria-hidden="true" className="size-6" />
            {t.footer.messageMe}
          </a>
        </div>
      </div>
      <div className="wrap grid grid-cols-2 gap-x-6 gap-y-8 py-10 lg:gap-10 lg:py-16 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="col-span-2 grid content-start gap-4 lg:col-span-1">
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

      {/* Hidden on the lesson player and the kids' course pages (they carry data-under18): no marketing for under-18 learners. */}
      <div className="newsletter-signup border-t border-paper/15">
        <div className="wrap grid gap-6 py-8 lg:grid-cols-2 lg:gap-10 lg:py-10">
          <div className="grid content-start gap-2">
            <h2 className="font-heading text-h3-sm">{t.newsletter.title}</h2>
            <p className="max-w-[48ch] text-paper/85">{t.newsletter.body}</p>
          </div>
          <NewsletterSignup locale={locale} t={t.newsletter} />
        </div>
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
            {(GA_ID || META_ID) && <CookieSettingsLink label={t.cookies.settings} />}
            <MotionToggle stopLabel={t.footer.motionStop} startLabel={t.footer.motionStart} />
          </div>
        </div>
      </div>
    </footer>
  )
}
