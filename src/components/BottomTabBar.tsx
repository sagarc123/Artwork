'use client'

import { CalendarHeart, Home, MessageCircle, ShoppingBag, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { localePath, stripLocale, type Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { CartCount } from './CartCount'

// "Book" covers both commissions: events, with portraits one tap away on that page.
// ponytail: Learn and Me tabs come back with the courses and accounts (site.coursesLive / accountsLive).
const TABS = [
  { href: '/', key: 'home', Icon: Home },
  { href: '/shop', key: 'shop', Icon: ShoppingBag },
  { href: '/events', key: 'book', Icon: CalendarHeart, also: '/custom-portraits' },
  { href: '/cart', key: 'cart', Icon: ShoppingCart },
] as const

const tab = 'relative flex h-full flex-col items-center justify-center gap-0.5 leading-tight'

/** Phone/tablet bottom navigation: 4 labelled tabs plus WhatsApp. The colour bar slides to the active tab between pages. */
export function BottomTabBar({ locale, labels, navLabel, itemsLabel, whatsappHref }: { locale: Locale; labels: Dictionary['tabs']; navLabel: string; itemsLabel: string; whatsappHref: string }) {
  const current = stripLocale(usePathname())
  const under = (href: string) => (href === '/' ? current === '/' : current === href || current.startsWith(`${href}/`))

  return (
    <nav
      aria-label={navLabel}
      style={{ viewTransitionName: 'tabbar' }}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/25 bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {TABS.map((t) => {
          const { href, key, Icon } = t
          const active = under(href) || ('also' in t && under(t.also))
          return (
            <li key={href}>
              <Link href={localePath(locale, href)} aria-current={active ? 'page' : undefined} className={`${tab} text-muted aria-[current=page]:font-semibold aria-[current=page]:text-peacock`}>
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-4 top-0 h-[3px] rounded-full bg-peacock"
                    style={{ viewTransitionName: 'tab-ink' }}
                  />
                )}
                <span className="relative" data-pinch={key === 'cart' ? 'cart' : undefined}>
                  <Icon aria-hidden="true" className={`size-6 ${active ? 'tab-bloom' : ''}`} strokeWidth={1.75} />
                  {key === 'cart' && <CartCount label={itemsLabel} />}
                </span>
                <span>{labels[key]}</span>
              </Link>
            </li>
          )
        })}
        <li>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={`${tab} font-semibold text-leaf`}>
            <MessageCircle aria-hidden="true" className="size-6" strokeWidth={1.75} />
            <span className="text-base">{labels.whatsapp}</span>
          </a>
        </li>
      </ul>
    </nav>
  )
}
