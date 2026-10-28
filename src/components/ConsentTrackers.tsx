'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { CONSENT_COOKIE, effectiveConsent, GA_ID as GA, META_ID as META, trackingAllowed } from '@/lib/consent'
import { CHANGE_EVENT } from './CookieBanner'

type W = Window & Record<string, unknown> & { dataLayer?: unknown[]; fbq?: ((...a: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean } }
const add = (src: string) => {
  const s = document.createElement('script')
  s.async = true
  s.src = src
  document.head.append(s)
}

/**
 * Loads Google Analytics and the Meta pixel, and only when (1) the visitor said yes to that purpose and (2) this page may
 * be tracked at all (trackingAllowed: never under-18 learners' pages, never the player). Otherwise nothing is loaded.
 * A script that is already running cannot be unloaded: on a page where tracking is not allowed it is switched off
 * (GA's documented disable flag; no more pixel events), and taking a yes back reloads the page.
 */
export function ConsentTrackers() {
  const path = usePathname()
  useEffect(() => {
    const w = window as unknown as W
    let loadedAnalytics = !!w.dataLayer?.length && !!GA
    let loadedMarketing = !!w.fbq && !!META
    const run = () => {
      const raw = document.cookie.split('; ').find((c) => c.startsWith(`${CONSENT_COOKIE}=`))?.split('=')[1]
      const yes = effectiveConsent(raw)
      // The page marks itself (data-under18); checked a moment after render so a page change has painted.
      const under18 = !!document.querySelector('[data-under18]')
      const ok = trackingAllowed(location.pathname, { under18Page: under18 })
      if (GA) w[`ga-disable-${GA}`] = !(ok && yes.analytics)
      if (GA && ok && yes.analytics && !loadedAnalytics) {
        loadedAnalytics = true
        w.dataLayer = w.dataLayer ?? []
        // GA only reads an Arguments object from the data layer, so this is a plain function that pushes `arguments`.
        const g = function (..._args: unknown[]) {
          void _args
          // eslint-disable-next-line prefer-rest-params
          w.dataLayer!.push(arguments)
        }
        g('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' })
        g('js', new Date())
        g('consent', 'update', { analytics_storage: 'granted' })
        g('config', GA, { allow_google_signals: false, allow_ad_personalization_signals: false })
        add(`https://www.googletagmanager.com/gtag/js?id=${GA}`)
      }
      if (META && ok && yes.marketing) {
        if (!loadedMarketing) {
          loadedMarketing = true
          const f = function (...a: unknown[]) {
            f.queue!.push(a)
          } as NonNullable<W['fbq']>
          f.queue = []
          f.loaded = true
          w.fbq = f
          f('init', META)
          add('https://connect.facebook.net/en_US/fbevents.js')
        }
        w.fbq!('track', 'PageView')
      }
    }
    const t = window.setTimeout(run, 150)
    // A choice made in the banner takes effect at once; taking a yes back reloads so nothing keeps running.
    const onChange = () => {
      const yes = effectiveConsent(document.cookie.split('; ').find((c) => c.startsWith(`${CONSENT_COOKIE}=`))?.split('=')[1])
      if ((loadedAnalytics && !yes.analytics) || (loadedMarketing && !yes.marketing)) location.reload()
      else run()
    }
    window.addEventListener(CHANGE_EVENT, onChange)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener(CHANGE_EVENT, onChange)
    }
  }, [path])
  return null
}
