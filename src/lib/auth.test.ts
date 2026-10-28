import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canSend, checkCode, hashCode, mayLogSecrets, newCode, OTP_MAX_TOTAL, OTP_MAX_TRIES, OTP_MINUTES, readSession, safeNext, showTestCode, signSession, type OtpRow } from './auth.ts'

const secret = 'test-secret-test-secret-test-secret'
const T0 = Date.UTC(2026, 9, 28, 10, 0, 0)
const row = (code: string, over: Partial<OtpRow> = {}): OtpRow => ({ codeHash: hashCode('9876543210', code, secret), expiresAt: T0 + OTP_MINUTES * 60_000, attempts: 0, sentAt: T0, ...over })

test('codes are 6 digits, and only a keyed hash is stored', () => {
  for (let i = 0; i < 200; i++) assert.match(newCode(), /^\d{6}$/)
  const h = hashCode('9876543210', '123456', secret)
  assert.match(h, /^[0-9a-f]{64}$/)
  assert.ok(!h.includes('123456'))
  assert.notEqual(h, hashCode('9876543210', '123456', 'other-secret'))
  // The code is tied to its phone number.
  assert.notEqual(h, hashCode('9876543211', '123456', secret))
})

test('a code checks out once, until it expires', () => {
  const r = row('123456')
  assert.equal(checkCode(r, '9876543210', '123456', secret, T0 + 1000), 'ok')
  assert.equal(checkCode(r, '9876543210', '654321', secret, T0 + 1000), 'wrong')
  assert.equal(checkCode(r, '9876543211', '123456', secret, T0 + 1000), 'wrong') // another phone
  assert.equal(checkCode(r, '9876543210', '123456', secret, T0 + OTP_MINUTES * 60_000 - 1), 'ok')
  assert.equal(checkCode(r, '9876543210', '123456', secret, T0 + OTP_MINUTES * 60_000), 'expired') // 10 minutes is the end
  assert.equal(checkCode(null, '9876543210', '123456', secret, T0), 'none')
})

test('5 wrong tries lock that visitor address only; the right owner on another address still gets in', () => {
  const r = row('123456', { attempts: OTP_MAX_TRIES })
  assert.equal(checkCode(r, '9876543210', '123456', secret, T0 + 1000, OTP_MAX_TRIES), 'locked') // the attacker's address
  assert.equal(checkCode(r, '9876543210', '123456', secret, T0 + 1000, 0), 'ok') // the owner's address
  assert.equal(checkCode(r, '9876543210', '123456', secret, T0 + 1000, OTP_MAX_TRIES - 1), 'ok')
})

test('the overall bound: many addresses together burn the code', () => {
  assert.equal(checkCode(row('123456', { attempts: OTP_MAX_TOTAL }), '9876543210', '123456', secret, T0 + 1000, 0), 'locked')
  assert.equal(checkCode(row('123456', { attempts: OTP_MAX_TOTAL - 1 }), '9876543210', '123456', secret, T0 + 1000, 0), 'ok')
})

test('a new code: a 30 second pause, and a burned code does not block the owner', () => {
  assert.equal(canSend(null, T0), 'ok')
  assert.equal(canSend(row('1'), T0 + 10_000), 'wait')
  assert.equal(canSend(row('1'), T0 + 30_000), 'ok')
  assert.equal(canSend(row('1', { attempts: OTP_MAX_TOTAL }), T0 + 60_000), 'ok')
})

test('test mode (codes in the log) is never on in production', () => {
  assert.equal(mayLogSecrets('production'), false)
  assert.equal(mayLogSecrets('development'), true)
  assert.equal(mayLogSecrets(undefined), true)
})

test('the code is shown on screen only in development without an SMS provider', () => {
  assert.equal(showTestCode('development', false), true)
  assert.equal(showTestCode('production', false), false)
  assert.equal(showTestCode('production', true), false)
  assert.equal(showTestCode('development', true), false)
  assert.equal(showTestCode(undefined, false), false)
  assert.equal(showTestCode('test', false), false)
})

test('session tokens: signed, expiring, tamper-proof', () => {
  const token = signSession(42, secret, T0)
  assert.equal(readSession(token, secret, T0 + 1000), 42)
  assert.equal(readSession(token, 'other-secret-other-secret-other', T0 + 1000), null)
  assert.equal(readSession(token, secret, T0 + 31 * 86_400_000), null) // 30 days
  const [, exp, sig] = token.split('.')
  assert.equal(readSession(`43.${exp}.${sig}`, secret, T0), null) // another customer id
  assert.equal(readSession(`42.${Number(exp) + 99999}.${sig}`, secret, T0), null) // longer expiry
  assert.equal(readSession(undefined, secret, T0), null)
  assert.equal(readSession('42.1.abc', secret, T0), null)
})

test('after sign-in only paths on this site are followed', () => {
  assert.equal(safeNext('/checkout'), '/checkout')
  assert.equal(safeNext('/account?tab=orders'), '/account?tab=orders')
  for (const bad of ['https://evil.example', '//evil.example', '/\\evil.example', 'javascript:alert(1)', '', undefined, 5]) assert.equal(safeNext(bad), '/account')
})
