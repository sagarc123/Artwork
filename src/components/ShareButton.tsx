'use client'

import { Share2 } from 'lucide-react'
import { whatsappLink } from '@/lib/site'

/** The photo as a file for the share sheet, or null (offline, too slow, not an image). */
async function photoFile(src: string, title: string) {
  try {
    const res = await fetch(src, { signal: AbortSignal.timeout(4000) })
    const blob = await res.blob()
    if (!res.ok || !blob.type.startsWith('image/')) return null
    return new File([blob], `${title.replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40) || 'photo'}.${blob.type.split('/')[1] || 'jpg'}`, { type: blob.type })
  } catch {
    return null
  }
}

/**
 * "Share with family": the phone's own share sheet, or WhatsApp where there is none (most desktops).
 * An empty href shares the page you are on. `image` (a real photo, never a code-drawn stand-in) goes along as a file where the phone allows it.
 */
export function ShareButton({ label, text, links, image, className = '' }: { label: string; text: string; links: { title: string; href: string }[]; image?: string | null; className?: string }) {
  async function share() {
    const full = links.map((l) => ({ ...l, url: new URL(l.href || location.href, location.origin).toString() }))
    const message = [text, ...full.map((l) => `• ${l.title} — ${l.url}`)].join('\n')
    if (navigator.share) {
      // One piece: the sheet gets its link as a real URL (WhatsApp shows a preview).
      const data: ShareData = full.length === 1 ? { title: full[0].title, text, url: full[0].url } : { text: message }
      const file = image && full.length === 1 ? await photoFile(image, full[0].title) : null
      for (const attempt of file && navigator.canShare?.({ files: [file] }) ? [{ ...data, files: [file] }, data] : [data]) {
        try {
          return await navigator.share(attempt)
        } catch (error) {
          if ((error as Error).name === 'AbortError') return // closed the sheet
          // Otherwise try once more without the photo (some apps refuse files), then WhatsApp.
        }
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
