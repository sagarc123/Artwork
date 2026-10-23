'use client'

import { MessageCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { stripLocale } from '@/i18n/config'
import { whatsappLink } from '@/lib/site'

// Pages with their own bottom actions (pay, add to cart) or their own WhatsApp button, where the floating one would cover or repeat them.
const HIDDEN = /^\/(cart|checkout|order|shop\/p|contact)(\/|$)/

/** Floating help button on wide screens; phones have WhatsApp in the bottom tab bar. Leaf green keeps white text readable (6.4:1). */
export function WhatsAppButton({ label, aria, message }: { label: string; aria: string; message: string }) {
  if (HIDDEN.test(stripLocale(usePathname()))) return null
  return (
    <a
      href={whatsappLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={aria}
      className="wa-nudge fixed right-6 bottom-6 z-45 hidden h-13 items-center gap-2 rounded-full bg-leaf px-5 font-semibold text-white shadow-md hover:bg-leaf/90 xl:inline-flex"
    >
      <MessageCircle aria-hidden="true" className="size-6" />
      {label}
    </a>
  )
}
