import { Heart, Search, ShoppingCart, User } from 'lucide-react'
import Link from 'next/link'
import { localePath, type Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { site, whatsappLink } from '@/lib/site'
import { LanguageSwitcher } from './LanguagePicker'
import { MobileMenu } from './MobileMenu'
import { NavLink } from './NavLink'
import { CartCount } from './CartCount'
import { GenerativeRangoli } from './GenerativeRangoli'

const iconLink = 'flex min-h-12 min-w-14 flex-col items-center justify-center leading-tight text-charcoal hover:text-kumkum'

function Logo({ locale }: { locale: Locale }) {
  return (
    <Link href={localePath(locale, '/')} className="flex min-h-12 items-center gap-2" aria-label={`${site.brandName} — home`}>
      <GenerativeRangoli seed="siddesh-logo" className="size-9 shrink-0" />
      <span className="font-heading text-[1.375rem] leading-none whitespace-nowrap xl:text-[1.625rem]">{site.brandName}</span>
    </Link>
  )
}

export function Header({ locale, t }: { locale: Locale; t: Dictionary }) {
  const p = (path: string) => localePath(locale, path)
  const commissions = [
    { href: p('/events'), label: t.nav.events, sub: t.menu.eventsSub },
    { href: p('/custom-portraits'), label: t.nav.portraits, sub: t.menu.portraitsSub },
  ]
  const sections = [
    { href: p('/shop'), label: t.nav.shop },
    { href: p('/artwork'), label: t.nav.artwork },
    { href: p('/courses'), label: t.nav.courses },
    { href: p('/about'), label: t.nav.about },
  ]
  const navClass =
    'py-2 font-medium whitespace-nowrap hover:text-kumkum aria-[current=page]:text-kumkum aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8'

  return (
    <header className="sticky top-0 z-30 border-b border-border/25 bg-paper/95 backdrop-blur" style={{ viewTransitionName: 'site-header' }}>
      {/* Desktop utility row */}
      <div className="hidden border-b border-border/20 xl:block">
        <div className="wrap flex h-11 items-center justify-between text-muted">
          <LanguageSwitcher current={locale} label={t.nav.language} />
          <a href={whatsappLink(t.whatsapp.message)} target="_blank" rel="noopener noreferrer" className="hover:text-leaf">
            {t.header.replyPromise}
          </a>
          <Link href={p('/contact')} className="hover:text-charcoal">
            {t.nav.contact}
          </Link>
        </div>
      </div>

      {/* Desktop main row */}
      <div className="wrap hidden h-20 items-center justify-between gap-6 xl:flex">
        <Logo locale={locale} />
        <nav aria-label={t.nav.mainNav}>
          <ul className="flex items-center gap-6">
            {commissions.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href} className={navClass}>
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li aria-hidden="true" className="h-6 w-px bg-border/40" />
            {/* ponytail: plain links; add the Shop/Artwork dropdowns when categories exist (milestone 7). */}
            {sections.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href} className={navClass}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1">
          <Link href={p('/search')} className={iconLink}>
            <Search aria-hidden="true" className="size-6" />
            {t.nav.search}
          </Link>
          <Link href={p('/wishlist')} className={iconLink}>
            <Heart aria-hidden="true" className="size-6" />
            {t.nav.saved}
          </Link>
          <Link href={p('/account')} className={iconLink}>
            <User aria-hidden="true" className="size-6" />
            {t.nav.me}
          </Link>
          <Link href={p('/cart')} className={`relative ${iconLink}`}>
            <CartCount />
            <ShoppingCart aria-hidden="true" className="size-6" />
            {t.nav.cart}
          </Link>
        </div>
      </div>

      {/* Phone/tablet row: menu · logo · search (cart lives in the bottom tab bar) */}
      <div className="wrap grid h-16 grid-cols-[auto_1fr_auto] items-center gap-2 xl:hidden">
        <MobileMenu
          locale={locale}
          labels={{ ...t.nav, needHelp: t.menu.needHelp, call: t.menu.call }}
          featured={commissions}
          links={[{ href: p('/'), label: t.nav.home }, ...sections, { href: p('/help'), label: t.nav.help }, { href: p('/contact'), label: t.nav.contact }]}
          whatsappHref={whatsappLink(t.whatsapp.message)}
          phone={site.phone}
        />
        <div className="flex justify-center">
          <Logo locale={locale} />
        </div>
        <Link href={p('/search')} className={iconLink}>
          <Search aria-hidden="true" className="size-6" />
          {t.nav.search}
        </Link>
      </div>
    </header>
  )
}
