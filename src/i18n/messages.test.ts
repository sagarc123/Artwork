import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const load = (l: string) => JSON.parse(readFileSync(new URL(`./messages/${l}.json`, import.meta.url), 'utf8')) as unknown
const flat = (o: unknown, p = ''): [string, string][] =>
  typeof o === 'string' ? [[p, o]] : o && typeof o === 'object' ? Object.entries(o).flatMap(([k, v]) => flat(v, p ? `${p}.${k}` : k)) : []

const en = new Map(flat(load('en')))
// Words that stay in Latin script in Marathi and Hindi too (brands, payment and tax terms, units).
const KEEP = new Set(['whatsapp', 'instagram', 'youtube', 'facebook', 'google', 'razorpay', 'siddesh', 'mokashi', 'upi', 'gst', 'otp', 'gstin', 'cod', 'pdf', 'sms', 'email', 'pincode', 'hsn', 'rangoli', 'a4', 'a3', 'a2', 'png', 'jpg', 'jpeg', 'mp4', 'visa', 'mastercard', 'rupay', 'paytm', 'phonepe', 'gpay', 'gmail', 'wifi', 'qr', 'ok'])

// langStrip is the first-visit language chooser: each language is deliberately named in its own words, English included.
/** A value left in English: identical to the English text and still holds a real English word (after dropping {tokens}, URLs, emails and the allowlist). */
const untranslated = (en: string, v: string) =>
  v === en && (en.replace(/\{[^}]*\}|https?:\/\/\S+|\S+@\S+/g, ' ').match(/[A-Za-z]{4,}/g) ?? []).some((w) => !KEEP.has(w.toLowerCase()))

for (const l of ['mr', 'hi']) {
  const tr = new Map(flat(load(l)))
  test(`${l}.json has every en.json key, filled in`, () => {
    const bad = [...en.keys()].filter((k) => !tr.get(k)?.trim())
    assert.deepEqual(bad, [])
  })
  test(`${l}.json has no keys that en.json lacks`, () => {
    assert.deepEqual([...tr.keys()].filter((k) => !en.has(k)), [])
  })
  test(`${l}.json has no untranslated English sentences`, () => {
    assert.deepEqual([...en].filter(([k, v]) => !k.startsWith('langStrip.') && tr.has(k) && untranslated(v, tr.get(k)!)).map(([k, v]) => `${k}: ${v}`), [])
  })
}
