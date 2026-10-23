import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normaliseOrderNumber, orderProgress } from './track.ts'

test('order numbers are accepted the way people type them', () => {
  for (const raw of ['ART-10482', 'art-10482', ' art 10482 ', '#ART-10482', '10482', 'ART10482']) assert.equal(normaliseOrderNumber(raw), 'ART-10482')
  for (const raw of ['', 'ART-', 'ABC-10482', '10-482', 'ART-12', null]) assert.equal(normaliseOrderNumber(raw), null)
})

test('status maps onto the timeline; cancelled and refunds step off it', () => {
  assert.deepEqual(orderProgress('cod_pending_confirmation'), { step: 0 })
  assert.deepEqual(orderProgress('paid'), { step: 1 })
  assert.deepEqual(orderProgress('cod_confirmed'), { step: 1 })
  assert.deepEqual(orderProgress('delivered'), { step: 4 })
  assert.deepEqual(orderProgress('cancelled'), { stopped: 'cancelled' })
  assert.deepEqual(orderProgress('refunded'), { stopped: 'refund' })
})
