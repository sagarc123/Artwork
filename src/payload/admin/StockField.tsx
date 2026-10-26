'use client'

import type { NumberFieldClientComponent } from 'payload'
import { FieldLabel, NumberField, toast, useDocumentInfo, useForm, useFormFields } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

type Live = { stock: number; reserved: number }

/**
 * "In stock" of a saved size: the live count (the form's copy may be old) with Add / Remove buttons. Each tap is one
 * database step, so it never overwrites a checkout. A new size, not saved yet, is a plain number box.
 */
export const StockField: NumberFieldClientComponent = (props) => {
  const { path, field } = props
  const rowId = useFormFields(([f]) => f[`${path.slice(0, path.lastIndexOf('.'))}.id`]?.value as string | undefined)
  const { id } = useDocumentInfo()
  const { dispatchFields } = useForm()
  // undefined: still loading; null: not in the database yet.
  const [live, setLive] = useState<Live | null | undefined>(id ? undefined : null)
  const [n, setN] = useState(1)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!id || !rowId) return
    let on = true
    fetch(`/api/stock?product=${id}`, { credentials: 'include' })
      .then((r) => (r.ok ? (r.json() as Promise<{ id: string; stock: number; reserved: number | null }[]>) : []))
      .then((rows) => {
        const row = rows.find((x) => x.id === rowId)
        if (on) setLive(row ? { stock: row.stock, reserved: row.reserved ?? 0 } : null)
      })
      .catch(() => on && setLive(null))
    return () => {
      on = false
    }
  }, [id, rowId])

  if (live === null || !id || !rowId) return <NumberField {...props} />

  const change = async (delta: number) => {
    setBusy(true)
    const res = await fetch('/api/stock', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ variantId: rowId, delta }) }).catch(() => null)
    setBusy(false)
    if (!res?.ok) return void toast.error('Could not change the stock. Please reload and try again.')
    const row = (await res.json()) as { stock: number; reserved: number | null }
    setLive({ stock: row.stock, reserved: row.reserved ?? 0 })
    // Keep the form's copy in step without marking it unsaved (the save ignores it anyway).
    dispatchFields({ type: 'UPDATE', path, value: row.stock })
    if (delta < 0 && row.stock > (live?.stock ?? 0) + delta) toast.info(`Saved ✓ Kept ${row.stock}: some are held for people paying right now.`)
    else toast.success(`Saved ✓ ${row.stock} in stock`)
  }

  return (
    <div className="field-type stock-field">
      <FieldLabel label={field.label} path={path} />
      <p className="stock-field__now">
        <strong>{live ? live.stock : '…'}</strong>
        {live && live.reserved > 0 && <small> ({live.reserved} held while someone pays)</small>}
      </p>
      <div className="stock-field__row">
        <input type="number" min={1} step={1} value={n} aria-label="How many" className="stock-field__n" onChange={(e) => setN(Math.max(1, Math.floor(Number(e.target.value) || 1)))} />
        <button type="button" className="one-tap__btn is-small" disabled={busy || !live} onClick={() => void change(n)}>
          + Add
        </button>
        <button type="button" className="one-tap__btn is-small" disabled={busy || !live || live.stock <= live.reserved} onClick={() => void change(-n)}>
          − Remove
        </button>
      </div>
      <p className="field-description">Saved as soon as you tap. No need to press Save.</p>
    </div>
  )
}
