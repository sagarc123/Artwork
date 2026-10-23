import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cubic, kolam, noRepeat, pickMedium, taperedPath, type Pt } from './art.ts'

test('tapered stroke is a closed outline, thin at the ends and widest in the middle', () => {
  const line: Pt[] = cubic([0, 0], [3, 0], [7, 0], [10, 0], 5)
  const d = taperedPath(line, 2, 1, 0)
  assert.match(d, /^M.*Z$/)
  const pts = d.slice(1, -1).split(/[L ]/).map((p) => p.split(',').map(Number))
  assert.equal(pts.length, 10) // both sides of 5 centre points
  const width = (i: number) => Math.abs(pts[i][1] - pts[pts.length - 1 - i][1])
  assert.ok(width(0) < 0.05 && width(4) < 0.05)
  assert.ok(Math.abs(width(2) - 2) < 0.05)
})

test('bias moves the fat end of the stroke towards the start', () => {
  const line: Pt[] = cubic([0, 0], [3, 0], [7, 0], [10, 0], 9)
  const pts = taperedPath(line, 2, 0.5, 0).slice(1, -1).split(/[L ]/).map((p) => Number(p.split(',')[1]))
  assert.ok(Math.abs(pts[2]) > Math.abs(pts[6]))
})

test('kolam line is one closed loop and every dot is drawn', () => {
  const { d, dots } = kolam(4, 5, 2)
  assert.equal(dots.length, 20)
  assert.equal((d.match(/M/g) ?? []).length, 1)
  assert.ok(d.endsWith('Z'))
})

test('stand-in medium follows the category, medium or title in any language', () => {
  assert.equal(pickMedium(['drawings', 'Charcoal', 'Old wada'], 'x'), 'drawing')
  assert.equal(pickMedium(['art-commissions', 'Aaji, from a photo'], 'x'), 'portrait')
  assert.equal(pickMedium(['art-paintings', 'River ghat at dusk'], 'x'), 'painting')
  assert.equal(pickMedium(['rangoli-designs', 'रांगोळीचे रंग'], 'x'), 'rangoli')
  assert.equal(pickMedium(['Ganesh sketch print'], 'x'), 'drawing')
  assert.equal(pickMedium(['Surface study'], 'x') === 'portrait', false)
  assert.equal(pickMedium([], 'same'), pickMedium([undefined], 'same'))
})

test('neighbouring stand-ins never share a rangoli style', () => {
  const out = noRepeat(['kolam', 'kolam', 'kolam', 'phool', 'phool'])
  out.forEach((s, i) => i && assert.notEqual(s, out[i - 1]))
})
