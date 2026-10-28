'use client'

import { GraduationCap, Home, ShoppingBag, ShoppingCart, User, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { localePath, stripLocale, type Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { site } from '@/lib/site'
import { CartCount } from './CartCount'

// The five tabs from the plan: Home · Shop · Learn · Cart · Me. Five fit at 360px (72px each), so Events (with portraits one tap
// away on that page) and WhatsApp live in the menu and footer instead. Learn and Me show once courses and accounts are live.
const TABS: { href: string; key: 'home' | 'shop' | 'learn' | 'cart' | 'me'; Icon: LucideIcon }[] = [
  { href: '/', key: 'home', Icon: Home },
  { href: '/shop', key: 'shop', Icon: ShoppingBag },
  ...(site.coursesLive ? [{ href: '/courses', key: 'learn' as const, Icon: GraduationCap }] : []),
  { href: '/cart', key: 'cart', Icon: ShoppingCart },
  ...(site.accountsLive ? [{ href: '/account', key: 'me' as const, Icon: User }] : []),
]

const tab = 'relative flex h-full flex-col items-center justify-center gap-0.5 leading-tight'

/** Phone/tablet bottom navigation: 5 labelled tabs. The colour bar slides to the active tab between pages. */
export function BottomTabBar({ locale, labels, navLabel, itemsLabel }: { locale: Locale; labels: Dictionary['tabs']; navLabel: string; itemsLabel: string }) {
  const current = stripLocale(usePathname())
  const under = (href: string) => (href === '/' ? current === '/' : current === href || current.startsWith(`${href}/`))

  return (
    <nav
      aria-label={navLabel}
      style={{ viewTransitionName: 'tabbar' }}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/25 bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto flex h-16 max-w-lg">
        {TABS.map((t) => {
          const { href, key, Icon } = t
          const active = under(href)
          return (
            <li key={href} className="min-w-0 flex-1">
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
      </ul>
    </nav>
  )
}
