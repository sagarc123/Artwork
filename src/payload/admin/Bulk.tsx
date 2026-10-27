'use client'

import { toast, useConfig, useSelection } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { bulkSummary, packPlan, soldPlan, type BulkResult } from '../../lib/admin-tools'

type Api = (path: string, init?: RequestInit) => Promise<{ ok: boolean; body: { docs?: unknown[]; errors?: { message?: string }[] } | null }>

/** Selected rows, plus a helper that saves through the normal API (so every hook and access rule still runs). */
function useBulk() {
  const { selectedIDs, setSelection } = useSelection()
  const { config } = useConfig()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [summary, setSummary] = useState('')
  const api: Api = async (path, init) => {
    const res = await fetch(`${config.routes.api}${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...init }).catch(() => null)
    return { ok: !!res?.ok, body: await res?.json().catch(() => null) }
  }
  const ids = selectedIDs.map(Number)
  /** Saves `data` on each id one by one; a refusal (e.g. owner-only) is reported with the server's own words. */
  const apply = async (collection: string, todo: number[], data: object, skipped: BulkResult[], verb: string) => {
    setBusy(true)
    setSummary('')
    const results = [...skipped]
    for (const id of todo) {
      const r = await api(`/${collection}/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
      results.push(r.ok ? { id, ok: true } : { id, ok: false, reason: (r.body?.errors?.[0]?.message ?? 'could not be saved').replace(/\.$/, '') })
    }
    setBusy(false)
    const text = bulkSummary(results, verb)
    setSummary(text)
    if (results.some((r) => r.ok)) toast.success(text)
    else toast.info(text)
    for (const id of selectedIDs) setSelection(id)
    router.refresh()
  }
  const find = async <T,>(collection: string, extra = '') =>
    ((await api(`/${collection}?depth=0&limit=${ids.length}&where[id][in]=${ids.join(',')}${extra}`)).body?.docs ?? []) as T[]
  return { ids, busy, setBusy, summary, setSummary, apply, find, api }
}

function Bar({ count, summary, children }: { count: number; summary: string; children: ReactNode }) {
  if (!count && !summary) return null
  return (
    <div className="bulk-bar" role="region" aria-label="Selected rows">
      {count > 0 && (
        <>
          <p className="bulk-bar__count">
            <strong>{count} selected</strong>
          </p>
          <div className="one-tap__links">{children}</div>
        </>
      )}
      <p className="bulk-bar__summary" role="status">
        {summary}
      </p>
    </div>
  )
}

/** Orders list: tick several, then "Mark packed" or print all their packing slips on one page. */
export function OrderBulk() {
  const { ids, busy, summary, setSummary, apply, find } = useBulk()
  const pack = async () => {
    const plan = packPlan(await find<{ id: number; status: string }>('orders', '&select[status]=true'))
    if (!plan.pack.length) return setSummary(bulkSummary(plan.skipped, 'packed'))
    const skip = plan.skipped.length ? ` (${plan.skipped.length} will be skipped: not ready to pack)` : ''
    if (!window.confirm(`Mark ${plan.pack.length} ${plan.pack.length === 1 ? 'order' : 'orders'} packed?${skip}`)) return
    await apply('orders', plan.pack, { status: 'packed' }, plan.skipped, 'packed')
  }
  return (
    <Bar count={ids.length} summary={summary}>
      <button type="button" className="one-tap__btn is-primary" disabled={busy} onClick={() => void pack()}>
        {busy ? 'Saving…' : 'Mark packed'}
      </button>
      <a className="one-tap__btn" href={`/api/orders/packing-slips?ids=${ids.join(',')}`} target="_blank" rel="noopener noreferrer">
        Print all packing slips
      </a>
    </Bar>
  )
}

/** Paintings & prints list: tick several, then "Mark sold" (originals) or give them all one festival. */
export function ProductBulk() {
  const { ids, busy, setBusy, summary, setSummary, apply, find, api } = useBulk()
  const [festivals, setFestivals] = useState<{ id: number; name: string }[] | null>(null)
  const [festival, setFestival] = useState('')

  const sell = async () => {
    const plan = soldPlan(await find<{ id: number; type: string; sold?: boolean }>('products', '&draft=true'))
    if (!plan.sell.length) return setSummary(bulkSummary(plan.skipped, 'marked sold'))
    if (!window.confirm(`Mark ${plan.sell.length} ${plan.sell.length === 1 ? 'original' : 'originals'} as sold? ${plan.sell.length === 1 ? 'It stays' : 'They stay'} on the website with a “Sold” badge.`)) return
    await apply('products', plan.sell, { sold: true }, plan.skipped, 'marked sold')
  }
  const pickFestival = async () => {
    setBusy(true)
    const r = await api('/festivals?depth=0&limit=100&sort=name&select[name]=true')
    setFestivals((r.body?.docs ?? []) as { id: number; name: string }[])
    setBusy(false)
  }
  return (
    <Bar count={ids.length} summary={summary}>
      <button type="button" className="one-tap__btn is-primary" disabled={busy} onClick={() => void sell()}>
        Mark sold
      </button>
      {festivals === null ? (
        <button type="button" className="one-tap__btn" disabled={busy} onClick={() => void pickFestival()}>
          Set festival…
        </button>
      ) : (
        <span className="bulk-bar__festival">
          <label htmlFor="bulk-festival">Festival</label>
          <select id="bulk-festival" value={festival} onChange={(e) => setFestival(e.target.value)}>
            <option value="">None (remove)</option>
            {festivals.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <button type="button" className="one-tap__btn is-primary" disabled={busy} onClick={() => void apply('products', ids, { festival: festival ? Number(festival) : null }, [], festival ? `set to ${festivals.find((f) => String(f.id) === festival)?.name}` : 'without a festival now')}>
            Apply to {ids.length}
          </button>
        </span>
      )}
    </Bar>
  )
}
