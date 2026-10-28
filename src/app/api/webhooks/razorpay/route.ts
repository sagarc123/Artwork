import { razorpayConfig, readCapped, verifyWebhookSignature } from '@/lib/razorpay'
import { markPaid } from '@/server/order-service'

/** Razorpay → us: the reliable record of a payment (works even if the visitor closed the page). */
export async function POST(request: Request) {
  const secret = razorpayConfig()?.webhookSecret
  // Real payloads are a few KB. The size is counted as the body is read, not taken from the (forgeable) content-length.
  const raw = await readCapped(request, 1_000_000)
  if (raw === null) return Response.json({ error: 'too large' }, { status: 413 })
  const signature = request.headers.get('x-razorpay-signature') ?? ''
  if (!secret || !verifyWebhookSignature(raw, signature, secret)) return Response.json({ error: 'invalid signature' }, { status: 400 })

  type Body = {
    event: string
    payload?: { payment?: { entity?: { id?: string; order_id?: string } }; order?: { entity?: { id?: string } } }
  }
  let body: Body
  try {
    body = JSON.parse(raw) as Body
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 })
  }
  const paymentId = body.payload?.payment?.entity?.id
  const orderId = body.payload?.order?.entity?.id ?? body.payload?.payment?.entity?.order_id
  if ((body.event === 'payment.captured' || body.event === 'order.paid') && paymentId && orderId) {
    // A payment for an order we cannot find is money taken for nothing: say so loudly, and fail so Razorpay retries (other events are just acknowledged).
    if (!(await markPaid(orderId, paymentId))) {
      console.error(`RAZORPAY WEBHOOK: ${body.event} for unknown order ${orderId} (payment ${paymentId}). Check the dashboard; refund if no order exists.`)
      return Response.json({ error: 'unknown order' }, { status: 500 })
    }
  }
  return Response.json({ ok: true })
}
