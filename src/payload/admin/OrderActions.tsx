import type { UIFieldServerComponent } from 'payload'
import { OrderButtons } from './OrderButtons'

/** Order edit view: the one-tap buttons. The server part only checks whether an invoice exists. */
export const OrderActions: UIFieldServerComponent = async ({ data, payload }) => {
  if (!data?.id) return null
  const { totalDocs } = await payload.count({ collection: 'invoices', where: { order: { equals: data.id } } })
  return (
    <OrderButtons
      id={data.id}
      publicId={data.publicId}
      orderNumber={data.orderNumber}
      name={data.customer?.name}
      phone={data.customer?.phone}
      total={data.total}
      locale={data.locale}
      hasInvoice={totalDocs > 0}
    />
  )
}
