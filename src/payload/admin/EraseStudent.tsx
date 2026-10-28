'use client'

import { toast, useDocumentInfo } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { eraseStudent } from '@/server/erase-actions'

/** Stands in for "Delete" on a student: wipes the personal data, keeps the orders, invoices and course seats. */
export function EraseStudent() {
  const { id } = useDocumentInfo()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  if (!id) return null
  async function erase() {
    if (!window.confirm("Remove this student's name, phone number and any child's name? Their orders, invoices and course seats stay, without personal details. This cannot be undone.")) return
    setBusy(true)
    const r = await eraseStudent(Number(id)).catch(() => null)
    setBusy(false)
    if (r?.status === 'ok') {
      toast.success("Done. This student's personal data was removed. Orders, invoices and course seats are kept.")
      router.refresh()
    } else toast.error(r?.status === 'forbidden' ? 'Only the owner can do this.' : 'Could not remove the data. Please try again.')
  }
  return (
    <div style={{ margin: '1rem 0' }}>
      <button type="button" className="one-tap__btn is-small" disabled={busy} onClick={erase}>
        Remove this student&apos;s personal data
      </button>
      <p style={{ opacity: 0.8, marginTop: '0.5rem' }}>Students are never deleted, so invoices and certificates keep working. This wipes their name, phone number and child&apos;s name.</p>
    </div>
  )
}
