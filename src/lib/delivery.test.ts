import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deliveryFor, deliveryWindow } from './delivery.ts'

const rules = {
  minDays: 5,
  maxDays: 8,
  zones: [
    { prefix: '4', minDays: 3, maxDays: 5, cod: true },
    { prefix: '411', minDays: 2, maxDays: 3, cod: true },
    { prefix: '79', minDays: 8, maxDays: 12, cod: false },
  ],
}

test('the longest matching prefix wins; others get the default', () => {
  assert.deepEqual(deliveryFor('411004', rules), { minDays: 2, maxDays: 3, codHere: true })
  assert.deepEqual(deliveryFor('431001', rules), { minDays: 3, maxDays: 5, codHere: true })
  assert.deepEqual(deliveryFor('795001', rules), { minDays: 8, maxDays: 12, codHere: false })
  assert.deepEqual(deliveryFor('110001', rules), { minDays: 5, maxDays: 8, codHere: true })
})

test('bad PIN codes and bad table rows are ignored', () => {
  assert.equal(deliveryFor('41100', rules), null)
  assert.equal(deliveryFor('011004', rules), null)
  const odd = { ...rules, zones: [{ prefix: '', minDays: 1, maxDays: 1 }, { prefix: '1100', minDays: 1, maxDays: 1 }, { prefix: '11', minDays: 4, maxDays: 2 }] }
  assert.deepEqual(deliveryFor('110001', odd), { minDays: 4, maxDays: 4, codHere: true }) // max never below min
})

test('delivery window counts calendar days from today', () => {
  assert.deepEqual(deliveryWindow('2026-10-27', { minDays: 4, maxDays: 7 }), ['2026-10-31', '2026-11-03'])
})
