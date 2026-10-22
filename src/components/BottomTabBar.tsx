'use client'

import { BookOpen, Home, ShoppingBag, ShoppingCart, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { localePath, stripLocale, type Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { CartCount } from './CartCount'

const TABS = [
  { href: '/', key: 'home', Icon: Home },
  { href: '/shop', key: 'shop', Icon: ShoppingBag },
  { href: '/courses', key: 'learn', Icon: BookOpen },
  { href: '/cart', key: 'cart', Icon: ShoppingCart },
  { href: '/account', key: 'me', Icon: User },
] as const

/** Phone/tablet bottom navigation: 5 labelled tabs. The colour bar slides to the active tab between pages. */
export function BottomTabBar({ locale, labels, navLabel, itemsLabel }: { locale: Locale; labels: Dictionary['tabs']; navLabel: string; itemsLabel: string }) {
  const current = stripLocale(usePathname())
  const isActive = (href: string) => (href === '/' ? current === '/' : current === href || current.startsWith(`${href}/`))

  return (
    <nav
      aria-label={navLabel}
      style={{ viewTransitionName: 'tabbar' }}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/25 bg-surface pb-[env(safe-area-inset-bottom)] xl:hidden"
    >
      <ul className="grid h-16 grid-cols-5">
        {TABS.map(({ href, key, Icon }) => {
          const active = isActive(href)
          return (
            <li key={href}>
              <Link
                href={localePath(locale, href)}
                aria-current={active ? 'page' : undefined}
                className="relative flex h-full flex-col items-center justify-center gap-0.5 leading-tight text-muted aria-[current=page]:font-semibold aria-[current=page]:text-peacock"
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-4 top-0 h-[3px] rounded-full bg-peacock"
                    style={{ viewTransitionName: 'tab-ink' }}
                  />
                )}
                <span className="relative">
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
