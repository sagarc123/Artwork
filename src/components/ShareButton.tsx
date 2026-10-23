'use client'

import { Share2 } from 'lucide-react'
import { whatsappLink } from '@/lib/site'

/** "Share with family": the phone's own share sheet, or WhatsApp where there is none (most desktops). */
export function ShareButton({ label, text, links, className = '' }: { label: string; text: string; links: { title: string; href: string }[]; className?: string }) {
  async function share() {
    const full = links.map((l) => ({ ...l, url: new URL(l.href, location.origin).toString() }))
    const message = [text, ...full.map((l) => `• ${l.title} — ${l.url}`)].join('\n')
    if (navigator.share) {
      try {
        // One piece: the sheet gets its link as a real URL (WhatsApp shows a preview).
        return await navigator.share(full.length === 1 ? { title: full[0].title, text, url: full[0].url } : { text: message })
      } catch (error) {
        if ((error as Error).name === 'AbortError') return // closed the sheet
      }
    }
    window.open(whatsappLink(message, ''), '_blank', 'noopener')
  }

  return (
    <button
      type="button"
      onClick={share}
      className={`press inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-[1.5px] border-charcoal bg-surface px-4 font-semibold text-charcoal hover:bg-charcoal hover:text-paper ${className}`}
    >
      <Share2 aria-hidden="true" className="size-5" />
      {label}
    </button>
  )
}
