'use client'

import { useSyncExternalStore } from 'react'

/**
 * A list kept in this browser's localStorage (cart, saved pieces), shared by every component on the page.
 * Storage blocked (private mode, strict settings): the list lives in memory for this page instead.
 */
export function createListStore<T>(key: string, isItem: (v: unknown) => v is T) {
  const EMPTY: T[] = []
  let cachedRaw: string | null = null
  let cached: T[] = EMPTY
  let memory: string | null = null

  function read(): T[] {
    let raw: string | null
    try {
      raw = memory ?? localStorage.getItem(key)
    } catch {
      raw = memory
    }
    if (raw === cachedRaw) return cached
    cachedRaw = raw
    try {
      const parsed: unknown = JSON.parse(raw ?? '[]')
      cached = Array.isArray(parsed) ? parsed.filter(isItem) : EMPTY
    } catch {
      cached = EMPTY
    }
    return cached
  }

  function write(items: T[]) {
    const raw = JSON.stringify(items)
    try {
      localStorage.setItem(key, raw)
    } catch {
      memory = raw
    }
    window.dispatchEvent(new Event(key))
  }

  const subscribe = (onChange: () => void) => {
    window.addEventListener(key, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(key, onChange)
      window.removeEventListener('storage', onChange)
    }
  }

  const useList = () => useSyncExternalStore(subscribe, read, () => EMPTY)
  return { read, write, useList, EMPTY }
}

const noop = () => () => {}
/** False in the server HTML and during hydration, so browser-only lists never flash "empty". */
export const useHydrated = () => useSyncExternalStore(noop, () => true, () => false)
