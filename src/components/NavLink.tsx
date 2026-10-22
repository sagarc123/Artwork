'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentProps } from 'react'
import { stripLocale } from '@/i18n/config'

/** Link that marks itself `aria-current="page"` (style with `aria-[current=page]:`). */
export function NavLink({ href, ...props }: ComponentProps<typeof Link> & { href: string }) {
  const current = stripLocale(usePathname())
  const target = stripLocale(href)
  const active = target === '/' ? current === '/' : current === target || current.startsWith(`${target}/`)
  return <Link href={href} aria-current={active ? 'page' : undefined} {...props} />
}
