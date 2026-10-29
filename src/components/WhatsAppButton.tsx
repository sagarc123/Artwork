'use client'

import { MessageCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { stripLocale } from '@/i18n/config'
import { whatsappLink } from '@/lib/site'

// Pages with their own bottom actions (pay, add to cart) or their own WhatsApp button, where the floating one would cover or repeat them.
const HIDDEN = /^\/(cart|checkout|order|contact)(\/|$)/
// Phones: product and course pages have a sticky buy bar (the sold one is a WhatsApp action itself), and policy and help pages are long text the round button would cover.
// They already hold their own WhatsApp links, so the floating one is left out there (wide screens keep it).
const PHONE_HIDDEN = /^\/(shop\/p\/[^/]+|courses\/[^/]+|policies\/[^/]+|help)\/?$/

/** Floating help button: a round icon above the tab bar on phones, the labelled pill on wide screens. Leaf green keeps white text readable (6.4:1). */
export function WhatsAppButton({ label, aria, message }: { label: string; aria: string; message: string }) {
  const path = stripLocale(usePathname())
  if (HIDDEN.test(path)) return null
  return (
    <a
      href={whatsappLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={aria}
      className={`no-print fixed right-4 z-45 inline-flex size-13 items-center justify-center rounded-full bg-leaf font-semibold text-white shadow-md hover:bg-leaf/90 lg:right-6 lg:bottom-6 lg:w-auto lg:gap-2 lg:px-5 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] ${PHONE_HIDDEN.test(path) ? 'max-lg:hidden' : ''}`}
    >
      <MessageCircle aria-hidden="true" className="size-6" />
      <span className="sr-only lg:not-sr-only">{label}</span>
    </a>
  )
}
