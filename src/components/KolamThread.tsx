'use client'

import { useEffect } from 'react'
import { kolamPath, type Box } from '@/lib/kolam'

// The kolam thread, everyday home only: one line down the right-hand gutter that loops beside each section heading and ends as a ring around the
// footer's WhatsApp button. It draws as you scroll (stroke-dashoffset, one rAF per scroll burst). The shape comes from lib/kolam.ts, which is given
// the boxes of everything on the page and stays clear of them; it is measured again on resize, after fonts and when the page grows (debounced).
// Phones get a slim wavy edge line. "Stop animations", reduced motion and slow phones: drawn in full and still.

/** Boxes of everything with content, in page coordinates: lines of text, controls and pictures. */
function contentBoxes(top: number): Box[] {
  const out: Box[] = []
  const sx = scrollX
  const sy = scrollY
  const push = (r: DOMRect) => {
    if (r.width > 1 && r.height > 1 && r.bottom + sy > top) out.push({ l: r.left + sx, r: r.right + sx, t: r.top + sy, b: r.bottom + sy })
  }
  const skip = (e: Element) => {
    for (let p: Element | null = e; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p)
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed' || cs.position === 'sticky') return true
    }
    return !!e.closest('script,style,noscript,.sr-only,.kolam-thread')
  }
  const range = document.createRange()
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    const p = n.parentElement
    if (!p || !n.nodeValue?.trim() || skip(p)) continue
    range.selectNodeContents(n)
    for (const r of range.getClientRects()) push(r)
  }
  document.querySelectorAll('a,button,input,select,textarea,img,video,iframe,[role=img],.thali,.shape,.rim-badge,.price-pill').forEach((e) => {
    if (!skip(e)) push(e.getBoundingClientRect())
  })
  return out
}

export function KolamThread() {
  useEffect(() => {
    const root = document.documentElement
    const hero = document.querySelector<HTMLElement>('.ws-hero')
    if (!hero || hero.getClientRects().length === 0) return
    const calm = () => root.dataset.motion === 'off' || root.dataset.fx === 'lite' || matchMedia('(prefers-reduced-motion: reduce)').matches
    const NS = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(NS, 'svg')
    svg.setAttribute('class', 'kolam-thread no-print')
    svg.setAttribute('aria-hidden', 'true')
    svg.setAttribute('focusable', 'false')
    const path = document.createElementNS(NS, 'path')
    svg.append(path)
    document.body.append(svg)

    let length = 0
    let y0 = 0
    let y1 = 1
    let docH = 0
    let raf = 0
    let shown = -1
    const draw = () => {
      raf = 0
      if (!length) return
      let k = 1
      if (!calm()) {
        k = Math.max(0, Math.min(1, (scrollY + innerHeight * 0.75 - y0) / (y1 - y0)))
        if (scrollY + innerHeight >= docH - 6) k = 1
      }
      const off = Math.round(length * (1 - k))
      if (off !== shown) {
        shown = off
        path.style.strokeDashoffset = String(off)
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(draw)
    }

    const measure = () => {
      const W = root.clientWidth
      docH = root.scrollHeight
      const slim = W < 640
      y0 = hero.getBoundingClientRect().bottom + scrollY + 10
      const btn = document.querySelector<HTMLElement>('.footer-ask-btn')
      const br = btn && btn.getClientRects().length ? btn.getBoundingClientRect() : null
      const ring = br ? { l: br.left + scrollX, r: br.right + scrollX, t: br.top + scrollY, b: br.bottom + scrollY } : null
      const marks = [...document.querySelectorAll<HTMLElement>('main h2')].filter((h) => h.getClientRects().length).map((h) => {
        const r = h.getBoundingClientRect()
        return r.top + scrollY + r.height / 2
      })
      // The content column's right edge: the furthest any visible .wrap reaches once its own padding is taken off.
      let floor = 0
      document.querySelectorAll<HTMLElement>('main .wrap').forEach((w) => {
        if (w.getClientRects().length) floor = Math.max(floor, Math.min(W - 4, w.getBoundingClientRect().right + scrollX - parseFloat(getComputedStyle(w).paddingRight)))
      })
      const { d } = kolamPath({ width: W, y0, y1: docH - 4, boxes: contentBoxes(y0), marks, ring, slim, floor })
      y1 = ring ? ring.t + (ring.b - ring.t) / 2 : docH - 4
      svg.setAttribute('width', String(W))
      svg.setAttribute('height', String(docH))
      svg.setAttribute('viewBox', `0 0 ${W} ${docH}`)
      path.setAttribute('d', d)
      path.style.strokeWidth = slim ? '2' : '3'
      length = d ? path.getTotalLength() : 0
      path.style.strokeDasharray = String(length)
      shown = -1
      draw()
    }
    let timer = 0
    const later = (ms = 250) => {
      clearTimeout(timer)
      timer = window.setTimeout(measure, ms)
    }
    measure()
    later(900) // once hydration and the first images have settled
    document.fonts?.ready.then(() => later(50))
    const onResize = () => later()
    const onLoad = () => later(50)
    addEventListener('resize', onResize)
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('load', onLoad)
    const ro = new ResizeObserver(() => {
      if (root.scrollHeight !== docH) later(300)
    })
    ro.observe(document.body)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
      ro.disconnect()
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', onResize)
      removeEventListener('load', onLoad)
      svg.remove()
    }
  }, [])
  return null
}
