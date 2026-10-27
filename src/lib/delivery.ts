// "Check delivery" on the product page: days and cash on delivery for a PIN code. No server-only imports.
import { addDays } from './dates.ts'
import { isPincode } from './pincode.ts'

export type DeliveryZone = { prefix: string; minDays: number; maxDays: number; cod?: boolean | null }
/** Owner-set delivery table (Shop settings → Delivery times). */
export type DeliveryRules = { minDays: number; maxDays: number; zones: DeliveryZone[] }
export type DeliveryEstimate = { minDays: number; maxDays: number; codHere: boolean }

/** Days for a PIN code: the zone with the longest matching prefix, else the default. `codHere` is the zone's say only (COD rules apply on top). */
export function deliveryFor(pincode: string, rules: DeliveryRules): DeliveryEstimate | null {
  if (!isPincode(pincode)) return null
  const zone = rules.zones
    .filter((z) => /^[1-9]\d{0,2}$/.test(z.prefix) && pincode.startsWith(z.prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0]
  const minDays = zone?.minDays ?? rules.minDays
  return { minDays, maxDays: Math.max(minDays, zone?.maxDays ?? rules.maxDays), codHere: zone ? zone.cod !== false : true }
}

/** First and last likely delivery day (YYYY-MM-DD), counted from `today`. */
export const deliveryWindow = (today: string, e: Pick<DeliveryEstimate, 'minDays' | 'maxDays'>): [string, string] => [addDays(today, e.minDays), addDays(today, e.maxDays)]

/** localStorage key: the PIN code checked on a product page, offered again at checkout. */
export const PINCODE_STORE = 'pincode'
