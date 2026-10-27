'use client'

import { X } from 'lucide-react'

/** Closes the announcement strip for this visit (sessionStorage; the layout's head script re-applies it before paint). */
export function AnnouncementClose({ id, label, className = '' }: { id: string; label: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        try {
          sessionStorage.setItem('ann', id)
        } catch {
          // Storage blocked: closed until the next page load.
        }
        document.documentElement.dataset.annOff = id
        document.getElementById('main')?.focus({ preventScroll: true })
      }}
      className={`inline-flex min-h-11 shrink-0 items-center gap-1 px-2 ${className}`}
    >
      <X aria-hidden="true" className="size-5" />
      {label}
    </button>
  )
}
