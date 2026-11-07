'use client'

import { MessageCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { stripLocale } from '@/i18n/config'
import { whatsappLink } from '@/lib/site'

// Pages with their own bottom actions (pay, add to cart) or their own WhatsApp button, where the floating one would cover or repeat them.
const HIDDEN = /^\/(cart|checkout|order|contact)(\/|$)/
// Phones: product and course pages have a sticky buy bar (the sold one is a WhatsApp action itself), and policy and help pages are long text the round button would cover.
// They already hold their own WhatsApp links, so the floating one is left out there (wide screens keep it).
const PHONE_HIDDEN = /^\/(shop\/p\/[^/]+|courses\/[^/]+|policies\/[^/]+|help)\/?$/

// Things the round phone button must never cover: a control or a line of text. Images, backgrounds and empty page are fine.
const CONTROLS = 'a,button,input,select,textarea,label,summary'
// Where it must step aside altogether: the home hero and every other WhatsApp action on the page.
const CTAS = '.ws-hero, a[href*="wa.me"], a[href*="whatsapp.com"]'

/**
 * Phones: the round button hides while the hero or another WhatsApp action is on screen, and whenever text or a control sits under it
 * (checked at five points of its box when scrolling stops, and after the page changes). Wide screens keep the labelled pill as it was.
 */
function useStepAside(ref: React.RefObject<HTMLAnchorElement | null>, path: string) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const phone = matchMedia('(max-width: 1023px)')
    const inView = new Set<Element>()
    const io = new IntersectionObserver((list) => {
      list.forEach((e) => (e.isIntersecting ? inView.add(e.target) : inView.delete(e.target)))
      decide()
    })
    const watched = new Set<Element>()
    const watch = () => document.querySelectorAll(CTAS).forEach((c) => c !== el && !watched.has(c) && (watched.add(c), io.observe(c)))
    // Text or a control under the button's box (a few pixels of margin): controls by their boxes, text by the lines it really occupies.
    function covering() {
      const b = el!.getBoundingClientRect()
      const hit = (r: DOMRect) => r.width > 1 && r.height > 1 && Math.min(r.right, b.right + 4) - Math.max(r.left, b.left - 4) > 0 && Math.min(r.bottom, b.bottom + 4) - Math.max(r.top, b.top - 4) > 0
      for (const c of document.querySelectorAll(CONTROLS)) if (c !== el && !c.closest('.sr-only') && hit(c.getBoundingClientRect())) return true
      const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      const range = document.createRange()
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        const p = n.parentElement
        if (!p || !n.nodeValue?.trim() || el!.contains(p) || !hit(p.getBoundingClientRect()) || p.closest('script,style,noscript,.sr-only,svg')) continue
        range.selectNodeContents(n)
        for (const r of range.getClientRects()) if (hit(r)) return true
      }
      return false
    }
    function decide() {
      // Phones also step aside for the hero and other WhatsApp actions; the wide pill only for text or a control under it.
      const away = phone.matches ? inView.size > 0 || covering() : covering()
      if (away) el!.dataset.away = ''
      else delete el!.dataset.away
    }
    let t = 0
    const later = (ms: number) => {
      clearTimeout(t)
      t = window.setTimeout(decide, ms)
    }
    // Out of the way the moment scrolling starts (nothing can pass under it), back once it settles clear.
    const onScroll = () => {
      el!.dataset.away = ''
      later(140)
    }
    const mo = new MutationObserver(() => {
      watch()
      later(200)
    })
    watch()
    decide()
    mo.observe(document.body, { childList: true, subtree: true })
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    return () => {
      clearTimeout(t)
      io.disconnect()
      mo.disconnect()
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', onScroll)
    }
  }, [ref, path])
}

/** Floating help button: a round icon above the tab bar on phones, the labelled pill on wide screens. Leaf green keeps white text readable (6.4:1). */
export function WhatsAppButton({ label, aria, message }: { label: string; aria: string; message: string }) {
  const path = stripLocale(usePathname())
  const ref = useRef<HTMLAnchorElement>(null)
  const hidden = HIDDEN.test(path)
  useStepAside(ref, hidden ? '' : path)
  if (hidden) return null
  return (
    <a
      ref={ref}
      href={whatsappLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={aria}
      className={`wa-float no-print fixed right-4 z-45 inline-flex size-13 items-center justify-center rounded-full bg-leaf font-semibold text-white shadow-md hover:bg-leaf/90 lg:right-6 lg:bottom-6 lg:w-auto lg:gap-2 lg:px-5 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] ${PHONE_HIDDEN.test(path) ? 'max-lg:hidden' : ''}`}
    >
      <MessageCircle aria-hidden="true" className="size-6" />
      <span className="sr-only lg:not-sr-only">{label}</span>
    </a>
  )
}
