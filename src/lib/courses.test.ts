import { test } from 'node:test'
import assert from 'node:assert/strict'
import { coursePrice, formatDuration, forUnder18, groupSections } from './courses.ts'

test('formatDuration', () => {
  assert.equal(formatDuration(12000), '3h 20m')
  assert.equal(formatDuration(2700), '45m')
  assert.equal(formatDuration(3600), '1h')
  assert.equal(formatDuration(0), '0m')
  assert.equal(formatDuration(3600 + 60, { h: 'ता', m: 'मि' }), '1ता 1मि')
})

test('groupSections orders by lesson order and splits when the section changes', () => {
  const s = groupSections([
    { section: 'B', order: 3 },
    { section: 'A', order: 1 },
    { section: 'A', order: 2 },
  ])
  assert.deepEqual(s.map((x) => [x.title, x.lessons.length]), [['A', 2], ['B', 1]])
})

test('coursePrice uses a lower sale price, and 0 is free', () => {
  assert.deepEqual(coursePrice({ price: 1499, salePrice: 999 }), { now: 999, was: 1499, free: false })
  assert.deepEqual(coursePrice({ price: 1499, salePrice: 1999 }), { now: 1499, was: null, free: false })
  assert.equal(coursePrice({ price: 0 }).free, true)
})

test('under-18 audiences', () => {
  assert.ok(forUnder18('kids') && forUnder18('teens') && !forUnder18('all') && !forUnder18(null))
})
