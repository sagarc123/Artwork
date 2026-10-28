import config from '@payload-config'
import { Check, Clock, FileDown, MessageCircle } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import { OrderAgain } from '@/components/OrderAgain'
import { ThankYouMark } from '@/components/ThankYou'
import { localePath } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import type { CartLine } from '@/lib/cart'
import { deliveryRange, indiaToday } from '@/lib/dates'
import { orderProgress, TIMELINE } from '@/lib/track'
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
  const locale = await getLocale()
  const o = t.order
  const awaitingCod = order.status === 'cod_pending_confirmation'
  const progress = orderProgress(order.status)
  // Cancelled or refunding orders say so up top (not "confirmed", not "confirming your payment").
  const stopped = 'stopped' in progress ? progress.stopped : null
  const paid = !stopped && order.status !== 'pending_payment' && !awaitingCod
  const total = formatPrice(order.total ?? 0)

  const physical = (order.items ?? []).some((it) => it.type !== 'digital')
  // Only courses: nothing to pack or deliver, just a seat in the account.
  const courseOnly = (order.items ?? []).length > 0 && (order.items ?? []).every((it) => it.course)
  const day = (ymd: string) => new Intl.DateTimeFormat(`${locale}-IN`, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${ymd}T00:00:00Z`))
  // ponytail: estimated from the order date (5–8 days); the courier's date replaces it with Shiprocket.
  const [eta1, eta2] = deliveryRange(indiaToday(new Date(order.createdAt)))
  const showEta = physical && 'step' in progress && progress.step < 4

  // "Order again": the same pieces (by slug), with the frame matched back from its label.
  const productIds = (order.items ?? []).map((it) => it.product).filter((id): id is number => typeof id === 'number')
  const { docs: products } = productIds.length
    ? await payload.find({ collection: 'products', where: { id: { in: productIds } }, depth: 0, limit: productIds.length, select: { slug: true, framing: true } })
    : { docs: [] }
  const again: CartLine[] = (order.items ?? []).flatMap((it) => {
    const p = products.find((x) => x.id === it.product)
    if (!p?.slug || !it.variantId) return []
    const frameId = it.frameLabel ? p.framing?.find((f) => f.label === it.frameLabel)?.id : undefined
    return [{ slug: p.slug, variantId: it.variantId, frameId: frameId ?? undefined, qty: it.qty ?? 1 }]
  })

  return (
    <section className="bg-paper grain py-12 lg:py-20">
      <div className="wrap">
        <div className="mx-auto grid max-w-3xl gap-8 rounded-ui bg-surface p-6 shadow-frame lg:p-10">
          <div className="grid justify-items-start gap-3">
            {paid ? <ThankYouMark once={order.publicId ?? undefined} className="size-16" /> : <Clock aria-hidden="true" className="size-12 text-marigold" />}
            <h1 className="font-heading text-h1">{stopped ? o.stoppedTitle[stopped] : paid ? (courseOnly ? o.courseReady : o.thanks) : awaitingCod ? o.codPlaced : o.pending}</h1>
            {!paid && !stopped && <p className="text-muted">{awaitingCod ? o.codPlacedBody : o.pendingBody}</p>}
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
            {order.status === 'shipped' && order.courier && order.trackingNumber && (
              <p>{o.tracking.replace('{courier}', order.courier).replace('{number}', order.trackingNumber)}</p>
            )}
            {paid && <p className="text-muted">{courseOnly ? o.courseBody : o.note}</p>}
            {paid && courseOnly && (
              <Link href={localePath(locale, '/account')} className="press inline-flex h-13 items-center rounded-ui bg-kumkum px-6 font-semibold text-white">
                {o.myCourses}
              </Link>
            )}
          </div>
          {!courseOnly && (
          <div className="grid gap-4">
            <h2 className="font-heading text-h3">{o.timelineTitle}</h2>
            {'stopped' in progress ? (
              <p className="rounded-ui border-2 border-kumkum p-4 font-semibold">{o.stopped[progress.stopped]}</p>
            ) : (
              <ol className="grid gap-0">
                {TIMELINE.map((step, i) => {
                  const done = i <= progress.step
                  const label = step === 'confirmed' && order.paymentMode !== 'cod' ? o.steps.paid : o.steps[step]
                  return (
                    <li key={step} aria-current={i === progress.step ? 'step' : undefined} className="relative flex min-h-12 items-center gap-4 pl-1">
                      {i < TIMELINE.length - 1 && <span aria-hidden="true" className={`absolute top-8 left-[1.05rem] h-[calc(100%-1rem)] w-0.5 ${i < progress.step ? 'bg-leaf' : 'bg-border/40'}`} />}
                      <span className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2 ${done ? 'border-leaf bg-leaf text-white' : 'border-border/50 bg-surface'}`}>
                        {done && <Check aria-hidden="true" className="size-5" />}
                      </span>
                      <span className={i === progress.step ? 'font-semibold' : done ? '' : 'text-muted'}>{label}</span>
                    </li>
                  )
                })}
              </ol>
            )}
            {showEta && <p className="font-semibold">{o.expected.replace('{from}', day(eta1)).replace('{to}', day(eta2))}</p>}
          </div>
          )}
          <div className="grid gap-3">
            <h2 className="font-heading text-h3">{o.items}</h2>
            <ul className="grid gap-2">
              {(order.items ?? []).map((it) => (
                <li key={it.id} className="flex justify-between gap-4">
                  <span>
                    {it.course ? it.title : `${it.title} · ${[it.variantLabel, it.frameLabel].filter(Boolean).join(', ')} × ${it.qty}`}
                  </span>
                  <span className="font-semibold">{formatPrice(it.lineTotal ?? 0)}</span>
                </li>
              ))}
            </ul>
            {[
              [t.cart.shipping, order.shipping],
              [t.checkout.codFee, order.codFee],
              [t.cart.giftWrap, order.giftWrapFee],
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
          {!courseOnly && (
            <div className="grid gap-1">
              <h2 className="font-heading text-h3">{o.deliverTo}</h2>
              <p className="text-muted">{[order.customer?.name, order.address?.line1, order.address?.line2, order.address?.city, order.address?.pincode].filter(Boolean).join(', ')}</p>
            </div>
          )}
          {again.length > 0 && <OrderAgain lines={again} label={o.orderAgain} cartHref={localePath(locale, '/cart')} />}
          <div className="flex flex-wrap gap-x-8">
            <a href={whatsappLink(`${o.number}: ${order.orderNumber}`)} target="_blank" rel="noopener noreferrer" className="ink-link inline-flex min-h-11 items-center font-semibold text-leaf">
              {o.whatsapp}
            </a>
            <Link href={localePath(locale, '/track')} className="ink-link inline-flex min-h-11 items-center font-semibold text-peacock">
              {o.track}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
