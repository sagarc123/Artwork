import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalisePhone, validateEnquiry } from './enquiry.ts'

const form = (entries: Record<string, string | string[]>) => {
  const f = new FormData()
  for (const [k, v] of Object.entries(entries)) for (const x of [v].flat()) f.append(k, x)
  return f
}

test('normalisePhone accepts common Indian formats', () => {
  assert.equal(normalisePhone('98765 43210'), '9876543210')
  assert.equal(normalisePhone('+91-98765-43210'), '9876543210')
  assert.equal(normalisePhone('919876543210'), '9876543210')
  assert.equal(normalisePhone('09876543210'), '9876543210')
  assert.equal(normalisePhone('12345 67890'), null) // must start 6–9
  assert.equal(normalisePhone('98765'), null)
})

test('valid event enquiry is cleaned', () => {
  const r = validateEnquiry(
    form({ type: 'event', name: '  Priya   Joshi ', phone: '98765 43210', eventDate: '2026-12-14', styles: ['flower', 'dot'], offers: 'yes', locale: 'mr' }),
    '2026-10-22',
  )
  assert.ok(r.ok)
  if (r.ok) {
    assert.equal(r.data.name, 'Priya Joshi')
    assert.equal(r.data.phone, '9876543210')
    assert.deepEqual(r.data.styles, ['flower', 'dot'])
    assert.equal(r.data.wantsOffers, true)
    assert.equal(r.data.locale, 'mr')
  }
})

test('bad input lists every problem', () => {
  const r = validateEnquiry(form({ type: 'party', name: 'A', phone: '123', email: 'no-at', eventDate: '2026-01-01' }), '2026-10-22')
  assert.deepEqual(r.ok ? [] : r.errors, ['type', 'name', 'phone', 'email', 'date'])
})

test('impossible dates are rejected', () => {
  for (const eventDate of ['2026-13-45', '2026-02-30', '2026-11-31']) {
    const r = validateEnquiry(form({ type: 'event', name: 'Priya', phone: '9876543210', eventDate }), '2026-10-22')
    assert.deepEqual(r.ok ? [] : r.errors, ['date'], eventDate)
  }
})
