// Motion rules for the making-of player, the before/after slider and the thank-you moments. No DOM imports.

export type MotionEnv = {
  reducedMotion: boolean
  /** <html data-motion> ("off" = the footer's "Stop animations"). */
  motion?: string
  /** <html data-fx> ("lite" = slow phone, set by MotionSettings). */
  fx?: string
  saveData?: boolean
  effectiveType?: string
}

/** A video or drawing may start by itself (once, when scrolled into view) only on a capable device with motion on. */
export function canAutoplay(e: MotionEnv): boolean {
  return !e.reducedMotion && e.motion !== 'off' && e.fx !== 'lite' && !e.saveData && !/(^|-)(2g|3g)$/.test(e.effectiveType ?? '')
}

/** Slider value as a percentage, 0–100 (anything odd falls back to the middle). */
export const clampPct = (v: number) => (Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 50)

/** Before/after: the photo on top shows from the left edge up to the slider; the drawing shows on the right. */
export const revealClip = (v: number) => `inset(0 ${100 - clampPct(v)}% 0 0)`

/**
 * True the first time this key is seen in this browser, and remembers it. Storage blocked: always true (the moment
 * plays again, which is harmless). Inlined as a script in the order page, so it stays self-contained.
 */
export function firstView(store: { getItem(k: string): string | null; setItem(k: string, v: string): void }, key: string): boolean {
  try {
    if (store.getItem(key)) return false
    store.setItem(key, '1')
  } catch {
    // Private mode: nothing to remember.
  }
  return true
}
