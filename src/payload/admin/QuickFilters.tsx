'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth, useConfig } from '@payloadcms/ui'
import { useEffect, useState } from 'react'
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
  const { config } = useConfig()
  const [counts, setCounts] = useState<Record<string, number>>({})
  // One small count per tab ("To pack (3)"); the tab works without it if the count cannot be loaded.
  useEffect(() => {
    for (const t of tabs) {
      if (!t.values || (t.ownerOnly && !owner)) continue
      fetch(`${config.routes.api}/${collection}?where[${field}][in]=${t.values.join(',')}&limit=1&depth=0&select[id]=true`, { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : null))
        .then((j: { totalDocs?: number } | null) => typeof j?.totalDocs === 'number' && setCounts((c) => ({ ...c, [t.label]: j.totalDocs! })))
        .catch(() => {})
    }
  }, [tabs, owner, collection, field, config.routes.api])
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
            {counts[t.label] ? ` (${counts[t.label]})` : ''}
          </Link>
        )
      })}
    </nav>
  )
}
