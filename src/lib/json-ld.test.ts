import { test } from 'node:test'
import assert from 'node:assert/strict'
import { jsonLdText } from './json-ld.ts'

test('a closing script tag in CMS text cannot break out of the JSON-LD script', () => {
  const out = jsonLdText({ name: '</script><script>alert(1)</script>' })
  assert.ok(!out.includes('<'))
  assert.ok(out.includes('\\u003c/script>'))
  assert.equal(JSON.parse(out).name, '</script><script>alert(1)</script>') // still the same text for a parser
})
