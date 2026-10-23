'use client'

import type { CartLine } from '@/lib/cart'
import { createListStore } from './local-store'

// The cart lives in this browser (localStorage). Prices are always rechecked on the server.
const isLine = (l: unknown): l is CartLine => {
  const o = l as Record<string, unknown> | null
  return !!o && typeof o === 'object' && typeof o.slug === 'string' && typeof o.variantId === 'string' && typeof o.qty === 'number' && Number.isFinite(o.qty)
}

const store = createListStore('cart', isLine)
const { read, write } = store

const same = (a: CartLine, b: CartLine) => a.slug === b.slug && a.variantId === b.variantId && (a.frameId ?? '') === (b.frameId ?? '')

export const cartActions = {
  add(line: CartLine) {
    const lines = read()
    const existing = lines.find((l) => same(l, line))
    write(existing ? lines.map((l) => (same(l, line) ? { ...l, qty: l.qty + line.qty } : l)) : [...lines, line])
  },
  setQty(line: CartLine, qty: number) {
    write(read().map((l) => (same(l, line) ? { ...l, qty: Math.max(1, qty) } : l)))
  },
  remove(line: CartLine) {
    write(read().filter((l) => !same(l, line)))
  },
  clear() {
    write(store.EMPTY)
  },
  /** Replaces the whole cart (used to drop pieces the server says are gone). */
  replace(lines: CartLine[]) {
    write(lines)
  },
}

export const useCart = store.useList

// Saved pieces ("wishlist"): product slugs, newest first, on this device.
const saved = createListStore('saved', (s: unknown): s is string => typeof s === 'string' && s.length <= 200)

export const savedActions = {
  toggle(slug: string) {
    const list = saved.read()
    saved.write(list.includes(slug) ? list.filter((s) => s !== slug) : [slug, ...list])
  },
  remove(slug: string) {
    saved.write(saved.read().filter((s) => s !== slug))
  },
}

export const useSaved = saved.useList
