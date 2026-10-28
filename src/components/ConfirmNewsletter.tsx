'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Dictionary } from '@/i18n/dictionaries'
import { confirmNewsletter } from '@/server/newsletter-actions'

/** The button on the confirm page: it takes a tap, so a robot that only opens links cannot confirm for someone. */
export function ConfirmNewsletter({ token, home, t }: { token: string; home: string; t: Dictionary['newsletter'] }) {
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'invalid'>('idle')
  async function confirm() {
    setState('busy')
    setState((await confirmNewsletter(token).catch(() => 'invalid' as const)) === 'ok' ? 'ok' : 'invalid')
  }
  if (state === 'idle' || state === 'busy') {
    return (
      <button type="button" onClick={confirm} disabled={state === 'busy'} className="press h-13 justify-self-start rounded-ui bg-kumkum px-6 font-semibold text-white disabled:opacity-60">
        {state === 'busy' ? t.confirming : t.confirmButton}
      </button>
    )
  }
  return (
    <div role="status" className="grid justify-items-start gap-3">
      <p className="font-heading text-h2">{state === 'ok' ? t.confirmedTitle : t.invalidTitle}</p>
      <p>{state === 'ok' ? t.confirmedBody : t.invalidBody}</p>
      <Link href={home} className="ink-link inline-flex min-h-12 items-center font-semibold text-peacock">
        {t.home}
      </Link>
    </div>
  )
}
