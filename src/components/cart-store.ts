'use client'

import { useSyncExternalStore } from 'react'
import type { CartLine } from '@/lib/cart'

// The cart lives in this browser (localStorage). Prices are always rechecked on the server.
const KEY = 'cart'
const EMPTY: CartLine[] = []
let cachedRaw: string | null = null
let cachedLines: CartLine[] = EMPTY

function read(): CartLine[] {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    return EMPTY
  }
  if (raw === cachedRaw) return cachedLines
  cachedRaw = raw
  try {
    const parsed = JSON.parse(raw ?? '[]')
    cachedLines = Array.isArray(parsed) ? parsed : EMPTY
  } catch {
    cachedLines = EMPTY
  }
  return cachedLines
}

function write(lines: CartLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines))
  } catch {
    // Storage blocked (private mode): the cart lasts for this page only.
  }
  window.dispatchEvent(new Event(KEY))
}

const subscribe = (onChange: () => void) => {
  window.addEventListener(KEY, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(KEY, onChange)
    window.removeEventListener('storage', onChange)
  }
}

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
    write(EMPTY)
  },
}

export function useCart() {
  return useSyncExternalStore(subscribe, read, () => EMPTY)
}
