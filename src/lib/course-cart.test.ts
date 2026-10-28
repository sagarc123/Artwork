import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Product } from '@/payload-types'
import { CHILD_NAME_MAX, codBlock, COURSE_VARIANT, giftWrapCharge, needsSignIn, priceCart, type CartCourse } from './cart.ts'
import { seatsToCreate } from './courses.ts'

// Courses (part 2a): a course is a digital line that needs an account.
const print = { id: 1, slug: 'print', title: 'print', type: 'print', variants: [{ id: 'v2', label: 'A4', price: 900, stock: 5, reserved: 0 }], framing: [], images: [] } as unknown as Product
const products = [print]
const course = (over: object = {}) => ({ id: 7, slug: 'rangoli-101', title: 'Rangoli 101', price: 999, salePrice: null, thumbnail: null, audience: 'all', ...over }) as unknown as CartCourse
const seat = { slug: 'rangoli-101', variantId: COURSE_VARIANT, qty: 1 }
const aPrint = { slug: 'print', variantId: 'v2', qty: 1 }

test('a course line: priced by the server, no shipping, one seat only', () => {
  const q = priceCart([{ ...seat, qty: 5 }], products, [course()])
  assert.equal(q.lines[0].unitPrice, 999)
  assert.equal(q.lines[0].qty, 1)
  assert.equal(q.lines[0].type, 'digital')
  assert.equal(q.shipping, 0) // under the free-delivery line, yet nothing to post
  assert.equal(q.total, 999)
  assert.ok(q.ok)
  assert.equal(priceCart([seat, seat], products, [course()]).lines.length, 1) // the same course twice
  assert.equal(priceCart([seat], products, [course({ salePrice: 499 })]).total, 499)
  assert.equal(priceCart([seat], products, []).lines.length, 0) // unpublished: dropped
})

test('a course beside a print: only the print is posted', () => {
  const q = priceCart([seat, aPrint], products, [course()])
  assert.equal(q.shipping, 99)
  assert.equal(q.total, 999 + 900 + 99)
})

test('no cash on delivery for a course, alone or with a print', () => {
  const rules = { enabled: true, maxTotal: 50_000, fee: 49, blockedPincodes: [] }
  assert.equal(codBlock(rules, priceCart([seat], products, [course()]).lines, 999), 'type')
  assert.equal(codBlock(rules, priceCart([seat, aPrint], products, [course()]).lines, 1900), 'type')
})

test('gift wrap is never charged for a course', () => {
  assert.equal(giftWrapCharge(true, priceCart([seat], products, [course()]).lines, 49), 0)
})

test('a course needs sign-in; a print does not', () => {
  assert.equal(needsSignIn([seat]), true)
  assert.equal(needsSignIn([seat, aPrint]), true)
  assert.equal(needsSignIn([aPrint]), false)
  assert.equal(needsSignIn([]), false)
})

test("the child's first name and the parent's consent ride only on under-18 courses", () => {
  const adult = priceCart([{ ...seat, childName: 'Anaya', consent: true }], products, [course()]).lines[0]
  assert.equal(adult.childName, undefined)
  assert.equal(adult.consent, undefined)
  const kids = course({ audience: 'kids' })
  const ok = priceCart([{ ...seat, childName: '  Anaya  ', consent: true }], products, [kids]).lines[0]
  assert.equal(ok.childName, 'Anaya')
  assert.equal(ok.consent, true)
  assert.equal(priceCart([{ ...seat, childName: 'Anaya' }], products, [kids]).lines[0].consent, false) // no tick: the server refuses
  assert.equal(priceCart([{ ...seat, childName: 'x'.repeat(200), consent: true }], products, [course({ audience: 'teens' })]).lines[0].childName?.length, CHILD_NAME_MAX)
})

test('a paid order makes one seat per course, and a repeat makes none', () => {
  const items = [{ course: 7, childFirstName: ' Anaya ', guardianConsent: true }, { course: 7 }, { course: null }, { course: 9 }, {}]
  assert.deepEqual(seatsToCreate(items, []), [
    { course: 7, childFirstName: 'Anaya', guardianConsent: true },
    { course: 9, childFirstName: null, guardianConsent: false },
  ])
  // The webhook arrives again (or the browser confirmed first): everything exists already.
  assert.deepEqual(seatsToCreate(items, [7, 9]), [])
  // Already owns one of them (an earlier order or a hand-added seat): only the other is made.
  assert.deepEqual(seatsToCreate(items, [7]).map((s) => s.course), [9])
})
