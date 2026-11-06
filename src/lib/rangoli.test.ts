import { test } from 'node:test'
import assert from 'node:assert/strict'
import { festivalWeek, rangoliFor, rangoliToday, seedOf } from './rangoli.ts'

const festivals = [
  { slug: 'diwali', name: 'Diwali', nextDate: '2026-11-08T12:00:00.000Z' },
  { slug: 'ganesh-chaturthi', name: 'Ganesh Chaturthi', nextDate: '2027-09-04' },
  { slug: 'navratri', name: 'Navratri', nextDate: '2026-10-20' },
  { slug: 'wedding', name: 'Wedding', nextDate: null },
]

test('the same date always gives the same design', () => {
  assert.deepEqual(rangoliToday('2026-11-06', festivals), rangoliToday('2026-11-06', [...festivals].reverse()))
  assert.equal(seedOf('2026-11-06'), 20261106)
})

test('different days give different designs', () => {
  const days = Array.from({ length: 30 }, (_, i) => JSON.stringify(rangoliFor(20260101 + i, null)))
  assert.ok(new Set(days).size >= 28)
})

test('parameters stay in range', () => {
  for (let i = 0; i < 400; i++) {
    const r = rangoliFor(20260101 + i, null)
    const n = r.petals
    assert.ok([6, 8, 10, 12].includes(n))
    assert.equal(r.dots.length, n * 3 + n * 2 + n + 1)
    assert.equal(r.lines.length, 3)
    assert.equal(r.shapes.length, 3 + n * 5)
    for (const d of r.dots) assert.ok(Math.hypot(d.x, d.y) <= 90.1 && d.r > 0)
    for (const s of r.shapes) {
      if (s.kind !== 'petal') continue
      assert.ok(s.rx > 0 && s.ry >= 7 && s.ry < 22 && s.angle >= 0 && s.angle < 360)
      assert.ok(r.palette.includes(s.fill))
    }
  }
})

test('festival weeks come from the real dates: 4 days before to 2 days after', () => {
  assert.equal(festivalWeek(festivals, '2026-11-03'), null)
  assert.deepEqual(festivalWeek(festivals, '2026-11-04'), { kind: 'diwali', name: 'Diwali' })
  assert.deepEqual(festivalWeek(festivals, '2026-11-10'), { kind: 'diwali', name: 'Diwali' })
  assert.equal(festivalWeek(festivals, '2026-11-11'), null)
  assert.equal(festivalWeek(festivals, '2026-10-20'), null) // not one of the three motifs
  assert.equal(rangoliToday('2026-11-08', festivals).rangoli.kind, 'diwali')
  assert.equal(rangoliToday('2026-06-01', festivals).rangoli.kind, null)
  assert.equal(rangoliToday('2026-06-01', festivals).festival, null)
})

test('a festival week adds its edge motif', () => {
  const plain = rangoliFor(20261108, null).shapes.length
  assert.equal(rangoliFor(20261108, 'diwali').shapes.length, plain + 8)
  assert.equal(rangoliFor(20261108, 'ganesh').shapes.length, plain + 8)
  assert.equal(rangoliFor(20261108, 'gudi').shapes.length, plain + 12)
})
