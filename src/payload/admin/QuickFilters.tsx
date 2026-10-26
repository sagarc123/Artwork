'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@payloadcms/ui'
import { hasRole } from '../access'
import { listUrl } from '../../lib/admin'

/** ownerOnly: hidden from helpers (e.g. "Needs refund": refunds are the owner's). */
type Tab = { label: string; values?: string[]; ownerOnly?: boolean }
type Props = { collection: string; field: string; tabs: Tab[] }

/** One-tap list filters above a table, e.g. Orders: To confirm / To pack / Shipped / All. */
export function QuickFilters({ collection, field, tabs }: Props) {
  const params = useSearchParams()
  const { user } = useAuth()
  const owner = hasRole(user, 'owner')
  // The filter part of the current address, to highlight the matching tab.
  const current = [...params.entries()].filter(([k]) => k.startsWith('where')).map(([k, v]) => `${k}=${v}`).sort().join('&')
  return (
    <nav className="quick-filters" aria-label="Show">
      {tabs.filter((t) => owner || !t.ownerOnly).map((t) => {
        const href = t.values ? listUrl(collection, field, t.values) : `/admin/collections/${collection}`
        const query = href.split('?')[1] ?? ''
        const on = query.split('&').filter(Boolean).sort().join('&') === current
        return (
          <Link key={t.label} href={href} className={`quick-filters__tab${on ? ' is-on' : ''}`} aria-current={on ? 'page' : undefined}>
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
