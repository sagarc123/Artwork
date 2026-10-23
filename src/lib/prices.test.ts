import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { ServicePrice } from '@/payload-types'
import { eventFrom, eventSizeHints, fromText, lowest, portraitFrom, portraitHints } from './prices.ts'

const fmt = (n: number) => `₹${n}`
const prices = {
  id: 1,
  events: { small: 1500, medium: 3500, large: null },
  portraits: { pencil: { a4: 1800, a3: 2800, a2: 4500 }, charcoal: { a4: 2200, a3: 0 }, colour: {} },
} as unknown as ServicePrice

test('lowest ignores empty and zero prices', () => {
  assert.equal(lowest([null, 0, 3500, 1500, undefined]), 1500)
  assert.equal(lowest([null, undefined]), null)
})

test('"from" prices for events and portraits', () => {
  assert.equal(eventFrom(prices), 1500)
  assert.equal(portraitFrom(prices), 1800)
  assert.equal(eventFrom(null), null)
  assert.equal(fromText('from {price}', 1500, fmt), 'from ₹1500')
  assert.equal(fromText('from {price}', null, fmt), null)
})

test('chip hints only for prices that are filled in', () => {
  assert.deepEqual(eventSizeHints(prices, fmt), { small: '₹1500', medium: '₹3500' })
  assert.deepEqual(portraitHints(prices, fmt), { medium: { pencil: '₹1800', charcoal: '₹2200' }, paperSize: { A4: '₹1800', A3: '₹2800', A2: '₹4500' } })
})
