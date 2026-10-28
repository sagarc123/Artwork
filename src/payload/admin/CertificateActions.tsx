'use client'

import { toast, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { certificateAction } from '@/server/learn-actions'

/** On a certificate: withdraw it, make it genuine again, or give it a new number. */
export function CertificateActions() {
  const { id } = useDocumentInfo()
  const status = useFormFields(([fields]) => fields.status?.value)
  const publicId = useFormFields(([fields]) => fields.publicId?.value)
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  if (!id) return null
  const withdrawn = status === 'revoked'

  async function run(action: 'withdraw' | 'restore' | 'reissue', ask: string, done: string) {
    if (!window.confirm(ask)) return
    setBusy(true)
    const r = await certificateAction(Number(id), action).catch(() => null)
    setBusy(false)
    if (r?.status === 'ok') {
      toast.success(done)
      router.refresh()
    } else toast.error(r?.status === 'forbidden' ? 'Only the owner can do this.' : 'Something went wrong. Please try again.')
  }

  return (
    <div style={{ margin: '1rem 0' }}>
      <p>
        {withdrawn ? 'This certificate is withdrawn. Its public page says so.' : 'This certificate is genuine.'}{' '}
        {typeof publicId === 'string' && (
          <a href={`/verify/${publicId}`} target="_blank" rel="noreferrer">
            See the public page
          </a>
        )}
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
        {withdrawn ? (
          <button type="button" className="one-tap__btn is-small" disabled={busy} onClick={() => run('restore', 'Make this certificate genuine again?', 'Done. The certificate is genuine again.')}>
            Make it genuine again
          </button>
        ) : (
          <button type="button" className="one-tap__btn is-small" disabled={busy} onClick={() => run('withdraw', 'Withdraw this certificate? Its public page will say it has been withdrawn.', 'Done. The certificate is withdrawn.')}>
            Withdraw this certificate
          </button>
        )}
        <button
          type="button"
          className="one-tap__btn is-small"
          disabled={busy}
          onClick={() => run('reissue', 'Give this certificate a new number and read the name again from the student? The old link and number will stop working.', 'Done. The certificate has a new number.')}
        >
          Reissue with a new number
        </button>
      </div>
    </div>
  )
}
