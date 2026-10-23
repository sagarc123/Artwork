import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Product } from '@/payload-types'
import * as cart from './cart.ts'
import { codBlock, parsePincodes, priceCart, reconcileCart } from './cart.ts'

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

test('gift wrap: once per order, only with something physical, added to the total', () => {
  const { giftWrapCharge, orderTotal } = cart
  assert.equal(giftWrapCharge(true, [{ type: 'print' }, { type: 'original' }], 49), 49)
  assert.equal(giftWrapCharge(true, [{ type: 'digital' }], 49), 0)
  assert.equal(giftWrapCharge(false, [{ type: 'print' }], 49), 0)
  assert.equal(orderTotal({ total: 999 }, 49, 49), 1097)
  assert.equal(orderTotal({ total: 999 }), 999)
})

test('festival sale: whole IST days, inclusive of the last day, off when disabled or out of range', () => {
  const { saleIsOn, nextSaleChange } = cart
  // Owner picked 1 Nov to 3 Nov (stored at noon UTC, as the date picker does).
  const sale = { enabled: true, percent: 20, startsAt: '2026-11-01T12:00:00.000Z', endsAt: '2026-11-03T12:00:00.000Z' }
  assert.equal(saleIsOn(sale, new Date('2026-10-31T18:29:59Z')), false) // 23:59 IST on 31 Oct
  assert.equal(saleIsOn(sale, new Date('2026-10-31T18:30:00Z')), true) // midnight IST, 1 Nov
  assert.equal(saleIsOn(sale, new Date('2026-11-03T18:29:59Z')), true) // last minute of 3 Nov IST
  assert.equal(saleIsOn(sale, new Date('2026-11-03T18:30:00Z')), false)
  assert.equal(saleIsOn({ ...sale, enabled: false }, new Date('2026-11-02T00:00:00Z')), false)
  assert.equal(saleIsOn({ ...sale, percent: 60 }, new Date('2026-11-02T00:00:00Z')), false)
  assert.equal(saleIsOn({ enabled: true, percent: 10 }, new Date()), true) // no dates: on until switched off
  assert.equal(nextSaleChange(sale, new Date('2026-10-31T18:00:00Z')), 30 * 60_000)
  assert.equal(nextSaleChange({ enabled: true, percent: 10 }, new Date()), null)
})

test('festival sale: rounds to whole rupees, strikes the old price, only chosen categories, checkout charges the sale price', () => {
  const { applySale, salePrice } = cart
  assert.equal(salePrice(999, 15), 849) // 849.15
  assert.equal(salePrice(6500, 10), 5850)
  assert.equal(salePrice(899, 50), 450) // 449.5 rounds up
  const now = new Date('2026-11-02T06:00:00Z')
  const withCats = products.map((p, i) => ({ ...p, category: i === 1 ? 7 : { id: 3 } })) as Product[]
  const sale = { enabled: true, percent: 10, categories: [{ id: 3 }] }
  const sold = applySale(withCats, sale, now)
  assert.equal(sold[0].variants[0].price, 5850)
  assert.equal(sold[0].variants[0].compareAtPrice, 6500)
  assert.equal(sold[1].variants[0].price, 900) // category 7 not in the sale
  assert.equal(applySale(withCats, { ...sale, categories: [] }, now)[1].variants[0].price, 810) // empty = all
  assert.equal(applySale(withCats, { ...sale, enabled: false }, now), withCats)
  // The cart and checkout price from the sale products.
  const q = priceCart([{ slug: 'original', variantId: 'v1', qty: 1 }], sold)
  assert.equal(q.lines[0].unitPrice, 5850)
  assert.equal(q.lines[0].wasTotal, 6500) // crossed out in the cart
  assert.equal(q.total, 5850)
})

test('reconcileCart drops pieces the server no longer prices and caps quantities', () => {
  const sent = [
    { slug: 'gone', variantId: 'x', qty: 1 },
    { slug: 'print', variantId: 'v2', qty: 9 },
    { slug: 'original', variantId: 'v1', frameId: 'f1', qty: 1 },
  ]
  const priced = [
    { slug: 'print', variantId: 'v2', qty: 5 },
    { slug: 'original', variantId: 'v1', frameId: 'f1', qty: 1 },
  ]
  const r = reconcileCart(sent, priced)
  assert.equal(r?.removed, 1)
  assert.deepEqual(r?.lines.map((l) => [l.slug, l.qty]), [['print', 5], ['original', 1]])
  assert.equal(reconcileCart(sent.slice(2), priced), null) // nothing to change
  assert.deepEqual(reconcileCart(sent, [])?.lines, []) // everything gone → empty cart, count 0
})
