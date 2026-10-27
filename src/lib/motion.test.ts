import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canAutoplay, clampPct, firstView, revealClip } from './motion.ts'

test('autoplay only with motion on, on a capable device and connection', () => {
  assert.equal(canAutoplay({ reducedMotion: false }), true)
  assert.equal(canAutoplay({ reducedMotion: false, motion: 'on', effectiveType: '4g' }), true)
  assert.equal(canAutoplay({ reducedMotion: true }), false)
  assert.equal(canAutoplay({ reducedMotion: false, motion: 'off' }), false)
  assert.equal(canAutoplay({ reducedMotion: false, fx: 'lite' }), false)
  assert.equal(canAutoplay({ reducedMotion: false, saveData: true }), false)
  assert.equal(canAutoplay({ reducedMotion: false, effectiveType: '3g' }), false)
  assert.equal(canAutoplay({ reducedMotion: false, effectiveType: 'slow-2g' }), false)
})

test('slider value maps to a clip of the photo layer', () => {
  assert.equal(revealClip(50), 'inset(0 50% 0 0)')
  assert.equal(revealClip(0), 'inset(0 100% 0 0)')
  assert.equal(revealClip(100), 'inset(0 0% 0 0)')
  assert.equal(revealClip(130), 'inset(0 0% 0 0)')
  assert.equal(revealClip(-5), 'inset(0 100% 0 0)')
  assert.equal(clampPct(Number.NaN), 50)
})

test('thank-you moment plays once per order', () => {
  const m = new Map<string, string>()
  const store = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
  assert.equal(firstView(store, 'ty:abc'), true)
  assert.equal(firstView(store, 'ty:abc'), false)
  assert.equal(firstView(store, 'ty:def'), true)
  const blocked = { getItem: () => { throw new Error('blocked') }, setItem: () => {} }
  assert.equal(firstView(blocked, 'ty:abc'), true)
  // Inlined as a script: the source must work on its own.
  const inlined = new Function('s', `return (${firstView.toString()})(s, 'ty:xyz')`)
  assert.equal(inlined(store), true)
  assert.equal(inlined(store), false)
})
