'use client'

import { MessageCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { stripLocale } from '@/i18n/config'
import { whatsappLink } from '@/lib/site'

// Pages with their own bottom actions (pay, add to cart) or their own WhatsApp button, where the floating one would cover or repeat them.
const HIDDEN = /^\/(cart|checkout|order|contact)(\/|$)/
// Product and course pages have a sticky buy bar on phones: the button stacks above it.
const STACKED = /^\/(shop\/p|courses)\/[^/]+\/?$/

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
      className={`no-print fixed right-4 transition-[bottom] duration-200 z-45 inline-flex size-13 items-center justify-center rounded-full bg-leaf font-semibold text-white shadow-md hover:bg-leaf/90 lg:right-6 lg:bottom-6 lg:w-auto lg:gap-2 lg:px-5 ${STACKED.test(path) ? 'bottom-[calc(8.5rem+env(safe-area-inset-bottom))]' : 'bottom-[calc(4.75rem+env(safe-area-inset-bottom))]'}`}
    >
      <MessageCircle aria-hidden="true" className="size-6" />
      <span className="sr-only lg:not-sr-only">{label}</span>
    </a>
  )
}
