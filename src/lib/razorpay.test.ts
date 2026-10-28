import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { readCapped, verifyPaymentSignature, verifyWebhookSignature } from './razorpay.ts'

const secret = 'test_secret'
const sign = (data: string) => createHmac('sha256', secret).update(data).digest('hex')

test('accepts a genuine payment signature and rejects tampering', () => {
  const good = sign('order_123|pay_456')
  assert.equal(verifyPaymentSignature('order_123', 'pay_456', good, secret), true)
  assert.equal(verifyPaymentSignature('order_123', 'pay_999', good, secret), false)
  assert.equal(verifyPaymentSignature('order_123', 'pay_456', 'short', secret), false)
})

test('webhook signature is checked over the exact raw body', () => {
  const body = '{"event":"payment.captured"}'
  assert.equal(verifyWebhookSignature(body, sign(body), secret), true)
  assert.equal(verifyWebhookSignature(`${body} `, sign(body), secret), false)
})

test('the webhook body is capped by what is read, whatever content-length says', async () => {
  const post = (body: string, headers: Record<string, string> = {}) => new Request('http://x.test/', { method: 'POST', body, headers })
  assert.equal(await readCapped(post('{"a":1}'), 100), '{"a":1}')
  assert.equal(await readCapped(post('x'.repeat(101), { 'content-length': '5' }), 100), null) // a lying content-length does not help
  assert.equal(await readCapped(post('x'.repeat(100)), 100), 'x'.repeat(100))
})
