import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cleanQuery, fillParts, matches, searchById } from './search.ts'

test('cleanQuery trims, collapses spaces, takes the first value and caps at 100', () => {
  assert.equal(cleanQuery('  diwali   rangoli '), 'diwali rangoli')
  assert.equal(cleanQuery(['ganesh', 'x']), 'ganesh')
  assert.equal(cleanQuery(undefined), '')
  assert.equal(cleanQuery('a'.repeat(150)).length, 100)
})

test('matches needs every word, ignores case, accents and hyphens', () => {
  assert.ok(matches('Peacock', ['Peacock rangoli (sample)']))
  assert.ok(matches('rangoli peacock', ['Peacock rangoli', 'sample-peacock-rangoli']))
  assert.ok(matches('cafe', ['Café sketch']))
  assert.ok(matches('mandal', ['sample-ganesh-mandal']))
  assert.ok(!matches('peacock lotus', ['Peacock rangoli']))
  assert.ok(!matches('   ', ['anything']))
  assert.ok(matches('रांगोळी', ['मोराची रांगोळी']))
})

test('searchById finds a Marathi item through its English twin', () => {
  const mr = [{ id: 1, title: 'मोर' }, { id: 2, title: 'घाट' }]
  const en = [{ id: 1, title: 'Peacock' }, { id: 2, title: 'River ghat' }]
  const hit = searchById('peacock', mr, en, (i) => [i.title])
  assert.deepEqual(hit, [{ id: 1, title: 'मोर' }])
})

test('fillParts fills slots and flags empty ones', () => {
  assert.deepEqual(fillParts('Fee {fee}, up to {max}.', { fee: '₹49', max: '' }), ['Fee ', '₹49', ', up to ', { missing: 'max' }, '.'])
  assert.deepEqual(fillParts('No slots', {}), ['No slots'])
  assert.deepEqual(fillParts('{a}', { a: 0 }), ['0'])
})
