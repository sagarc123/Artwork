import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  bulkSummary,
  changeLabel,
  cropBox,
  dailySeries,
  festivalPlan,
  fitWithin,
  monthStarts,
  packPlan,
  percentChange,
  presetDates,
  saleCovers,
  saleState,
  soldPlan,
  sparkBars,
} from './admin-tools.ts'
import { saleIsOn } from './cart.ts'
import { festivalReminder } from './admin.ts'

test('sales: month starts, change and a 30-day series with empty days filled', () => {
  assert.deepEqual(monthStarts('2026-10-27'), { thisMonth: '2026-10-01', lastMonth: '2026-09-01' })
  assert.deepEqual(monthStarts('2027-01-05'), { thisMonth: '2027-01-01', lastMonth: '2026-12-01' })
  assert.equal(percentChange(1200, 1000), 20)
  assert.equal(percentChange(500, 0), null)
  assert.equal(changeLabel(-8), '−8%')
  assert.equal(changeLabel(20), '+20%')
  assert.equal(changeLabel(null), null)
  const s = dailySeries([{ day: '2026-10-27', total: 900 }, { day: '2026-09-28', total: 50 }, { day: '2026-09-27', total: 1 }], '2026-10-27')
  assert.equal(s.length, 30)
  assert.deepEqual(s[0], { day: '2026-09-28', total: 50 }) // the 27th is outside the 30 days
  assert.deepEqual(s.at(-1), { day: '2026-10-27', total: 900 })
  assert.equal(s.filter((d) => d.total === 0).length, 28)
})

test('sparkline bars fill the box, tallest bar is full height, empty days are a stub', () => {
  const bars = sparkBars([0, 50, 100], 32, 20, 1)
  assert.equal(bars.length, 3)
  assert.equal(bars[2].h, 20)
  assert.equal(bars[2].y, 0)
  assert.equal(bars[1].h, 10)
  assert.equal(bars[0].h, 1)
  assert.ok(Math.abs(bars[2].x + bars[2].w - 32) < 1e-9)
  assert.ok(sparkBars([0, 0], 10, 10).every((b) => b.h === 1))
})

test('planner: next 90 days only, soonest first, with order-by and book-by deadlines', () => {
  const plan = festivalPlan(
    [
      { id: 1, name: 'Diwali', nextDate: '2026-11-08T00:00:00.000Z' },
      { id: 2, name: 'Past', nextDate: '2026-10-01' },
      { id: 3, name: 'Wedding', nextDate: null },
      { id: 4, name: 'Far', nextDate: '2027-03-01' },
      { id: 5, name: 'Bhaubeej', nextDate: '2026-10-29' },
    ],
    '2026-10-27',
    new Map([[1, 4]]),
  )
  assert.deepEqual(plan.map((p) => p.name), ['Bhaubeej', 'Diwali'])
  assert.equal(plan[1].orderBy, '2026-11-01')
  assert.equal(plan[1].bookBy, '2026-11-05')
  assert.equal(plan[1].reminders, 4)
  assert.equal(plan[1].daysLeft, 12)
  // Two days away: too late to order a parcel or book.
  assert.equal(plan[0].orderBy, null)
  assert.equal(plan[0].bookBy, null)
})

test('sale preset: starts today in India and runs exactly N days', () => {
  const p = presetDates('2026-10-27', 7)
  assert.equal(p.first, '2026-10-27')
  assert.equal(p.last, '2026-11-02')
  assert.equal(p.startsAt, '2026-10-27T06:30:00.000Z')
  const sale = { enabled: true, percent: 10, startsAt: p.startsAt, endsAt: p.endsAt }
  // Just after midnight IST on the first day (still the 26th in UTC) and the last minute of the last day: on.
  assert.ok(saleIsOn(sale, new Date('2026-10-26T18:31:00Z')))
  assert.ok(saleIsOn(sale, new Date('2026-11-02T18:29:00Z')))
  assert.ok(!saleIsOn(sale, new Date('2026-11-02T18:31:00Z')))
  assert.ok(!saleIsOn(sale, new Date('2026-10-26T18:29:00Z')))
  assert.equal(presetDates('2026-10-27', 0).days, 1)
  assert.equal(presetDates('2026-10-27', 500).days, 60)
})

test('sale state and whether it covers a festival', () => {
  const now = new Date('2026-10-27T10:00:00Z')
  const p = presetDates('2026-10-27', 7)
  assert.equal(saleState({ enabled: true, percent: 10, startsAt: p.startsAt, endsAt: p.endsAt }, now), 'on')
  const later = presetDates('2026-11-01', 3)
  assert.equal(saleState({ enabled: true, percent: 10, startsAt: later.startsAt, endsAt: later.endsAt }, now), 'planned')
  assert.equal(saleState({ enabled: false, percent: 10 }, now), 'off')
  assert.equal(saleState(null, now), 'off')
  assert.ok(saleCovers({ enabled: true, percent: 10, startsAt: later.startsAt, endsAt: later.endsAt }, '2026-10-27', '2026-11-08'))
  assert.ok(!saleCovers({ enabled: true, percent: 10, startsAt: later.startsAt, endsAt: later.endsAt }, '2026-10-27', '2026-10-30'))
  assert.ok(saleCovers({ enabled: true, percent: 10 }, '2026-10-27', '2026-10-30'))
  assert.ok(!saleCovers({ enabled: false, percent: 10 }, '2026-10-27', '2026-10-30'))
})

test('bulk: plans skip what cannot change, and the summary says why', () => {
  const plan = packPlan([
    { id: 1, status: 'paid' },
    { id: 2, status: 'cod_confirmed' },
    { id: 3, status: 'shipped' },
    { id: 4, status: 'cod_pending_confirmation' },
  ])
  assert.deepEqual(plan.pack, [1, 2])
  assert.equal(bulkSummary([...plan.pack.map((id) => ({ id, ok: true })), ...plan.skipped], 'packed'), '2 packed, 2 skipped: 1 already shipped, 1 COD not confirmed yet')
  assert.equal(bulkSummary([{ id: 1, ok: true }, { id: 2, ok: true }, { id: 3, ok: false, reason: 'already shipped' }], 'packed'), '2 packed, 1 skipped: already shipped')
  assert.equal(bulkSummary([{ id: 1, ok: true }], 'packed'), '1 packed')
  const sold = soldPlan([
    { id: 1, type: 'original', sold: false },
    { id: 2, type: 'print' },
    { id: 3, type: 'original', sold: true },
  ])
  assert.deepEqual(sold.sell, [1])
  assert.deepEqual(sold.skipped.map((s) => s.reason), ['not an original', 'already sold'])
})

test('photos: resized to at most 2400 px, never enlarged; 4:5 crop follows the drag position', () => {
  assert.deepEqual(fitWithin(4000, 3000), { width: 2400, height: 1800 })
  assert.deepEqual(fitWithin(3000, 4000), { width: 1800, height: 2400 })
  assert.deepEqual(fitWithin(1200, 900), { width: 1200, height: 900 })
  // Landscape 4000×3000: the 4:5 box is 2400×3000, centred by default, slid fully left or right.
  assert.deepEqual(cropBox(4000, 3000), { sx: 800, sy: 0, sw: 2400, sh: 3000 })
  assert.deepEqual(cropBox(4000, 3000, 4 / 5, { x: 0, y: 0.5 }), { sx: 0, sy: 0, sw: 2400, sh: 3000 })
  assert.deepEqual(cropBox(4000, 3000, 4 / 5, { x: 2, y: 0.5 }), { sx: 1600, sy: 0, sw: 2400, sh: 3000 })
  // Tall phone photo 3000×4000: full width, 3750 high.
  assert.deepEqual(cropBox(3000, 4000, 4 / 5, { x: 0.5, y: 1 }), { sx: 0, sy: 250, sw: 3000, sh: 3750 })
})

test('festival reminder is in their language with the date, link and order-by day', () => {
  const r = { name: 'Priya', festival: 'Diwali', date: '2026-11-08', orderBy: '2026-11-01', link: 'https://x.in/festivals/diwali' }
  assert.match(festivalReminder({ ...r, locale: 'en' }), /^Namaste Priya!.*Diwali is on 8 November.*x\.in\/festivals\/diwali.*order by 1 November\.$/)
  assert.match(festivalReminder({ ...r, festival: 'दिवाळी', locale: 'mr' }), /^नमस्कार Priya!.*दिवाळी.*नोव्हेंबर/)
  assert.match(festivalReminder({ ...r, orderBy: null, locale: 'hi' }), /डिज़ाइन यहाँ देखें: https:\/\/x\.in\/festivals\/diwali।$/)
})
