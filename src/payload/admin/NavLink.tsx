'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

/** A sidebar link for the custom pages (Today, Customers, Festival planner): Payload only marks its own links as current. */
export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const here = usePathname() === href
  return (
    <Link href={href} className="nav__link today-nav" aria-current={here ? 'page' : undefined}>
      {children}
    </Link>
  )
}
