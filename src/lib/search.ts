// Site search over the (small, cached) catalogue. No server-only imports, so tests can load it.

export const MAX_QUERY = 100

/** The `q` search param, trimmed, single-spaced and capped at 100 characters. */
export function cleanQuery(raw: string | string[] | undefined): string {
  const s = Array.isArray(raw) ? raw[0] : raw
  return (s ?? '').trim().replace(/\s+/g, ' ').slice(0, MAX_QUERY).trim()
}

/** Lower case, accents folded, hyphens and punctuation as spaces. Devanagari is kept as is (only NFC). */
const fold = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[-_.,;:!?()'"“”‘’/\\]+/g, ' ')

/** True when every word of the query appears somewhere in the texts (title in each language, slug). */
export function matches(query: string, texts: (string | null | undefined)[]): boolean {
  const words = fold(query).split(' ').filter(Boolean)
  if (!words.length) return false
  const hay = fold(texts.filter(Boolean).join(' '))
  return words.every((w) => hay.includes(w))
}

/** Items (in the visitor's language) whose own texts or English twin (same id) match. */
export function searchById<T extends { id: number | string }>(query: string, items: T[], english: T[], texts: (item: T) => (string | null | undefined)[]): T[] {
  const en = new Map(english.map((e) => [e.id, e]))
  return items.filter((item) => {
    const twin = en.get(item.id)
    return matches(query, [...texts(item), ...(twin ? texts(twin) : [])])
  })
}

export type Part = string | { missing: string }

/** Fills {name} slots in a sentence. Empty values come back as { missing } so the page can flag them for the owner. */
export function fillParts(text: string, values: Record<string, string | number | null | undefined>): Part[] {
  return text.split(/(\{\w+\})/).flatMap((chunk): Part[] => {
    const m = /^\{(\w+)\}$/.exec(chunk)
    if (!m) return chunk ? [chunk] : []
    const v = values[m[1]]
    return v === undefined || v === null || v === '' ? [{ missing: m[1] }] : [String(v)]
  })
}
