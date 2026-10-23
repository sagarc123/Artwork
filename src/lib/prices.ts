// "From ₹X" prices for events and portraits (owner-edited, Service prices global). No server-only imports.
import type { ServicePrice } from '@/payload-types'

export const EVENT_SIZES = ['small', 'medium', 'large'] as const
export const PORTRAIT_MEDIUMS = ['pencil', 'charcoal', 'colour'] as const
export const PAPER_SIZES = ['a4', 'a3', 'a2'] as const

const price = (n: number | null | undefined) => (typeof n === 'number' && n > 0 ? n : null)
/** Lowest price that is filled in, or null when the owner left them all empty. */
export const lowest = (list: (number | null | undefined)[]) => list.map(price).reduce<number | null>((a, b) => (b === null ? a : a === null ? b : Math.min(a, b)), null)

export const eventFrom = (p: ServicePrice | null) => lowest(EVENT_SIZES.map((s) => p?.events?.[s]))
export const portraitFrom = (p: ServicePrice | null) => lowest(PORTRAIT_MEDIUMS.flatMap((m) => PAPER_SIZES.map((s) => p?.portraits?.[m]?.[s])))

/** Chip hints keyed like the form values: event size → "from ₹X". */
export function eventSizeHints(p: ServicePrice | null, fmt: (n: number) => string) {
  return Object.fromEntries(EVENT_SIZES.flatMap((s) => (price(p?.events?.[s]) ? [[s, fmt(p!.events![s]!)]] : [])))
}

/** Portrait chip hints: each medium from its A4 price, each size from its cheapest medium. Paper sizes are upper-case form values. */
export function portraitHints(p: ServicePrice | null, fmt: (n: number) => string) {
  const medium = Object.fromEntries(PORTRAIT_MEDIUMS.flatMap((m) => {
    const n = lowest(PAPER_SIZES.map((s) => p?.portraits?.[m]?.[s]))
    return n ? [[m, fmt(n)]] : []
  }))
  const paperSize = Object.fromEntries(PAPER_SIZES.flatMap((s) => {
    const n = lowest(PORTRAIT_MEDIUMS.map((m) => p?.portraits?.[m]?.[s]))
    return n ? [[s.toUpperCase(), fmt(n)]] : []
  }))
  return { medium, paperSize }
}

/** "from {price}" with the price filled in; null price → null so the caller hides the line. */
export const fromText = (template: string, n: number | null, fmt: (n: number) => string) => (n ? template.replace('{price}', fmt(n)) : null)
