import { BookOpen, Home, ShoppingBag, ShoppingCart, User } from 'lucide-react'
import type { Locale } from '@/i18n/config'
import { localePath } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { NavLink } from './NavLink'

/** Phone/tablet bottom navigation: 5 labelled tabs, like the apps people already use. */
export function BottomTabBar({ locale, labels, navLabel }: { locale: Locale; labels: Dictionary['tabs']; navLabel: string }) {
  const tabs = [
    { href: '/', label: labels.home, Icon: Home },
    { href: '/shop', label: labels.shop, Icon: ShoppingBag },
    { href: '/courses', label: labels.learn, Icon: BookOpen },
    { href: '/cart', label: labels.cart, Icon: ShoppingCart },
    { href: '/account', label: labels.me, Icon: User },
  ]
  return (
    <nav
      aria-label={navLabel}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/25 bg-surface pb-[env(safe-area-inset-bottom)] xl:hidden"
    >
      <ul className="grid h-16 grid-cols-5">
        {tabs.map(({ href, label, Icon }) => (
          <li key={href}>
            <NavLink
              href={localePath(locale, href)}
              className="relative flex h-full flex-col items-center justify-center gap-0.5 leading-tight text-muted aria-[current=page]:font-semibold aria-[current=page]:text-peacock aria-[current=page]:before:absolute aria-[current=page]:before:inset-x-4 aria-[current=page]:before:top-0 aria-[current=page]:before:h-[3px] aria-[current=page]:before:rounded-full aria-[current=page]:before:bg-peacock"
            >
              <Icon aria-hidden="true" className="size-6" strokeWidth={1.75} />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
