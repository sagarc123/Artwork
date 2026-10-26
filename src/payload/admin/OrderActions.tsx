import type { UIFieldServerComponent } from 'payload'
import { customerChat } from '../../lib/admin'
import { formatPrice } from '../../lib/site'
import { CopyButton } from './CopyButton'
import { OrderButtons } from './OrderButtons'

type Line = { product?: number | { id: number } | null; title?: string | null; variantLabel?: string | null; frameLabel?: string | null; unitPrice?: number | null; qty?: number | null; lineTotal?: number | null }

/** Order edit view: the one-tap buttons, then a plain summary (who, where, what, how much). The raw fields sit below, folded away. */
export const OrderActions: UIFieldServerComponent = async ({ data, payload }) => {
  if (!data?.id) return null
  const items = (data.items ?? []) as Line[]
  const productIds = items.map((l) => (typeof l.product === 'object' ? l.product?.id : l.product)).filter((id): id is number => typeof id === 'number')
  const [{ totalDocs }, products] = await Promise.all([
    payload.count({ collection: 'invoices', where: { order: { equals: data.id } } }),
    productIds.length
      ? payload.find({ collection: 'products', where: { id: { in: productIds } }, depth: 1, draft: true, limit: productIds.length, select: { images: true } })
      : null,
  ])
  const thumb = (id: unknown) => {
    const p = products?.docs.find((d) => d.id === id)
    const img = p?.images?.[0]
    return typeof img === 'object' && img ? (img.sizes?.thumb?.url ?? img.url ?? undefined) : undefined
  }
  const c = data.customer ?? {}
  const a = data.address ?? {}
  const addressText = [c.name, a.line1, a.line2, [a.city, a.state].filter(Boolean).join(', ') + (a.pincode ? ` ${a.pincode}` : ''), c.phone && `Phone: ${c.phone}`].filter(Boolean).join('\n')
  const money = (n?: number | null) => formatPrice(n ?? 0)

  return (
    <>
      <OrderButtons
        id={data.id}
        publicId={data.publicId}
        orderNumber={data.orderNumber}
        name={c.name}
        phone={c.phone}
        total={data.total}
        locale={data.locale}
        paymentMode={data.paymentMode}
        hasInvoice={totalDocs > 0}
      />
      <section className="order-card" aria-label="Order summary">
        <div className="order-card__block">
          <h3>Customer</h3>
          <p className="order-card__big">{c.name || '—'}</p>
          {c.phone && (
            <p className="order-card__contact">
              <a className="one-tap__btn is-small" href={`tel:${c.phone}`} aria-label={`Call ${c.phone}`}>
                Call {c.phone}
              </a>
              <a className="one-tap__btn is-small is-whatsapp" href={customerChat(c.phone, '')} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </p>
          )}
          {c.email && <p className="order-card__muted">{c.email}</p>}
          {(c.businessName || c.gstin) && <p className="order-card__muted">{[c.businessName, c.gstin && `GSTIN ${c.gstin}`].filter(Boolean).join(' · ')}</p>}
        </div>
        <div className="order-card__block">
          <h3>Send to</h3>
          <address>
            {a.line1}
            {a.line2 && <br />}
            {a.line2}
            <br />
            {[a.city, a.state].filter(Boolean).join(', ')} {a.pincode && <strong>{a.pincode}</strong>}
          </address>
          <CopyButton text={addressText} label="Copy address" />
        </div>
        <div className="order-card__block order-card__items">
          <h3>Items</h3>
          <ul>
            {items.map((l, i) => {
              const src = thumb(typeof l.product === 'object' ? l.product?.id : l.product)
              return (
                <li key={i}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- already-small admin thumbnails */}
                  {src ? <img src={src} alt="" width={48} height={48} /> : <span className="order-card__noimg" />}
                  <span>
                    <strong>{l.title}</strong>
                    <small>{[l.variantLabel, l.frameLabel].filter(Boolean).join(' · ')}</small>
                  </span>
                  <span className="order-card__qty">
                    {l.qty ?? 1} × {money(l.unitPrice)}
                  </span>
                </li>
              )
            })}
          </ul>
          <dl className="order-card__totals">
            <dt>Items</dt>
            <dd>{money(data.subtotal)}</dd>
            {!!data.shipping && (
              <>
                <dt>Shipping</dt>
                <dd>{money(data.shipping)}</dd>
              </>
            )}
            {!!data.codFee && (
              <>
                <dt>COD fee</dt>
                <dd>{money(data.codFee)}</dd>
              </>
            )}
            {!!data.giftWrapFee && (
              <>
                <dt>Gift wrap</dt>
                <dd>{money(data.giftWrapFee)}</dd>
              </>
            )}
            <dt className="is-total">Total</dt>
            <dd className="is-total">{money(data.total)}</dd>
          </dl>
          <p>
            <span className={`status-chip ${data.paymentMode === 'cod' ? 'is-busy' : 'is-done'}`}>{data.paymentMode === 'cod' ? 'Cash on delivery: collect ' + money(data.total) : 'Paid online'}</span>
          </p>
        </div>
        {data.giftNote && (
          <div className="order-card__block order-card__gift">
            <h3>Gift card message</h3>
            <p>{data.giftNote}</p>
            <small>Write this on the card. It is not printed on the invoice.</small>
          </div>
        )}
      </section>
    </>
  )
}
