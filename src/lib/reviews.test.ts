import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkCourseReview, checkProductReview, cleanText, photoOk, productBought, reviewErrors, reviewerName, sniffImage, summarise, TEXT_MAX } from './reviews.ts'

const order = (status: string, product: number, type = 'original') => ({ status, items: [{ product, type }] })

test('a product can be reviewed after delivery, or when a digital one is paid', () => {
  assert.equal(productBought([order('delivered', 7)], 7), true)
  assert.equal(productBought([order('shipped', 7)], 7), false)
  assert.equal(productBought([order('paid', 7)], 7), false) // a paid painting is not delivered yet
  assert.equal(productBought([order('paid', 7, 'digital')], 7), true)
  assert.equal(productBought([order('cancelled', 7, 'digital')], 7), false)
  assert.equal(productBought([order('delivered', 8)], 7), false) // someone else's product
  assert.equal(productBought([], 7), false)
})

test('one review per customer per item', () => {
  assert.equal(checkProductReview(true, false), 'ok')
  assert.equal(checkProductReview(true, true), 'already')
  assert.equal(checkProductReview(false, false), 'not_buyer')
})

test('a course needs a seat and 30 percent', () => {
  assert.equal(checkCourseReview(true, 30, false), 'ok')
  assert.equal(checkCourseReview(true, 29, false), 'too_early')
  assert.equal(checkCourseReview(false, 100, false), 'not_enrolled')
  assert.equal(checkCourseReview(true, 100, true), 'already')
})

test('average and count', () => {
  assert.deepEqual(summarise([5, 4, 4]), { count: 3, average: 4.3 })
  assert.deepEqual(summarise([]), { count: 0, average: 0 })
  assert.deepEqual(summarise([5, 0, 9, 2.5, 3]), { count: 2, average: 4 }) // out-of-range values are ignored
})

test('review text is plain, short and escaped of markup', () => {
  assert.equal(cleanText('Lovely <b>work</b> <script>alert(1)</script>!'), 'Lovely work alert(1) !')
  assert.equal(cleanText('a < b > c'), 'a c')
  assert.equal(cleanText('x'.repeat(5000)).length, TEXT_MAX)
  assert.equal(cleanText(42), '')
  assert.deepEqual(reviewErrors(5, 'long enough text'), [])
  assert.deepEqual(reviewErrors(6, 'short'), ['rating', 'text'])
  assert.deepEqual(reviewErrors(4.5, 'long enough text'), ['rating'])
})

test('the public name is first name and an initial only', () => {
  assert.equal(reviewerName('priya sunil kulkarni'), 'priya K.')
  assert.equal(reviewerName('Asha'), 'Asha')
  assert.equal(reviewerName('  '), '')
  assert.equal(reviewerName(null), '')
})

test('photos are checked by their bytes and size', () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0])
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0])
  const webp = new Uint8Array([...Buffer.from('RIFF'), 0, 0, 0, 0, ...Buffer.from('WEBP')])
  assert.equal(sniffImage(jpeg), 'image/jpeg')
  assert.equal(sniffImage(png), 'image/png')
  assert.equal(sniffImage(webp), 'image/webp')
  assert.equal(sniffImage(new Uint8Array(Buffer.from('<svg onload=alert(1)></svg>'))), null)
  assert.equal(photoOk(jpeg), true)
  assert.equal(photoOk(new Uint8Array(0)), false)
  assert.equal(photoOk(new Uint8Array(5 * 1024 * 1024).fill(0xff, 0, 3)), false) // too big
})
