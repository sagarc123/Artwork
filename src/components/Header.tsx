import { Heart, Search, ShoppingCart, User } from 'lucide-react'
import Link from 'next/link'
import { localePath, type Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { site, whatsappLink } from '@/lib/site'
import { LanguageLinks, LanguageSwitcher } from './LanguagePicker'
import { MobileMenu } from './MobileMenu'
import { NavLink } from './NavLink'
import { CartCount } from './CartCount'
import { SavedCount } from './SavedCount'
import { BrandMark } from './Art'
import { getBusiness, getSiteExtras } from '@/server/content'
import { hashString } from '@/lib/seed'
import { AnnouncementClose } from './AnnouncementClose'

const iconLink = 'flex min-h-12 min-w-14 flex-col items-center justify-center leading-tight text-charcoal hover:text-kumkum'

function Logo({ locale, brand }: { locale: Locale; brand: string }) {
  return (
    <Link href={localePath(locale, '/')} className="flex min-h-12 items-center gap-2" aria-label={`${brand} — home`}>
      <BrandMark className="size-8 shrink-0 min-[360px]:size-9" />
      <span className="font-heading text-[1.125rem] leading-[1.1] lg:whitespace-nowrap min-[375px]:text-[1.375rem] xl:text-[1.625rem]">{brand}</span>
    </Link>
  )
}

export async function Header({ locale, t }: { locale: Locale; t: Dictionary }) {
  const p = (path: string) => localePath(locale, path)
  const [{ phone }, { announcement }] = await Promise.all([getBusiness(), getSiteExtras(locale)])
  // Closed strips stay closed for the visit: the head script copies the closed strip's id onto <html> before first paint.
  const ann = announcement && { ...announcement, id: `a${hashString(announcement.message + announcement.href).toString(36)}`, external: announcement.href?.startsWith('https://') }
  const annText = ann && (ann.href ? (
    <a href={ann.href} {...(ann.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="underline decoration-marigold decoration-2 underline-offset-4 hover:decoration-current">
      {ann.message}
    </a>
  ) : (
    <span>{ann.message}</span>
  ))
  const reply = (
    <a href={whatsappLink(t.whatsapp.message)} target="_blank" rel="noopener noreferrer" className="hover:text-leaf">
      {t.header.replyPromise}
    </a>
  )
  const commissions = [
    { href: p('/events'), label: t.nav.events, sub: t.menu.eventsSub },
    { href: p('/custom-portraits'), label: t.nav.portraits, sub: t.menu.portraitsSub },
  ]
  const sections = [
    { href: p('/shop'), label: t.nav.shop },
    { href: p('/artwork'), label: t.nav.artwork },
    ...(site.coursesLive ? [{ href: p('/courses'), label: t.nav.courses }] : []),
    { href: p('/about'), label: t.nav.about },
  ]
  const navClass =
    'py-2 font-medium whitespace-nowrap hover:text-kumkum aria-[current=page]:text-kumkum aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8'

  return (
    <header className="site-header sticky top-0 z-30 border-b border-border/25 bg-paper/95 backdrop-blur" style={{ viewTransitionName: 'site-header' }}>
      {ann && <style>{`html[data-ann-off="${ann.id}"] .ann,html:not([data-ann-off="${ann.id}"]) .ann-alt{display:none}`}</style>}
      {/* Phones and tablets: language links on a slim row (the desktop bar's twin), then the announcement. */}
      <div className="border-b border-border/20 lg:hidden">
        <div className="wrap">
          <LanguageLinks current={locale} label={t.nav.language} />
        </div>
      </div>
      {/* Phones and tablets: the announcement as a slim line above the menu (at most 44px). */}
      {ann && (
        <div role="region" aria-label={t.header.announceLabel} className="ann bg-charcoal text-paper lg:hidden">
          <div className="wrap flex h-11 items-center justify-between gap-2 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center">
            <p className="line-clamp-2 text-[0.9375rem] leading-tight font-semibold">{annText}</p>
            <AnnouncementClose id={ann.id} label={t.header.announceClose} className="-mr-2 text-paper/85 hover:text-paper" />
          </div>
        </div>
      )}
      {/* Desktop utility row */}
      <div className="hidden border-b border-border/20 lg:block">
        <div className="wrap flex h-12 items-center justify-between gap-6 text-muted [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center">
          <LanguageSwitcher current={locale} label={t.nav.language} />
          {ann ? (
            <>
              <div role="region" aria-label={t.header.announceLabel} className="ann flex min-w-0 items-center gap-3 font-semibold text-charcoal">
                <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-kumkum" />
                <p className="truncate">{annText}</p>
                <AnnouncementClose id={ann.id} label={t.header.announceClose} className="font-normal text-muted hover:text-charcoal" />
              </div>
              <span className="ann-alt">{reply}</span>
            </>
          ) : (
            reply
          )}
          <Link href={p('/contact')} className="hover:text-charcoal">
            {t.nav.contact}
          </Link>
        </div>
      </div>

      {/* Desktop main row */}
      <div className="wrap hidden h-20 items-center justify-between gap-4 lg:flex xl:gap-6">
        <Logo locale={locale} brand={t.brand} />
        <nav aria-label={t.nav.mainNav}>
          <ul className="flex items-center gap-4 xl:gap-6">
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
        <div className="flex items-center">
          <Link href={p('/search')} className={iconLink}>
            <Search aria-hidden="true" className="size-6" />
            {t.nav.search}
          </Link>
          <Link href={p('/wishlist')} data-pinch="saved" className={`relative ${iconLink}`}>
            <SavedCount label={t.savedPage.count} />
            <Heart aria-hidden="true" className="size-6" />
            {t.nav.saved}
          </Link>
          {site.accountsLive && (
            <Link href={p('/account')} className={iconLink}>
              <User aria-hidden="true" className="size-6" />
              {t.nav.me}
            </Link>
          )}
          <Link href={p('/cart')} data-pinch="cart" className={`relative ${iconLink}`}>
            <CartCount label={t.cart.items} />
            <ShoppingCart aria-hidden="true" className="size-6" />
            {t.nav.cart}
          </Link>
        </div>
      </div>

      {/* Phone/tablet row: menu · logo · search (cart lives in the bottom tab bar) */}
      <div className="wrap grid h-16 grid-cols-[auto_1fr_auto] items-center gap-2 lg:hidden">
        <MobileMenu
          locale={locale}
          labels={{ ...t.nav, needHelp: t.menu.needHelp, call: t.menu.call }}
          featured={commissions}
          links={[{ href: p('/'), label: t.nav.home }, ...sections, { href: p('/wishlist'), label: t.nav.saved }, { href: p('/help'), label: t.nav.help }, { href: p('/contact'), label: t.nav.contact }]}
          whatsappHref={whatsappLink(t.whatsapp.message)}
          phone={phone}
        />
        <div className="flex min-w-0 justify-center">
          <Logo locale={locale} brand={t.brand} />
        </div>
        <Link href={p('/search')} className={iconLink}>
          <Search aria-hidden="true" className="size-6" />
          {t.nav.search}
        </Link>
      </div>
    </header>
  )
}
