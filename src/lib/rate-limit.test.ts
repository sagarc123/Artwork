import { test } from 'node:test'
import assert from 'node:assert/strict'
import { clientIp, envInt, windowStart } from './rate-limit.ts'

const h = (o: Record<string, string>) => (n: string) => o[n] ?? null

test('calls in the same window share a start, the next window gets a new one', () => {
  assert.equal(windowStart(1_000_500, 60_000), 960_000)
  assert.equal(windowStart(1_019_999, 60_000), 960_000)
  assert.equal(windowStart(1_020_000, 60_000), 1_020_000)
})

test('env numbers: only positive whole numbers count', () => {
  assert.equal(envInt('300', 5), 300)
  assert.equal(envInt(undefined, 5), 5)
  assert.equal(envInt('0', 5), 5)
  assert.equal(envInt('-2', 5), 5)
  assert.equal(envInt('abc', 5), 5)
  assert.equal(envInt('1.5', 5), 5)
})

test('the client address is the rightmost entry, not the one the client wrote', () => {
  const xff = h({ 'x-forwarded-for': '6.6.6.6, 1.2.3.4' }) // 6.6.6.6 is a forged first entry
  assert.equal(clientIp(xff, { onVercel: false, trustedHops: 1 }), '1.2.3.4')
  assert.equal(clientIp(h({ 'x-forwarded-for': '6.6.6.6, 1.2.3.4, 10.0.0.1' }), { onVercel: false, trustedHops: 2 }), '1.2.3.4')
  assert.equal(clientIp(xff, { onVercel: false, trustedHops: 0 }), 'unknown') // no proxy: the header is not believed
  assert.equal(clientIp(h({}), { onVercel: false, trustedHops: 1 }), 'unknown')
  assert.equal(clientIp(h({ 'x-forwarded-for': '1.2.3.4' }), { onVercel: false, trustedHops: 3 }), 'unknown') // fewer hops than trusted
})

test('on Vercel the platform header wins; elsewhere it is ignored', () => {
  const both = h({ 'x-vercel-forwarded-for': '9.9.9.9', 'x-forwarded-for': '1.2.3.4' })
  assert.equal(clientIp(both, { onVercel: true, trustedHops: 1 }), '9.9.9.9')
  assert.equal(clientIp(both, { onVercel: false, trustedHops: 1 }), '1.2.3.4')
})
