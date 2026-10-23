import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addDays, deliveryRange, festivalCountdown, localToday, sortFestivals } from './dates.ts'

test('adding days crosses months and years', () => {
  assert.equal(addDays('2026-10-30', 5), '2026-11-04')
  assert.equal(addDays('2026-12-30', 3), '2027-01-02')
  assert.deepEqual(deliveryRange('2026-10-23'), ['2026-10-28', '2026-10-31'])
  assert.equal(localToday(new Date(2026, 0, 5)), '2026-01-05')
})

test('festival countdown: days left, order a week before, book three days before', () => {
  assert.deepEqual(festivalCountdown('2026-11-08T12:00:00.000Z', '2026-10-23'), { days: 16, orderBy: '2026-11-01', bookBy: '2026-11-05' })
  assert.deepEqual(festivalCountdown('2026-11-08', '2026-11-04'), { days: 4, orderBy: null, bookBy: '2026-11-05' })
  assert.deepEqual(festivalCountdown('2026-11-08', '2026-11-08'), { days: 0, orderBy: null, bookBy: null })
  assert.equal(festivalCountdown('2026-11-08', '2026-11-09'), null)
})

test('upcoming festivals first, soonest first; past and undated keep the owner order', () => {
  const list = [
    { slug: 'diwali', nextDate: '2026-11-08', order: 1 },
    { slug: 'ganesh', nextDate: '2026-09-14', order: 2 },
    { slug: 'gudi', nextDate: '2027-04-07', order: 3 },
    { slug: 'wedding', nextDate: null, order: 0 },
  ]
  assert.deepEqual(sortFestivals(list, '2026-10-23').map((f) => f.slug), ['diwali', 'gudi', 'wedding', 'ganesh'])
})
