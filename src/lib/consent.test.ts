import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bannerNeeded, CONSENT_VERSION, DENIED, effectiveConsent, parseConsent, serializeConsent, trackingAllowed } from './consent.ts'

test('a saved choice reads back, and anything else means "not decided"', () => {
  assert.deepEqual(parseConsent(serializeConsent({ analytics: true, marketing: false })), { analytics: true, marketing: false })
  assert.deepEqual(parseConsent(`${CONSENT_VERSION}:a0m1`), { analytics: false, marketing: true })
  for (const bad of [undefined, null, '', 'a1m1', `${CONSENT_VERSION}:a2m0`, `${CONSENT_VERSION}:a1m1;x`, '2020-01-v0:a1m1', '<script>']) assert.equal(parseConsent(bad), null)
})

test('the default is denied', () => {
  assert.deepEqual(effectiveConsent(undefined), DENIED)
  assert.deepEqual(effectiveConsent('garbage'), DENIED)
  assert.deepEqual(effectiveConsent(`${CONSENT_VERSION}:a1m1`), { analytics: true, marketing: true })
})

test('tracking is never allowed for under-18 pages or the player', () => {
  assert.equal(trackingAllowed('/shop'), true)
  assert.equal(trackingAllowed('/mr/courses/x'), true)
  assert.equal(trackingAllowed('/courses/kids-rangoli', { under18Page: true }), false)
  assert.equal(trackingAllowed('/account', { under18Account: true }), false)
  assert.equal(trackingAllowed('/account'), true)
  assert.equal(trackingAllowed('/learn/x/1'), false)
  assert.equal(trackingAllowed('/hi/learn/x/1'), false)
  assert.equal(trackingAllowed('/learning-tips'), true)
})

test('the banner shows only when there is something to ask, nothing is saved, and tracking is allowed here', () => {
  const both = { analytics: true, marketing: true }
  assert.equal(bannerNeeded(both, null, '/'), true)
  assert.equal(bannerNeeded({ analytics: false, marketing: false }, null, '/'), false) // nothing to consent to
  assert.equal(bannerNeeded({ analytics: true, marketing: false }, null, '/'), true)
  assert.equal(bannerNeeded(both, DENIED, '/'), false)
  assert.equal(bannerNeeded(both, null, '/courses/k', { under18Page: true }), false)
  assert.equal(bannerNeeded(both, null, '/learn/c/1'), false)
})
