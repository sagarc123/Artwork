import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { verifyPaymentSignature, verifyWebhookSignature } from './razorpay.ts'

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
