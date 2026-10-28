import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cleanEmail, csvCell, nextStatus, signToken, verifyToken } from './newsletter.ts'

const S = 'a-long-test-secret'
const HOUR = 3_600_000

test('a token works for its purpose until it expires', () => {
  const t = signToken('confirm', 'a@b.in', S, 1000, 48 * HOUR)
  assert.equal(verifyToken(t, 'confirm', S, 1000 + 47 * HOUR), 'a@b.in')
  assert.equal(verifyToken(t, 'confirm', S, 1000 + 48 * HOUR), null) // expired
  assert.equal(verifyToken(t, 'unsubscribe', S, 2000), null) // a confirm link cannot unsubscribe
})

test('a changed, foreign or broken token is refused', () => {
  const t = signToken('confirm', 'a@b.in', S, 1000, HOUR)
  assert.equal(verifyToken(t, 'confirm', 'another-secret', 2000), null)
  const [body, sig] = t.split('.')
  const forged = Buffer.from(JSON.stringify({ p: 'confirm', e: 'evil@x.in', x: 9e15 })).toString('base64url')
  assert.equal(verifyToken(`${forged}.${sig}`, 'confirm', S, 2000), null)
  assert.equal(verifyToken(`${body}.`, 'confirm', S, 2000), null)
  for (const bad of ['', 'x', 'a.b.c', null, undefined, 5]) assert.equal(verifyToken(bad, 'confirm', S, 2000), null)
})

test('pending, then confirmed, then unsubscribed', () => {
  assert.equal(nextStatus(null, 'subscribe'), 'pending')
  assert.equal(nextStatus('pending', 'confirm'), 'confirmed')
  assert.equal(nextStatus('confirmed', 'unsubscribe'), 'unsubscribed')
  assert.equal(nextStatus('pending', 'unsubscribe'), 'unsubscribed')
})

test('states that must not move', () => {
  assert.equal(nextStatus('unsubscribed', 'confirm'), null) // an old confirm link cannot bring someone back
  assert.equal(nextStatus('unsubscribed', 'subscribe'), 'pending') // only a new sign-up, with a new confirm
  assert.equal(nextStatus('confirmed', 'subscribe'), null)
  assert.equal(nextStatus('confirmed', 'confirm'), null)
  assert.equal(nextStatus(null, 'confirm'), null)
  assert.equal(nextStatus(null, 'unsubscribe'), null)
})

test('addresses are tidied and checked', () => {
  assert.equal(cleanEmail('  Asha@Example.IN '), 'asha@example.in')
  for (const bad of ['', 'a', 'a@b', 'a b@c.in', 'a@b.in, c@d.in', '<x>@y.in', null]) assert.equal(cleanEmail(bad), null)
})

test('spreadsheet cells cannot run as formulas', () => {
  assert.equal(csvCell('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`)
  assert.equal(csvCell('+91@x.in'), "'+91@x.in")
  assert.equal(csvCell('a,b'), '"a,b"')
  assert.equal(csvCell(null), '')
})
