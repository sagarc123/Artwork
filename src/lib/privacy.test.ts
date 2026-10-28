import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dueAt, orderEmails, scopeExport } from './privacy.ts'

const rows = {
  orders: [
    { id: 1, account: 7, customer: { phone: '9000000001', email: 'Me@x.in' } },
    { id: 2, account: null, customer: { phone: '9000000001', email: 'old@x.in' } }, // placed earlier with her verified phone
    { id: 3, account: 8, customer: { phone: '9000000002', email: 'other@x.in' } },
  ],
  enrolments: [{ id: 10, customer: 7 }, { id: 11, customer: { id: 8 } }],
  progress: [{ id: 100, enrolment: 10 }, { id: 101, enrolment: { id: 11 } }],
  certificates: [{ id: 20, customer: 7 }, { id: 21, customer: 8 }],
  reviews: [{ id: 30, customer: 7 }, { id: 31, customer: 8 }],
  consents: [
    { id: 40, customer: 7 },
    { id: 41, subject: 'vid-mine' },
    { id: 42, subject: 'vid-other' },
    { id: 43, email: 'ME@x.in' },
    { id: 44, email: 'other@x.in' },
  ],
  subscribers: [{ id: 50, email: 'me@x.in' }, { id: 51, email: 'old@x.in' }, { id: 52, email: 'other@x.in' }],
}
const me = { id: 7, phone: '9000000001', visitorId: 'vid-mine' }

test('the emails come from this customer only', () => {
  assert.deepEqual(orderEmails(rows.orders, me), ['me@x.in', 'old@x.in'])
})

test('an export holds only this customer rows', () => {
  const out = scopeExport({ ...me, emails: orderEmails(rows.orders, me) }, rows)
  assert.deepEqual(out.orders.map((o) => o.id), [1, 2])
  assert.deepEqual(out.enrolments.map((o) => o.id), [10])
  assert.deepEqual(out.progress.map((o) => o.id), [100])
  assert.deepEqual(out.certificates.map((o) => o.id), [20])
  assert.deepEqual(out.reviews.map((o) => o.id), [30])
  assert.deepEqual(out.consents.map((o) => o.id), [40, 41, 43])
  assert.deepEqual(out.subscribers.map((o) => o.id), [50, 51])
})

test('without a visitor id or emails, nothing extra leaks in', () => {
  const out = scopeExport({ id: 99, phone: '', emails: [] }, rows)
  for (const k of Object.keys(out) as (keyof typeof out)[]) assert.equal(out[k].length, 0)
})

test('a request is due in 30 days', () => {
  assert.equal(dueAt(Date.UTC(2026, 9, 1)), '2026-10-31T00:00:00.000Z')
})
