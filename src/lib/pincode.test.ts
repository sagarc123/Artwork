import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isPincode, parsePincodeResponse } from './pincode.ts'

test('India Post success → district as city, and state', () => {
  const json = [{ Message: 'Number of pincode(s) found:3', Status: 'Success', PostOffice: [{ Name: 'Shivajinagar', District: 'Pune', State: 'Maharashtra' }] }]
  assert.deepEqual(parsePincodeResponse(json), { city: 'Pune', state: 'Maharashtra' })
})

test('errors and odd shapes → null', () => {
  assert.equal(parsePincodeResponse([{ Message: 'No records found', Status: 'Error', PostOffice: null }]), null)
  assert.equal(parsePincodeResponse([{ Status: 'Success', PostOffice: [] }]), null)
  assert.equal(parsePincodeResponse({}), null)
  assert.equal(parsePincodeResponse(null), null)
})

test('pincodes are six digits, not starting with 0', () => {
  assert.ok(isPincode('411004'))
  assert.ok(!isPincode('011004'))
  assert.ok(!isPincode('41100'))
})
