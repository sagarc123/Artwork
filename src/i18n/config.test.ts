import { test } from 'node:test'
import assert from 'node:assert/strict'
import { localePath, preferredLocale, resolveLocaleRoute, stripLocale } from './config.ts'

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

test('preferredLocale reads Accept-Language by weight', () => {
  assert.equal(preferredLocale('mr-IN,mr;q=0.9,en;q=0.8'), 'mr')
  assert.equal(preferredLocale('en-US,en;q=0.9,hi;q=0.8'), 'en')
  assert.equal(preferredLocale('fr;q=0.9,hi;q=0.5'), 'hi')
  assert.equal(preferredLocale('en;q=0.2,mr;q=0.6'), 'mr')
  assert.equal(preferredLocale('mr;q=0,de'), 'en')
  assert.equal(preferredLocale(''), 'en')
  assert.equal(preferredLocale(undefined), 'en')
})

test('first visit follows the browser language; a remembered choice wins', () => {
  assert.deepEqual(resolveLocaleRoute('/shop', undefined, 'mr-IN,mr;q=0.9'), { action: 'redirect', to: '/mr/shop', remember: 'mr' })
  assert.deepEqual(resolveLocaleRoute('/', undefined, 'hi-IN'), { action: 'redirect', to: '/hi', remember: 'hi' })
  assert.deepEqual(resolveLocaleRoute('/shop', 'en', 'mr-IN'), { action: 'rewrite', to: '/en/shop' })
  assert.deepEqual(resolveLocaleRoute('/shop', undefined, 'en-GB'), { action: 'rewrite', to: '/en/shop' })
  assert.deepEqual(resolveLocaleRoute('/hi/shop', undefined, 'mr'), { action: 'next' })
})
