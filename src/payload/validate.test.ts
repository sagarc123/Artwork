import { test } from 'node:test'
import assert from 'node:assert/strict'
import { slugify, validateVariants } from './fields.ts'

test('slugify makes clean ASCII web addresses', () => {
  assert.equal(slugify('Monsoon Evening!'), 'monsoon-evening')
  assert.equal(slugify('  Ganesh   Rangoli -- 2026 '), 'ganesh-rangoli-2026')
  assert.equal(slugify('दिवाळी'), '')
})

test('originals are one of one', () => {
  assert.equal(validateVariants('original', [{ stock: 1 }]), true)
  assert.equal(validateVariants('original', [{ stock: 0 }]), true)
  assert.match(String(validateVariants('original', [{ stock: 2 }])), /stock 0/)
  assert.match(String(validateVariants('original', [{ stock: 1 }, { stock: 1 }])), /exactly one/)
})

test('prints and digital need at least one variant', () => {
  assert.match(String(validateVariants('print', [])), /at least one/)
  assert.equal(validateVariants('print', [{ stock: 50 }, { stock: 20 }]), true)
})
