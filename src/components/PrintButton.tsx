'use client'

import { Printer } from 'lucide-react'

export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="press inline-flex h-13 items-center justify-center gap-2 rounded-ui bg-kumkum px-6 font-semibold text-white hover:bg-kumkum/90">
      <Printer aria-hidden="true" className="size-5" />
      {label}
    </button>
  )
}
