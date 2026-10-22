import { razorpayConfig, verifyWebhookSignature } from '@/lib/razorpay'
import { markPaid } from '@/server/order-service'

/** Razorpay → us: the reliable record of a payment (works even if the visitor closed the page). */
export async function POST(request: Request) {
  const secret = razorpayConfig()?.webhookSecret
  // ponytail: trusts content-length; Razorpay always sends it. Real payloads are a few KB.
  if (Number(request.headers.get('content-length')) > 1_000_000) return Response.json({ error: 'too large' }, { status: 413 })
  const raw = await request.text()
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
  if ((body.event === 'payment.captured' || body.event === 'order.paid') && paymentId && orderId) await markPaid(orderId, paymentId)
  return Response.json({ ok: true })
}
