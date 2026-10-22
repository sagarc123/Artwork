import config from '@payload-config'
import { CheckCircle2, Clock, FileDown, MessageCircle } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import { getDictionary } from '@/i18n/dictionaries'
import { formatPrice, whatsappLink } from '@/lib/site'

// Private, per-request page: render fully on the server before sending, so a wrong link gets a real 404.
export const instant = false

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.order.metaTitle, robots: { index: false, follow: false } }
}

/** Order status page. The random public id in the link is what keeps it private. */
export default async function OrderPage({ params }: PageProps<'/[lang]/order/[publicId]'>) {
  const { publicId } = await params
  if (!/^[A-Za-z0-9_-]{12}$/.test(publicId)) notFound()
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'orders', where: { publicId: { equals: publicId } }, limit: 1, depth: 0 })
  const order = docs[0]
  if (!order) notFound()
  const { totalDocs: invoices } = await payload.count({ collection: 'invoices', where: { order: { equals: order.id } } })
  const t = await getDictionary()
  const o = t.order
  const awaitingCod = order.status === 'cod_pending_confirmation'
  const paid = order.status !== 'pending_payment' && order.status !== 'cancelled' && !awaitingCod
  const total = formatPrice(order.total ?? 0)

  return (
    <section className="bg-paper grain py-12 lg:py-20">
      <div className="wrap">
        <div className="mx-auto grid max-w-3xl gap-8 rounded-ui bg-surface p-6 shadow-frame lg:p-10">
          <div className="grid justify-items-start gap-3">
            {paid ? <CheckCircle2 aria-hidden="true" className="size-12 text-leaf" /> : <Clock aria-hidden="true" className="size-12 text-marigold" />}
            <h1 className="font-heading text-h1">{paid ? o.thanks : awaitingCod ? o.codPlaced : o.pending}</h1>
            {!paid && <p className="text-muted">{awaitingCod ? o.codPlacedBody : o.pendingBody}</p>}
            {awaitingCod && (
              <a
                href={whatsappLink(o.codConfirmMessage.replace('{number}', order.orderNumber ?? '').replace('{amount}', total))}
                target="_blank"
                rel="noopener noreferrer"
                className="press inline-flex h-13 items-center gap-2 rounded-ui bg-leaf px-6 font-semibold text-white"
              >
                <MessageCircle aria-hidden="true" className="size-6" />
                {o.codConfirm}
              </a>
            )}
            <p>
              {o.number}: <strong>{order.orderNumber}</strong> · {o.status[order.status]}
            </p>
            {paid && <p className="text-muted">{o.note}</p>}
          </div>
          <div className="grid gap-3">
            <h2 className="font-heading text-h3">{o.items}</h2>
            <ul className="grid gap-2">
              {(order.items ?? []).map((it) => (
                <li key={it.id} className="flex justify-between gap-4">
                  <span>
                    {it.title} · {[it.variantLabel, it.frameLabel].filter(Boolean).join(', ')} × {it.qty}
                  </span>
                  <span className="font-semibold">{formatPrice(it.lineTotal ?? 0)}</span>
                </li>
              ))}
            </ul>
            {[
              [t.cart.shipping, order.shipping],
              [t.checkout.codFee, order.codFee],
            ].map(([label, amount]) =>
              amount ? (
                <p key={label} className="flex justify-between text-muted">
                  <span>{label}</span>
                  <span>{formatPrice(Number(amount))}</span>
                </p>
              ) : null,
            )}
            <p className="flex justify-between border-t border-border/30 pt-3 text-h3 font-semibold">
              <span>{t.cart.total}</span>
              <span>{total}</span>
            </p>
          </div>
          <div className="grid gap-1">
            <h2 className="font-heading text-h3">{o.payment}</h2>
            <p className="text-muted">{order.paymentMode === 'cod' ? o.codDue.replace('{amount}', total) : o.paidOnline}</p>
            {invoices > 0 && (
              // A plain link: the PDF is a file download, not a page.
              <a href={`/api/invoices/${order.publicId}`} className="ink-link inline-flex min-h-11 items-center gap-2 justify-self-start font-semibold text-peacock">
                <FileDown aria-hidden="true" className="size-5" />
                {o.invoice}
              </a>
            )}
          </div>
          <div className="grid gap-1">
            <h2 className="font-heading text-h3">{o.deliverTo}</h2>
            <p className="text-muted">{[order.customer?.name, order.address?.line1, order.address?.line2, order.address?.city, order.address?.pincode].filter(Boolean).join(', ')}</p>
          </div>
          <a href={whatsappLink(`${o.number}: ${order.orderNumber}`)} target="_blank" rel="noopener noreferrer" className="ink-link inline-flex min-h-11 items-center justify-self-start font-semibold text-leaf">
            {o.whatsapp}
          </a>
        </div>
      </div>
    </section>
  )
}
