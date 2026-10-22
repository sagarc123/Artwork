import { test } from 'node:test'
import assert from 'node:assert/strict'
import { seededRandom } from './seed.ts'

test('same seed gives the same sequence (each artwork keeps its rangoli)', () => {
  const a = seededRandom('monsoon-evening')
  const b = seededRandom('monsoon-evening')
  const seqA = [a(), a(), a()]
  assert.deepEqual(seqA, [b(), b(), b()])
  assert.ok(seqA.every((n) => n >= 0 && n < 1))
})

test('different seeds give different sequences', () => {
  assert.notEqual(seededRandom('diwali')(), seededRandom('ganesh')())
})
