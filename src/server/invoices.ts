import 'server-only'
import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { getPayload, type PayloadRequest } from 'payload'
import { financialYear, invoiceLines, invoiceNumber, invoiceTotals, isIntraState, type InvoiceItem } from '@/lib/gst'
import type { TaxClass } from '@/payload-types'

const taxClass = (v: unknown) => (v && typeof v === 'object' ? (v as TaxClass) : null)

/**
 * Issues the order's GST invoice once (a second call returns the first one).
 * The number comes from a per-year counter row updated in the same transaction as the insert:
 * concurrent issuers wait for each other, and a failed insert leaves no gap in the series.
 * Called from an admin save (`req`), it joins that save's transaction, which holds the order row until it commits.
 */
export async function issueInvoice(orderId: number, req?: PayloadRequest) {
  const payload = await getPayload({ config })
  const existing = await payload.find({ collection: 'invoices', where: { order: { equals: orderId } }, limit: 1, depth: 0 })
  if (existing.docs[0]) return existing.docs[0]

  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0 })
  const [site, commerce] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings', depth: 0 }),
    payload.findGlobal({ slug: 'commerce-settings', depth: 1 }),
  ])
  const productIds = (order.items ?? []).map((it) => it.product).filter((id): id is number => typeof id === 'number')
  const { docs: products } = await payload.find({
    collection: 'products',
    where: { id: { in: productIds } },
    select: { taxClass: true },
    depth: 1,
    limit: productIds.length || 1,
  })
  const fallback = taxClass(commerce.tax?.defaultTaxClass)
  const classOf = (id: unknown) => taxClass(products.find((p) => p.id === id)?.taxClass) ?? fallback

  const items: InvoiceItem[] = (order.items ?? []).map((it) => {
    const tc = classOf(it.product)
    if (!tc) console.error(`Invoice for order ${orderId}: no tax class for "${it.title}", using 0%`)
    return {
      description: [it.title, it.variantLabel, it.frameLabel].filter(Boolean).join(' — '),
      hsn: tc?.hsn ?? '',
      qty: it.qty ?? 1,
      total: it.lineTotal ?? 0,
      rate: tc?.rate ?? 0,
    }
  })
  const sellerState = commerce.tax?.sellerState || 'Maharashtra'
  const buyerState = order.address?.state ?? ''
  const taxed = Boolean(site.business?.gstin)
  const lines = invoiceLines(
    items,
    [
      { description: 'Delivery charges', total: order.shipping ?? 0 },
      { description: 'Cash on delivery fee', total: order.codFee ?? 0 },
      { description: 'Gift wrap', total: order.giftWrapFee ?? 0 },
    ],
    isIntraState(buyerState, sellerState),
    taxed,
  )

  const issuedAt = new Date()
  const fy = financialYear(issuedAt)
  const outer = req?.transactionID ? await req.transactionID : undefined
  const transactionID = outer ?? (await payload.db.beginTransaction())
  const tx = (transactionID ? payload.db.sessions?.[transactionID]?.db : undefined) as typeof payload.db.drizzle | undefined
  if (!transactionID || !tx) throw new Error('Invoice numbering needs a database transaction')
  try {
    const r = await tx.execute(sql`
      INSERT INTO payload.document_sequences (series, fy, next) VALUES ('INV', ${fy}, 2)
      ON CONFLICT (series, fy) DO UPDATE SET next = document_sequences.next + 1
      RETURNING next - 1 AS n`)
    const a = order.address
    const invoice = await payload.create({
      collection: 'invoices',
      req: outer ? req : { transactionID },
      data: {
        number: invoiceNumber(fy, Number((r.rows[0] as { n: number | string }).n)),
        documentType: taxed ? 'tax_invoice' : 'bill_of_supply',
        issuedAt: issuedAt.toISOString(),
        financialYear: fy,
        order: order.id,
        orderPublicId: order.publicId,
        seller: {
          legalName: site.business?.legalName || site.brandName || '',
          gstin: site.business?.gstin || undefined,
          state: sellerState,
          address: [site.business?.address, site.business?.city].filter(Boolean).join(', '),
        },
        buyer: {
          name: order.customer?.name,
          phone: order.customer?.phone,
          businessName: order.customer?.businessName || undefined,
          gstin: order.customer?.gstin || undefined,
          address: [a?.line1, a?.line2, a?.city, a?.pincode].filter(Boolean).join(', '),
          state: buyerState,
        },
        lines,
        totals: invoiceTotals(lines),
      },
    })
    if (!outer) await payload.db.commitTransaction(transactionID)
    return invoice
  } catch (error) {
    if (!outer) await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}
