import { test } from 'node:test'
import assert from 'node:assert/strict'
import { festiveKindOf, festiveLook, festiveWindows, fixedSeason, pickWindow, siteSeason } from './festive.ts'

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

test('site look: fixed choices win, a picked decoration keeps auto festive', () => {
  assert.equal(fixedSeason('everyday', 'diwali'), 'everyday')
  assert.equal(fixedSeason('festive', 'off'), 'festive')
  assert.equal(fixedSeason('auto', 'ganesh'), 'festive')
  assert.equal(fixedSeason('auto', 'auto'), null)
  assert.equal(fixedSeason(null, 'off'), null)
})

test('site look auto: festive in the three weeks before a festival, everyday otherwise (decoration off too)', () => {
  assert.equal(siteSeason('auto', 'auto', festivals, '2026-10-27'), 'festive')
  assert.equal(siteSeason('auto', 'off', festivals, '2026-10-27'), 'festive')
  assert.equal(siteSeason('auto', 'auto', festivals, '2026-06-01'), 'everyday')
  assert.equal(siteSeason('everyday', 'auto', festivals, '2026-10-27'), 'everyday')
  assert.equal(siteSeason('festive', 'auto', festivals, '2026-06-01'), 'festive')
})

test('festival windows are soonest first and match the head script check', () => {
  const w = festiveWindows(festivals)
  assert.deepEqual(w[0], ['diwali', '2026-10-18', '2026-11-08'])
  assert.equal(pickWindow(w, '2026-10-17'), null)
  assert.equal(pickWindow(w, '2026-11-08'), 'diwali')
})
