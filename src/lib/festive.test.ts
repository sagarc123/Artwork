import { test } from 'node:test'
import assert from 'node:assert/strict'
import { festiveKindOf, festiveLook } from './festive.ts'

const festivals = [
  { slug: 'diwali', nextDate: '2026-11-08T12:00:00.000Z' },
  { slug: 'ganesh-chaturthi', nextDate: '2027-09-04T12:00:00.000Z' },
  { slug: 'wedding', nextDate: null },
  { slug: 'navratri', nextDate: '2026-10-30' },
]

test('festival slugs map to a decoration; unknown ones get none', () => {
  assert.equal(festiveKindOf('ganesh-chaturthi'), 'ganesh')
  assert.equal(festiveKindOf('gudi-padwa'), 'gudi')
  assert.equal(festiveKindOf('wedding'), 'wedding')
  assert.equal(festiveKindOf('navratri'), null)
})

test('automatic: on for the three weeks before a festival, through the day itself', () => {
  assert.equal(festiveLook('auto', festivals, '2026-10-18'), 'diwali') // 21 days before
  assert.equal(festiveLook('auto', festivals, '2026-10-17'), null) // 22 days before
  assert.equal(festiveLook('auto', festivals, '2026-11-08'), 'diwali')
  assert.equal(festiveLook('auto', festivals, '2026-11-09'), null)
  assert.equal(festiveLook(null, festivals, '2026-10-27'), 'diwali') // unset means automatic
})

test('automatic picks the soonest festival', () => {
  const both = [...festivals, { slug: 'gudi-padwa', nextDate: '2026-11-01' }]
  assert.equal(festiveLook('auto', both, '2026-10-27'), 'gudi')
})

test('a chosen look always shows; off never does', () => {
  assert.equal(festiveLook('ganesh', festivals, '2026-01-01'), 'ganesh')
  assert.equal(festiveLook('off', festivals, '2026-11-08'), null)
})
