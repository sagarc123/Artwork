'use client'

import type { DefaultCellComponentProps } from 'payload'
import { toast, useConfig } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Variant = { stock?: number | null; reserved?: number | null }

/** Products list: originals get a one-tap "Mark sold"; prints show how many are left. */
export function SoldCell({ cellData, rowData }: DefaultCellComponentProps) {
  const router = useRouter()
  const { config } = useConfig()
  const [busy, setBusy] = useState(false)
  if (rowData.type !== 'original') {
    const left = ((rowData.variants ?? []) as Variant[]).reduce((n, v) => n + Math.max(0, (v.stock ?? 0) - (v.reserved ?? 0)), 0)
    return <span>{rowData.type === 'digital' ? '—' : `${left} left`}</span>
  }
  if (cellData) return <span className="sold-chip">Sold</span>
  return (
    <button
      type="button"
      className="one-tap__btn is-small"
      disabled={busy}
      onClick={async () => {
        if (!window.confirm(`Mark "${rowData.title}" as sold?`)) return
        setBusy(true)
        const res = await fetch(`${config.routes.api}/products/${rowData.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sold: true }),
        })
        setBusy(false)
        if (res.ok) router.refresh()
        else toast.error('Could not mark it sold. Please open the product.')
      }}
    >
      Mark sold
    </button>
  )
}
