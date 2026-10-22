import config from '@payload-config'
import { getPayload } from 'payload'
import { renderInvoicePdf } from '@/server/invoice-pdf'
import { allow } from '@/server/rate-limit'

const notFound = () => new Response('Not found', { status: 404, headers: { 'Cache-Control': 'private, no-store' } })

/** The invoice PDF for an order. The unguessable order link id is the key, the same as the order page. */
export async function GET(_request: Request, { params }: RouteContext<'/api/invoices/[publicId]'>) {
  const { publicId } = await params
  if (!/^[A-Za-z0-9_-]{12}$/.test(publicId)) return notFound()
  if (!(await allow('invoice', 30, 60_000))) return new Response('Too many requests', { status: 429 })
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'invoices', where: { orderPublicId: { equals: publicId } }, limit: 1, depth: 0 })
  const invoice = docs[0]
  if (!invoice) return notFound()
  const pdf = await renderInvoicePdf(invoice)
  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoice.number.replaceAll('/', '-')}.pdf"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  })
}
