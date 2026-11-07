import { test } from 'node:test'
import assert from 'node:assert/strict'
import { kolamPath, type Box } from './kolam.ts'

const W = 1280

test('the thread stays in the gutter, right of every box', () => {
  const boxes: Box[] = [{ l: 24, r: 1100, t: 100, b: 700 }, { l: 24, r: 900, t: 700, b: 900 }]
  const { d, loops } = kolamPath({ width: W, y0: 120, y1: 880, boxes, marks: [300, 500] })
  const pts = [...d.matchAll(/[ML]([\d.]+) ([\d.]+)/g)].map((m) => [+m[1], +m[2]])
  assert.ok(pts.length > 50)
  for (const [x, y] of pts) assert.ok(x > (y < 700 ? 1100 : 900), `x ${x} at y ${y}`)
  assert.equal(loops, 2)
})

test('the content column is a floor: nothing in the way still keeps it in the gutter', () => {
  const { d } = kolamPath({ width: W, y0: 100, y1: 400, boxes: [{ l: 24, r: 600, t: 0, b: 900 }], marks: [], floor: 1256 })
  for (const m of d.matchAll(/[ML]([0-9.]+) /g)) assert.ok(+m[1] > 1256)
})

test('rests where there is no room; slim has no loops', () => {
  const full: Box[] = [{ l: 0, r: W, t: 300, b: 340 }]
  const { d } = kolamPath({ width: W, y0: 100, y1: 600, boxes: full, marks: [] })
  assert.ok(d.split('M').length - 1 >= 2, 'two runs, with a gap where the full-width box is')
  assert.equal(kolamPath({ width: W, y0: 100, y1: 600, boxes: [], marks: [200, 300], slim: true }).loops, 0)
  // a 24px gutter is too tight for a loop (radius under 4)
  assert.equal(kolamPath({ width: W, y0: 100, y1: 600, boxes: [{ l: 24, r: W - 24, t: 0, b: 900 }], marks: [200] }).loops, 0)
})

test('the ring only when it clears everything else', () => {
  const btn: Box = { l: 1000, r: 1240, t: 500, b: 560 }
  assert.equal(kolamPath({ width: W, y0: 100, y1: 700, boxes: [btn], marks: [], ring: btn }).ring, true)
  const near: Box = { l: 1000, r: 1275, t: 562, b: 640 }
  assert.equal(kolamPath({ width: W, y0: 100, y1: 700, boxes: [btn, near], marks: [], ring: btn }).ring, false)
})
