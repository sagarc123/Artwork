// Razorpay helpers. Secrets come from env and never reach the browser (only the public key id does).
import { createHmac, timingSafeEqual } from 'node:crypto'

const hmac = (secret: string, data: string) => createHmac('sha256', secret).update(data).digest('hex')
const sameText = (a: string, b: string) => {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/** Signature Razorpay Checkout returns to the browser after payment. */
export const verifyPaymentSignature = (orderId: string, paymentId: string, signature: string, secret: string) =>
  sameText(hmac(secret, `${orderId}|${paymentId}`), signature)

/** Signature on webhook calls (computed over the raw request body). */
export const verifyWebhookSignature = (rawBody: string, signature: string, secret: string) => sameText(hmac(secret, rawBody), signature)

export function razorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  return keyId && keySecret ? { keyId, keySecret, webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET } : null
}

/** Creates a Razorpay order for the amount in paise. */
export async function createRazorpayOrder(amountPaise: number, receipt: string) {
  const c = razorpayConfig()
  if (!c) throw new Error('Razorpay keys are not set')
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Basic ${Buffer.from(`${c.keyId}:${c.keySecret}`).toString('base64')}` },
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt }),
    // A stuck call would keep the buyer waiting and the stock held; the caller cancels the order on any error.
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Razorpay order failed: ${res.status} ${await res.text()}`)
  return (await res.json()) as { id: string; amount: number }
}
