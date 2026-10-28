import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dueAt, myOrdersWhere, orderEmails, ownsOrder, scopeExport } from './privacy.ts'

const rows = {
  orders: [
    { id: 1, createdAt: '2026-10-02T00:00:00Z', account: 7, customer: { phone: '9000000001', email: 'Me@x.in' } },
    { id: 2, createdAt: '2026-10-03T00:00:00Z', account: null, customer: { phone: '9000000001', email: 'old@x.in' } }, // a guest order with her phone, placed after she made the account
    { id: 4, createdAt: '2026-09-01T00:00:00Z', account: null, customer: { phone: '9000000001', email: 'prev@x.in' } }, // before her account: the number's earlier owner
    { id: 3, createdAt: '2026-10-02T00:00:00Z', account: 8, customer: { phone: '9000000002', email: 'other@x.in' } },
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
const me = { id: 7, phone: '9000000001', since: '2026-10-01T00:00:00Z', visitorId: 'vid-mine' }

test('the emails come from orders linked to this account only, not guest orders matched by phone', () => {
  assert.deepEqual(orderEmails(rows.orders, me), ['me@x.in'])
})

test('guest orders match by phone only if placed after the account was made', () => {
  assert.equal(ownsOrder(rows.orders[0], me), true) // linked
  assert.equal(ownsOrder(rows.orders[1], me), true) // guest, after
  assert.equal(ownsOrder(rows.orders[2], me), false) // guest, before: recycled number
  assert.equal(ownsOrder(rows.orders[1], { ...me, since: undefined }), false) // no account date: no phone match
  assert.deepEqual(myOrdersWhere({ id: 7, phone: '9000000001', since: 'S' }).or?.[1], { and: [{ 'customer.phone': { equals: '9000000001' } }, { createdAt: { greater_than_equal: 'S' } }] })
})

test('an export holds only this customer rows', () => {
  const out = scopeExport({ ...me, emails: orderEmails(rows.orders, me) }, rows)
  assert.deepEqual(out.orders.map((o) => o.id), [1, 2])
  assert.deepEqual(out.enrolments.map((o) => o.id), [10])
  assert.deepEqual(out.progress.map((o) => o.id), [100])
  assert.deepEqual(out.certificates.map((o) => o.id), [20])
  assert.deepEqual(out.reviews.map((o) => o.id), [30])
  assert.deepEqual(out.consents.map((o) => o.id), [40, 41, 43])
  assert.deepEqual(out.subscribers.map((o) => o.id), [50]) // old@x.in was a guest order's address
})

test('without a visitor id or emails, nothing extra leaks in', () => {
  const out = scopeExport({ id: 99, phone: '', emails: [] }, rows)
  for (const k of Object.keys(out) as (keyof typeof out)[]) assert.equal(out[k].length, 0)
})

test('a request is due in 30 days', () => {
  assert.equal(dueAt(Date.UTC(2026, 9, 1)), '2026-10-31T00:00:00.000Z')
})
