import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Product } from '@/payload-types'
import { codBlock, parsePincodes, priceCart } from './cart.ts'

const product = (slug: string, type: string, variants: object[], framing: object[] = []) =>
  ({ id: slug.length, slug, title: slug, type, variants, framing, images: [] }) as unknown as Product

const products = [
  product('original', 'original', [{ id: 'v1', label: 'Original', price: 6500, stock: 1, reserved: 0 }], [{ id: 'f1', label: 'Teak', extraPrice: 2400 }]),
  product('print', 'print', [{ id: 'v2', label: 'A4', price: 900, stock: 5, reserved: 0 }]),
  product('sold', 'original', [{ id: 'v3', label: 'Original', price: 8000, stock: 1, reserved: 1 }]),
  product('pdf', 'digital', [{ id: 'v4', label: 'PDF', price: 199, stock: 0, reserved: 0 }]),
]

test('prices come from the database, frames add their price, originals max 1', () => {
  const q = priceCart([{ slug: 'original', variantId: 'v1', frameId: 'f1', qty: 5 }], products)
  assert.equal(q.lines[0].unitPrice, 8900)
  assert.equal(q.lines[0].qty, 1)
  assert.equal(q.shipping, 0) // over ₹2,999
  assert.equal(q.total, 8900)
  assert.ok(q.ok)
})

test('small physical orders pay ₹99 shipping; digital-only ships free', () => {
  assert.equal(priceCart([{ slug: 'print', variantId: 'v2', qty: 2 }], products).total, 1899)
  assert.equal(priceCart([{ slug: 'pdf', variantId: 'v4', qty: 1 }], products).total, 199)
})

test('held or missing items are flagged or dropped', () => {
  const q = priceCart(
    [
      { slug: 'sold', variantId: 'v3', qty: 1 },
      { slug: 'gone', variantId: 'x', qty: 1 },
      { slug: 'print', variantId: 'nope', qty: 1 },
    ],
    products,
  )
  assert.equal(q.lines.length, 1)
  assert.equal(q.lines[0].available, false)
  assert.equal(q.ok, false)
})

test('COD: prints and originals only, fee counts towards the limit, blocked pincodes, one open order', () => {
  const rules = { enabled: true, maxTotal: 5000, fee: 49, blockedPincodes: parsePincodes('700001, 110001\n400001') }
  const print = [{ type: 'print' as const }]
  assert.equal(codBlock(rules, print, 1899), null)
  assert.equal(codBlock({ ...rules, enabled: false }, print, 1899), 'off')
  assert.equal(codBlock(rules, [...print, { type: 'digital' }], 1899), 'type')
  assert.equal(codBlock(rules, print, 4951), null) // 4951 + 49 = 5000
  assert.equal(codBlock(rules, print, 4952), 'limit')
  assert.equal(codBlock(rules, print, 1899, '400001'), 'pincode')
  assert.equal(codBlock(rules, print, 1899, '411001'), null)
  assert.equal(codBlock(rules, print, 1899, '411001', true), 'open')
})
