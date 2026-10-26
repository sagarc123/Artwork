// Calendar maths on plain YYYY-MM-DD strings, so server, browser and tests agree. "Today" is always passed in.

const DAY = 86_400_000
const utc = (ymd: string) => Date.parse(`${ymd.slice(0, 10)}T00:00:00Z`)

export const addDays = (ymd: string, days: number) => new Date(utc(ymd) + days * DAY).toISOString().slice(0, 10)
export const daysBetween = (from: string, to: string) => Math.round((utc(to) - utc(from)) / DAY)
/** Today in India (Asia/Kolkata) as YYYY-MM-DD: what the server means by "today" (its clock runs on UTC). */
export const indiaToday = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d)
/** The browser's local date as YYYY-MM-DD. */
export const localToday = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Parcels: 5–8 days, every day counted. */
// ponytail: no courier holidays or pincode zones; switch to the courier's estimate when Shiprocket arrives.
export const deliveryRange = (today: string): [string, string] => [addDays(today, 5), addDays(today, 8)]

export const ORDER_LEAD_DAYS = 7 // parcels must leave a week before the festival
export const BOOK_LEAD_DAYS = 3 // event rangoli needs a few days to plan

/** Countdown to a festival: days left, and the last day to order a parcel / book event rangoli. Null once it has passed. */
export function festivalCountdown(nextDate: string, today: string) {
  const days = daysBetween(today, nextDate)
  if (days < 0) return null
  const orderBy = addDays(nextDate, -ORDER_LEAD_DAYS)
  const bookBy = addDays(nextDate, -BOOK_LEAD_DAYS)
  return { days, orderBy: orderBy >= today ? orderBy : null, bookBy: bookBy >= today ? bookBy : null }
}

/** Festivals in the order to show them: upcoming (soonest first), then undated or past ones by the owner's order. */
export function sortFestivals<T extends { nextDate?: string | null; order?: number | null }>(list: T[], today: string) {
  const upcoming = (f: T) => !!f.nextDate && f.nextDate.slice(0, 10) >= today
  return [...list].sort((a, b) => {
    const ua = upcoming(a)
    const ub = upcoming(b)
    if (ua !== ub) return ua ? -1 : 1
    if (ua) return a.nextDate!.localeCompare(b.nextDate!)
    return (a.order ?? 0) - (b.order ?? 0)
  })
}
