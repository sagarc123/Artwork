'use client'

import { MessageCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { stripLocale } from '@/i18n/config'
import { whatsappLink } from '@/lib/site'

// Pages with their own bottom actions (pay, add to cart) where the floating button would cover them.
const HIDDEN = /^\/(cart|checkout|order|shop\/p)(\/|$)/

/** Floating help button. Sits above the mobile tab bar. Leaf green keeps white text readable (6.4:1). */
export function WhatsAppButton({ label, aria, message }: { label: string; aria: string; message: string }) {
  if (HIDDEN.test(stripLocale(usePathname()))) return null
  return (
    <a
      href={whatsappLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={aria}
      className="wa-nudge fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-45 inline-flex h-13 items-center gap-2 rounded-full bg-leaf px-5 font-semibold text-white shadow-md hover:bg-leaf/90 xl:right-6 xl:bottom-6"
    >
      <MessageCircle aria-hidden="true" className="size-6" />
      {label}
    </a>
  )
}
