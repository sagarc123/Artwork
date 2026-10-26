'use client'

import type { DefaultCellComponentProps, UIFieldClientComponent } from 'payload'
import { toast, useConfig, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { customerChat, enquiryReply, waited } from '../../lib/admin'
import { useOneTap } from './one-tap'

/** "Reply on WhatsApp" on an enquiry: opens the chat with a polite first message and marks it replied. */
export const EnquiryActions: UIFieldClientComponent = () => {
  const save = useOneTap()
  const { initialData } = useDocumentInfo()
  const [openedAt] = useState(() => Date.now())
  const f = useFormFields(([fields]) => ({
    name: fields.name?.value as string | undefined,
    phone: fields.phone?.value as string | undefined,
    type: fields.type?.value as string | undefined,
    locale: fields.locale?.value as string | undefined,
    status: fields.status?.value as string | undefined,
  }))
  if (!f.phone) return null
  return (
    <div className="one-tap">
      <a
        className="one-tap__btn is-whatsapp"
        href={customerChat(f.phone, enquiryReply(f))}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          if (f.status === 'new') void save('replied', 'Marked replied', 'new')
        }}
      >
        Reply on WhatsApp
      </a>
      {f.status === 'new' && initialData?.createdAt && <p className="one-tap__note">Waiting {waited(openedAt - Date.parse(initialData.createdAt))}</p>}
    </div>
  )
}

/** Phone column in the enquiries list: one tap opens WhatsApp and marks the enquiry replied. */
export function ReplyCell({ cellData, rowData }: DefaultCellComponentProps) {
  const router = useRouter()
  const { config } = useConfig()
  if (!cellData) return null
  return (
    <a
      className="one-tap__btn is-whatsapp is-small"
      href={customerChat(String(cellData), enquiryReply(rowData))}
      target="_blank"
      rel="noopener noreferrer"
      onClick={async () => {
        if (rowData.status !== 'new') return
        const res = await fetch(`${config.routes.api}/enquiries/${rowData.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'replied' }),
        })
        if (res.ok) router.refresh()
        else toast.error('Could not mark it replied. Please open the enquiry.')
      }}
    >
      WhatsApp {String(cellData)}
    </a>
  )
}
