import { test } from 'node:test'
import assert from 'node:assert/strict'
import { localePath, resolveLocaleRoute, stripLocale } from './config.ts'

test('localePath keeps English unprefixed and prefixes mr/hi', () => {
  assert.equal(localePath('en', '/shop'), '/shop')
  assert.equal(localePath('en', '/'), '/')
  assert.equal(localePath('mr', '/'), '/mr')
  assert.equal(localePath('hi', 'shop'), '/hi/shop')
})

test('stripLocale removes only a real locale prefix', () => {
  assert.equal(stripLocale('/mr/shop'), '/shop')
  assert.equal(stripLocale('/en'), '/')
  assert.equal(stripLocale('/menu'), '/menu')
})

test('resolveLocaleRoute', () => {
  assert.deepEqual(resolveLocaleRoute('/en/shop'), { action: 'redirect', to: '/shop' })
  assert.deepEqual(resolveLocaleRoute('/mr/shop'), { action: 'next' })
  assert.deepEqual(resolveLocaleRoute('/shop'), { action: 'rewrite', to: '/en/shop' })
  assert.deepEqual(resolveLocaleRoute('/'), { action: 'rewrite', to: '/en' })
  assert.deepEqual(resolveLocaleRoute('/shop', 'hi'), { action: 'redirect', to: '/hi/shop' })
  assert.deepEqual(resolveLocaleRoute('/shop', 'en'), { action: 'rewrite', to: '/en/shop' })
  assert.deepEqual(resolveLocaleRoute('/shop', 'xx'), { action: 'rewrite', to: '/en/shop' })
})
