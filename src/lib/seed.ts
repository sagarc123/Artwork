/** FNV-1a string hash: same text, same number. */
export const hashString = (s: string) =>
  [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0

/** mulberry32: small, fast, deterministic pseudo-random numbers in [0, 1). */
export function seededRandom(seed: string) {
  let a = hashString(seed)
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
