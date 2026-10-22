import config from '@payload-config'
import { CheckCircle2, Clock } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import { Suspense } from 'react'
import { getDictionary } from '@/i18n/dictionaries'
import { formatPrice, whatsappLink } from '@/lib/site'

// Order links are private and created at runtime; "_" only lets the page shell be pre-built (it 404s).
export function generateStaticParams() {
  return [{ publicId: '_' }]
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.order.metaTitle, robots: { index: false, follow: false } }
}

/** Order status page. The random public id in the link is what keeps it private. */
async function OrderDetails({ params }: { params: PageProps<'/[lang]/order/[publicId]'>['params'] }) {
  const { publicId } = await params
  if (!/^[A-Za-z0-9_-]{12}$/.test(publicId)) notFound()
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'orders', where: { publicId: { equals: publicId } }, limit: 1, depth: 0 })
  const order = docs[0]
  if (!order) notFound()
  const t = await getDictionary()
  const o = t.order
  const paid = order.status !== 'pending_payment' && order.status !== 'cancelled'

  return (
    <div className="mx-auto grid max-w-3xl gap-8 rounded-ui bg-surface p-6 shadow-frame lg:p-10">
      <div className="grid justify-items-start gap-3">
        {paid ? <CheckCircle2 aria-hidden="true" className="size-12 text-leaf" /> : <Clock aria-hidden="true" className="size-12 text-marigold" />}
        <h1 className="font-heading text-h1">{paid ? o.thanks : o.pending}</h1>
        {!paid && <p className="text-muted">{o.pendingBody}</p>}
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
        <p className="flex justify-between border-t border-border/30 pt-3 text-h3 font-semibold">
          <span>{t.cart.total}</span>
          <span>{formatPrice(order.total ?? 0)}</span>
        </p>
      </div>
      <div className="grid gap-1">
        <h2 className="font-heading text-h3">{o.deliverTo}</h2>
        <p className="text-muted">{[order.customer?.name, order.address?.line1, order.address?.line2, order.address?.city, order.address?.pincode].filter(Boolean).join(', ')}</p>
      </div>
      <a href={whatsappLink(`${o.number}: ${order.orderNumber}`)} target="_blank" rel="noopener noreferrer" className="ink-link inline-flex min-h-11 items-center justify-self-start font-semibold text-leaf">
        {o.whatsapp}
      </a>
    </div>
  )
}

export default function OrderPage({ params }: PageProps<'/[lang]/order/[publicId]'>) {
  return (
    <section className="bg-paper grain py-12 lg:py-20">
      <div className="wrap">
        <Suspense fallback={<div className="mx-auto h-96 max-w-3xl animate-pulse rounded-ui bg-surface" />}>
          <OrderDetails params={params} />
        </Suspense>
      </div>
    </section>
  )
}
