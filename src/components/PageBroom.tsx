'use client'

import { usePathname, useRouter } from 'next/navigation'
import { addTransitionType, startTransition, useEffect, useRef } from 'react'
import { stripLocale } from '@/i18n/config'
import { sweep, type Run } from './sweep'

// The broom page transition, everyday look only. Navigation links in the header, the bottom tab bar and the footer, going to one of the main pages,
// are taken over in the capture phase: a band of marigold, kumkum and peacock sweeps across and covers the page, the route changes underneath, and a
// second sweep reveals the new page. Why not the View Transitions API: a route change that has to wait for the network would freeze the old page; here the
// cover starts at once and the reveal waits for the new route (with a timeout), and the card → product morph is left alone (those links are not taken over;
// the transition type "broom" keeps the layout's page fade from also running). Browser Back and Forward are not intercepted: the plain page fade, as before.
// Lite: a quick fade. "Stop animations" and reduced motion: nothing, the link works as a normal link. Festive: nothing.

const MAIN = /^\/(shop|artwork|courses|about|events|custom-portraits|festivals)?\/?$/
const NAV = '.site-header a[href], .site-footer a[href], .tab-bar a[href]'
const language = (p: string) => (p.split('/')[1] === 'mr' ? 'mr' : p.split('/')[1] === 'hi' ? 'hi' : 'en')
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const frames = (n: number) =>
  new Promise<void>((r) => {
    const f = (i: number) => {
      if (i <= 0) r()
      else requestAnimationFrame(() => f(i - 1))
    }
    f(n)
  })

export function PageBroom() {
  const router = useRouter()
  const path = usePathname()
  const arrived = useRef<(() => void) | null>(null)
  useEffect(() => {
    arrived.current?.()
  }, [path])

  useEffect(() => {
    const root = document.documentElement
    let active: { run: Run | null; stop: () => void } | null = null

    const go = async (href: string, lite: boolean) => {
      const phone = innerWidth < 640
      const state = { run: null as Run | null, stop: () => {} }
      let dead = false
      const veil = lite ? document.createElement('div') : null
      if (veil) {
        veil.setAttribute('aria-hidden', 'true')
        veil.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none;background:#fffcf7;opacity:0;transition:opacity 120ms'
        document.body.append(veil)
      }
      state.stop = () => {
        dead = true
        state.run?.cancel()
        veil?.remove()
      }
      active = state
      const failsafe = setTimeout(() => {
        if (active !== state) return
        state.stop()
        active = null
      }, 3200)
      router.prefetch(href)
      // 1. cover
      if (veil) {
        await frames(1)
        veil.style.opacity = '1'
        await wait(130)
      } else {
        state.run = sweep({ mode: 'cover', dur: phone ? 380 : 480 })
        if (!(await state.run.done)) return clearTimeout(failsafe)
      }
      if (dead) return clearTimeout(failsafe)
      // 2. the route changes while the screen is covered; wait for it (at most 700ms)
      const there = new Promise<void>((r) => (arrived.current = r))
      startTransition(() => {
        addTransitionType('broom')
        router.push(href)
      })
      await Promise.race([there, wait(700)])
      arrived.current = null
      await frames(2)
      if (dead) return clearTimeout(failsafe)
      document.getElementById('main')?.focus({ preventScroll: true })
      // 3. reveal
      if (veil) {
        veil.style.transition = 'opacity 160ms'
        veil.style.opacity = '0'
        await wait(170)
        veil.remove()
      } else {
        const cover = state.run
        state.run = sweep({ mode: 'reveal', dur: phone ? 420 : 520, after: cover ?? undefined })
        await state.run.done
      }
      clearTimeout(failsafe)
      if (active === state) active = null
    }

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      if (root.dataset.season === 'festive' || root.dataset.motion === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const a = (e.target as Element | null)?.closest<HTMLAnchorElement>(NAV)
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return
      const u = new URL(a.href, location.href)
      if (u.origin !== location.origin) return
      const to = stripLocale(u.pathname)
      // Same language only: a language switch is a different document (the browser's own cross-document transition).
      if (language(u.pathname) !== language(location.pathname) || to === stripLocale(location.pathname) || !MAIN.test(to) || u.hash) return
      e.preventDefault()
      e.stopPropagation()
      const href = u.pathname + u.search
      if (active) {
        // A second click while one is running: drop the sweep and just go (never two at once).
        active.stop()
        active = null
        startTransition(() => {
          addTransitionType('broom')
          router.push(href)
        })
        return
      }
      void go(href, root.dataset.fx === 'lite')
    }
    // Back and Forward: the sweep (if any) ends at once, and the browser does its usual thing.
    const onPop = () => {
      active?.stop()
      active = null
    }
    document.addEventListener('click', onClick, true)
    addEventListener('popstate', onPop)
    return () => {
      document.removeEventListener('click', onClick, true)
      removeEventListener('popstate', onPop)
      active?.stop()
    }
  }, [router])
  return null
}
