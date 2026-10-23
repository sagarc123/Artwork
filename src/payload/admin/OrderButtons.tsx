'use client'

import { useForm, useFormFields, useFormProcessing } from '@payloadcms/ui'
import { isLocale, localePath, type Locale } from '../../i18n/config'
import { codConfirmAsk, customerChat, trackingMessage } from '../../lib/admin'
import { site } from '../../lib/site'

type Props = {
  id: number
  publicId?: string | null
  orderNumber?: string | null
  name?: string | null
  phone?: string | null
  total?: number | null
  locale?: string | null
  hasInvoice: boolean
}

/**
 * Big buttons for the next step of an order. Each one saves the status through the normal order save,
 * so the stock, invoice and owner-only rules in the Orders hooks still apply (and their messages show as usual).
 */
export function OrderButtons({ id, publicId, orderNumber, name, phone, total, locale, hasInvoice }: Props) {
  const { submit } = useForm()
  const busy = useFormProcessing()
  const { status, courier, trackingNumber } = useFormFields(([f]) => ({
    status: f.status?.value as string | undefined,
    courier: (f.courier?.value as string | undefined)?.trim(),
    trackingNumber: (f.trackingNumber?.value as string | undefined)?.trim(),
  }))
  const lang = isLocale(locale ?? undefined) ? (locale as Locale) : 'en'
  const info = { name, orderNumber, total, locale }
  const set = (to: string) => void submit({ overrides: { status: to } })
  const step = (label: string, to: string, disabled = false) => (
    <button type="button" className="one-tap__btn is-primary" disabled={busy || disabled} onClick={() => set(to)}>
      {label}
    </button>
  )

  return (
    <div className="one-tap">
      {status === 'cod_pending_confirmation' && (
        <>
          <a className="one-tap__btn is-whatsapp" href={customerChat(phone, codConfirmAsk(info))} target="_blank" rel="noopener noreferrer">
            Ask to confirm on WhatsApp
          </a>
          {step('Confirm COD (customer said yes)', 'cod_confirmed')}
        </>
      )}
      {(status === 'paid' || status === 'cod_confirmed') && step('Mark packed', 'packed')}
      {status === 'packed' && (
        <>
          {step('Mark shipped', 'shipped', !courier || !trackingNumber)}
          {(!courier || !trackingNumber) && <p className="one-tap__note">Fill in the courier and tracking number below first.</p>}
        </>
      )}
      {status === 'shipped' && (
        <>
          {courier && trackingNumber && publicId && (
            <a
              className="one-tap__btn is-whatsapp"
              href={customerChat(phone, trackingMessage({ ...info, courier, trackingNumber, link: `${site.url}${localePath(lang, `/order/${publicId}`)}` }))}
              target="_blank"
              rel="noopener noreferrer"
            >
              Send tracking on WhatsApp
            </a>
          )}
          {step('Mark delivered', 'delivered')}
        </>
      )}
      <div className="one-tap__links">
        <a className="one-tap__btn" href={`/api/orders/${id}/packing-slip`} target="_blank" rel="noopener noreferrer">
          Print packing slip
        </a>
        {publicId && (hasInvoice || status === 'delivered') && (
          <a className="one-tap__btn" href={`/api/invoices/${publicId}`} target="_blank" rel="noopener noreferrer">
            Download invoice
          </a>
        )}
      </div>
    </div>
  )
}
