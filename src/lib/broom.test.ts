import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bandWidth, frontLine, frontStart, polygon } from './broom.ts'

const sw = { W: 1440, H: 900 }

test('the front starts fully off the left edge and ends fully off the right', () => {
  for (const w of [320, 390, 1024, 1440]) {
    const s = { W: w, H: 800 }
    const start = frontLine(s, frontStart(s, 0))
    const end = frontLine(s, frontStart(s, 1))
    // the whole band (three colours wide) is out of sight at the start; the whole front is past the edge at the end
    assert.ok(Math.max(...start.map(([x]) => x)) < 0, `start ${w}`) // the band trails the front by its own width
    assert.ok(Math.min(...end.map(([x]) => x)) > w, `end ${w}`)
  }
})

test('the front only ever moves right', () => {
  let last = -Infinity
  for (let i = 0; i <= 50; i++) {
    const s = frontStart(sw, i / 50)
    assert.ok(s >= last)
    last = s
  }
})

test('the swept and unswept areas are valid polygons with the same number of points', () => {
  const line = frontLine(sw, frontStart(sw, 0.5), 123)
  const a = polygon(line, sw.W, true)
  const b = polygon(line, sw.W, false)
  assert.equal(a.split(',').length, b.split(',').length)
  assert.match(a, /^polygon\(/)
})
