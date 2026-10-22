import { razorpayConfig, verifyWebhookSignature } from '@/lib/razorpay'
import { markPaid } from '@/server/order-service'

/** Razorpay → us: the reliable record of a payment (works even if the visitor closed the page). */
export async function POST(request: Request) {
  const secret = razorpayConfig()?.webhookSecret
  const raw = await request.text()
  const signature = request.headers.get('x-razorpay-signature') ?? ''
  if (!secret || !verifyWebhookSignature(raw, signature, secret)) return Response.json({ error: 'invalid signature' }, { status: 400 })

  const body = JSON.parse(raw) as {
    event: string
    payload?: { payment?: { entity?: { id?: string; order_id?: string } }; order?: { entity?: { id?: string } } }
  }
  const paymentId = body.payload?.payment?.entity?.id
  const orderId = body.payload?.order?.entity?.id ?? body.payload?.payment?.entity?.order_id
  if ((body.event === 'payment.captured' || body.event === 'order.paid') && paymentId && orderId) await markPaid(orderId, paymentId)
  return Response.json({ ok: true })
}
