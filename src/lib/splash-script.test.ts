import { test } from 'node:test'
import assert from 'node:assert/strict'
import { splashScript } from './splash-script.ts'

// Run the script against a small fake page: it must set the flag once, and respect every reason to stay quiet.
function run(opts: { season?: string; seen?: boolean; motion?: string; reduce?: boolean; ua?: string; path?: string; fx?: string }) {
  const store: Record<string, string> = opts.seen ? { 'sm-splash': '1' } : {}
  const dataset: Record<string, string | undefined> = { season: opts.season ?? 'everyday', motion: opts.motion, fx: opts.fx }
  const timers: (() => void)[] = []
  const fn = new Function('d', 'sessionStorage', 'matchMedia', 'navigator', 'location', 'setTimeout', splashScript)
  fn({ dataset }, { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v) }, () => ({ matches: !!opts.reduce }), { userAgent: opts.ua ?? 'Mozilla/5.0 Chrome' }, { pathname: opts.path ?? '/' }, (f: () => void) => timers.push(f))
  return { flag: dataset.splash, stored: store['sm-splash'], afterTimers: (() => { timers.forEach((t) => t()); return dataset.splash })() }
}

test('first visit: the flag is set, remembered, and removed by the failsafe if nothing took it over', () => {
  const r = run({})
  assert.equal(r.flag, '')
  assert.equal(r.stored, '1')
  assert.equal(r.afterTimers, undefined)
})
test('a second visit in the session, festive, calm modes, bots and shop pages get none', () => {
  for (const o of [{ seen: true }, { season: 'festive' }, { motion: 'off' }, { reduce: true }, { ua: 'Googlebot/2.1' }, { ua: 'Chrome-Lighthouse' }, { path: '/cart' }, { path: '/mr/checkout/pay' }, { path: '/hi/order/123' }]) {
    assert.equal(run(o).flag, undefined, JSON.stringify(o))
  }
  assert.equal(run({ path: '/mr/shop' }).flag, '')
})
test('slow phones get a fade, not the full splash', () => {
  const r = run({ fx: 'lite' })
  assert.equal(r.flag, 'fade')
  assert.equal(r.afterTimers, undefined)
})
