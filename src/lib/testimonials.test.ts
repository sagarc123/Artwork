import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pickTestimonials } from './testimonials.ts'

const all = [
  { id: 1, language: 'en', topic: 'event', featured: true },
  { id: 2, language: 'mr', topic: 'event', featured: false },
  { id: 3, language: 'en', topic: 'portrait', featured: true },
  { id: 4, language: 'en', topic: 'general', featured: false },
  { id: 5, language: 'hi', topic: 'shop', featured: true },
]
const ids = (list: { id: number }[]) => list.map((r) => r.id)

test("a page shows reviews in its own language, English only when there are none", () => {
  assert.deepEqual(ids(pickTestimonials(all, 'mr', 'event')), [2])
  assert.deepEqual(ids(pickTestimonials(all, 'hi', 'event')), [1, 4])
  assert.deepEqual(ids(pickTestimonials(all, 'en', 'event')), [1, 4])
})

test('service pages show their topic and general reviews; home shows the featured ones', () => {
  assert.deepEqual(ids(pickTestimonials(all, 'en', 'portrait')), [3, 4])
  assert.deepEqual(ids(pickTestimonials(all, 'en')), [1, 3])
  assert.deepEqual(ids(pickTestimonials(all, 'hi')), [5])
  assert.deepEqual(ids(pickTestimonials([{ id: 9, language: null, topic: null, featured: null }], 'en', 'event')), [9])
})
