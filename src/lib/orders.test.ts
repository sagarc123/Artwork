import { test } from 'node:test'
import assert from 'node:assert/strict'
import { adjustedStock, cancelPlan, reservedFixes, stepBack } from './orders.ts'

test('cancel: waiting orders release holds, COD restocks, paid online needs the owner and a refund', () => {
  assert.deepEqual(cancelPlan('pending_payment', 'prepaid'), { status: 'cancelled', stock: 'release', ownerOnly: false })
  assert.deepEqual(cancelPlan('cod_pending_confirmation', 'cod'), { status: 'cancelled', stock: 'release', ownerOnly: false })
  assert.deepEqual(cancelPlan('packed', 'cod'), { status: 'cancelled', stock: 'restock', ownerOnly: false })
  for (const from of ['paid', 'packed', 'shipped']) assert.deepEqual(cancelPlan(from, 'prepaid'), { status: 'needs_refund', stock: 'restock', ownerOnly: true })
  for (const from of ['delivered', 'cancelled', 'needs_refund', 'refunded']) assert.equal(cancelPlan(from, 'prepaid'), null)
  assert.equal(cancelPlan('delivered', 'cod'), null)
})

test('undo goes back one step, never past a sale or an invoice', () => {
  assert.equal(stepBack('packed', 'prepaid'), 'paid')
  assert.equal(stepBack('packed', 'cod'), 'cod_confirmed')
  assert.equal(stepBack('shipped', 'cod'), 'packed')
  assert.equal(stepBack('cod_confirmed', 'cod'), null)
  assert.equal(stepBack('delivered', 'prepaid'), null)
})

test('stock changes never drop below held or zero', () => {
  assert.equal(adjustedStock(5, 0, 3), 8)
  assert.equal(adjustedStock(5, 2, -10), 2)
  assert.equal(adjustedStock(1, 0, -4), 0)
})

test('held stock follows the waiting orders', () => {
  const variants = [
    { id: 'a', reserved: 2 },
    { id: 'b', reserved: 1 },
    { id: 'c', reserved: 0 },
    { id: 'd', reserved: null },
  ]
  const open = [
    { variantId: 'a', qty: 1 },
    { variantId: 'a', qty: 1 },
    { variantId: 'c', qty: 3 },
    { variantId: null, qty: 9 },
  ]
  assert.deepEqual(reservedFixes(variants, open), [
    { id: 'b', from: 1, to: 0 },
    { id: 'c', from: 0, to: 3 },
  ])
})
