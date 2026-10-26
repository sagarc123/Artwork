import assert from 'node:assert/strict'
import { test } from 'node:test'
import { galleryDocs } from './gallery.ts'

const base = { story: null, year: 2024, images: [], category: 1, medium: null, festival: null }
const art = (id: number, order: number, createdAt: string, product?: { slug: string }) => ({ ...base, id, title: `Art ${id}`, slug: `art-${id}`, order, createdAt, product: product as never })
const shop = (id: number, createdAt: string, showInGallery: boolean) => ({ ...base, id, title: `Shop ${id}`, slug: `shop-${id}`, createdAt, showInGallery })

test('galleryDocs merges artworks with shop pieces shown in the gallery', () => {
  const docs = galleryDocs([art(1, 0, '2026-01-01'), art(2, 1, '2026-03-01', { slug: 'peacock' })], [shop(7, '2026-02-01', true), shop(8, '2026-04-01', false)])
  assert.deepEqual(
    docs.map((d) => d.id),
    ['p7', 'a1', 'a2'],
  )
  assert.equal(docs.find((d) => d.id === 'p7')?.shopSlug, 'shop-7')
  assert.equal(docs.find((d) => d.id === 'a2')?.shopSlug, 'peacock')
  assert.equal(docs.find((d) => d.id === 'a1')?.shopSlug, undefined)
})

test('galleryDocs keeps Position first, then newest first', () => {
  const docs = galleryDocs([art(1, 2, '2026-05-01'), art(2, 0, '2026-01-01'), art(3, 0, '2026-02-01')], [])
  assert.deepEqual(
    docs.map((d) => d.id),
    ['a3', 'a2', 'a1'],
  )
})
