'use client'

import { ChevronRight, Menu, MessageCircle, Phone, X } from 'lucide-react'
import Link from 'next/link'
import { useRef } from 'react'
import type { Locale } from '@/i18n/config'
import { LanguageSwitcher } from './LanguagePicker'
import { NavLink } from './NavLink'

export type MenuLink = { href: string; label: string; sub?: string }

type Props = {
  locale: Locale
  labels: { menu: string; close: string; language: string; needHelp: string; call: string; mainNav: string }
  featured: MenuLink[]
  links: MenuLink[]
  whatsappHref: string
  phone: string
}

/** Slide-in drawer. Native <dialog> gives Esc-to-close and keeps focus inside while open. */
export function MobileMenu({ locale, labels, featured, links, whatsappHref, phone }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const close = () => ref.current?.close()

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="flex min-h-12 min-w-12 flex-col items-center justify-center leading-tight text-charcoal"
      >
        <Menu aria-hidden="true" className="size-6" />
        <span>{labels.menu}</span>
      </button>

      <dialog
        ref={ref}
        aria-label={labels.menu}
        // Tap on the dark backdrop closes the drawer.
        onClick={(e) => e.target === e.currentTarget && close()}
        className="drawer m-0 h-dvh max-h-dvh w-[88vw] max-w-sm bg-paper p-0 text-charcoal shadow-lg backdrop:bg-charcoal/40"
      >
        <div className="grain flex min-h-full flex-col gap-6 p-5">
          <button type="button" onClick={close} className="ml-auto flex min-h-12 items-center gap-2 rounded-ui px-3 hover:bg-charcoal/5">
            <X aria-hidden="true" className="size-6" />
            {labels.close}
          </button>

          <ul className="grid gap-3">
            {featured.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={close} className="flex items-center justify-between gap-3 rounded-ui bg-surface p-4 shadow-xs">
                  <span>
                    <span className="block font-heading text-h3">{item.label}</span>
                    <span className="text-muted">{item.sub}</span>
                  </span>
                  <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>

          <nav aria-label={labels.mainNav}>
            <ul className="divide-y divide-border/25 border-y border-border/25">
              {links.map((item) => (
                <li key={item.href}>
                  <NavLink
                    href={item.href}
                    onClick={close}
                    className="flex min-h-14 items-center justify-between text-h3-sm aria-[current=page]:font-semibold aria-[current=page]:text-kumkum"
                  >
                    {item.label}
                    <ChevronRight aria-hidden="true" className="size-5 text-muted" />
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <LanguageSwitcher current={locale} label={labels.language} />

          <div className="mt-auto grid gap-3">
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center gap-3 font-semibold text-leaf">
              <MessageCircle aria-hidden="true" className="size-6" />
              {labels.needHelp}
            </a>
            {phone && (
              <a href={`tel:${phone}`} className="flex min-h-12 items-center gap-3 font-semibold text-peacock">
                <Phone aria-hidden="true" className="size-6" />
                {labels.call} · {phone}
              </a>
            )}
          </div>
        </div>
      </dialog>
    </>
  )
}
