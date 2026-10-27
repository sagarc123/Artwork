// Pure helpers for the admin's Round 3B tools (sales card, festival planner, sale preset, bulk actions, phone photos).
// No server-only imports: the client components use some of these too.
import { addDays, festivalCountdown } from './dates.ts'
import { saleIsOn, type FestivalSale } from './cart.ts'

/** Midnight in India (IST) of a YYYY-MM-DD day, as an instant. */
export const istMidnight = (ymd: string) => new Date(`${ymd.slice(0, 10)}T00:00:00+05:30`)

/** First day of this month and of last month, for a given Indian "today". */
export function monthStarts(today: string) {
  const [y, m] = today.split('-').map(Number)
  const thisMonth = `${y}-${String(m).padStart(2, '0')}-01`
  const lastMonth = m === 1 ? `${y - 1}-12-01` : `${y}-${String(m - 1).padStart(2, '0')}-01`
  return { thisMonth, lastMonth }
}

/** Whole-number change from last month, or null when last month had nothing to compare with. */
export const percentChange = (now: number, before: number) => (before > 0 ? Math.round(((now - before) / before) * 100) : null)

/** One value per day for the `days` days ending today (oldest first); days without sales are 0. */
export function dailySeries(rows: { day: string; total: number }[], today: string, days = 30) {
  const byDay = new Map(rows.map((r) => [r.day, Number(r.total) || 0]))
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(today, i - days + 1)
    return { day, total: byDay.get(day) ?? 0 }
  })
}

/** Bars for a tiny sparkline: x, y, width, height inside a width × height box. Zero days get a 1 px stub. */
export function sparkBars(values: number[], width: number, height: number, gap = 1) {
  const max = Math.max(...values, 0)
  const w = (width - gap * (values.length - 1)) / values.length
  return values.map((v, i) => {
    const h = max > 0 ? Math.max(v > 0 ? 2 : 1, (v / max) * height) : 1
    return { x: i * (w + gap), y: height - h, w, h }
  })
}

/** "+12%", "−8%", "same" or null: how this month compares (month so far vs all of last month). */
export const changeLabel = (pct: number | null) => (pct === null ? null : pct === 0 ? 'same' : pct > 0 ? `+${pct}%` : `−${Math.abs(pct)}%`)

// --- Festival planner ---

/** Days before a festival that the sale preset and the planner look ahead. */
export const PLAN_DAYS = 90

/** Where the shop's festival sale stands: on now, starting later, or off (ended / switched off). */
export function saleState(sale: FestivalSale | null | undefined, now: Date): 'on' | 'planned' | 'off' {
  if (saleIsOn(sale, now)) return 'on'
  return sale?.enabled && sale.percent && sale.startsAt && istDay(sale.startsAt) > istDay(now.toISOString()) ? 'planned' : 'off'
}

/** The Indian calendar day (YYYY-MM-DD) a stored date falls on. */
export const istDay = (iso: string) => new Date(Date.parse(iso) + 330 * 60_000).toISOString().slice(0, 10)

/** Does the sale run on any day between today and the festival (both included)? */
export function saleCovers(sale: FestivalSale | null | undefined, today: string, festivalDay: string) {
  if (!sale?.enabled || !sale.percent) return false
  const first = sale.startsAt ? istDay(sale.startsAt) : today
  const last = sale.endsAt ? istDay(sale.endsAt) : '9999-12-31'
  return first <= festivalDay && last >= today
}

type PlanFestival = { id: number; name: string; nextDate?: string | null }

/** Festivals in the next `days` days, soonest first, with their order-by / book-by deadlines and reminder counts. */
export function festivalPlan(festivals: PlanFestival[], today: string, reminders: Map<number, number>, days = PLAN_DAYS) {
  return festivals
    .flatMap((f) => {
      const date = f.nextDate?.slice(0, 10)
      if (!date) return []
      const c = festivalCountdown(date, today)
      if (!c || c.days > days) return []
      return [{ ...f, date, daysLeft: c.days, orderBy: c.orderBy, bookBy: c.bookBy, reminders: reminders.get(f.id) ?? 0 }]
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

// --- Festival sale preset ---

/**
 * First and last day of a sale that starts today (India) and runs `days` days, as stored dates. Noon IST keeps the day
 * the same in any nearby time zone; the shop counts whole Indian days (saleIsOn).
 */
export function presetDates(today: string, days: number) {
  const n = Math.min(60, Math.max(1, Math.floor(days) || 1))
  const last = addDays(today, n - 1)
  const at = (ymd: string) => new Date(`${ymd}T12:00:00+05:30`).toISOString()
  return { first: today, last, days: n, startsAt: at(today), endsAt: at(last) }
}

/** "27 Oct" style day label (no time zone surprises: the date is read as a plain day). */
export const shortDay = (ymd: string, locale = 'en-IN') =>
  new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${ymd.slice(0, 10)}T00:00:00Z`))

// --- Bulk actions ---

export type BulkResult = { id: number | string; ok: boolean; reason?: string }

/** "4 packed, 1 skipped: already shipped" / "2 sold, 3 skipped: 2 not an original, 1 already sold". */
export function bulkSummary(results: BulkResult[], verb: string) {
  const done = results.filter((r) => r.ok).length
  const skipped = results.filter((r) => !r.ok)
  if (!skipped.length) return `${done} ${verb}`
  const reasons = new Map<string, number>()
  for (const r of skipped) reasons.set(r.reason ?? 'not changed', (reasons.get(r.reason ?? 'not changed') ?? 0) + 1)
  const why = reasons.size === 1 ? [...reasons.keys()][0] : [...reasons].map(([reason, n]) => `${n} ${reason}`).join(', ')
  return `${done} ${verb}, ${skipped.length} skipped: ${why}`
}

const NOT_PACKABLE: Record<string, string> = {
  pending_payment: 'not paid yet',
  cod_pending_confirmation: 'COD not confirmed yet',
  packed: 'already packed',
  shipped: 'already shipped',
  delivered: 'already delivered',
  cancelled: 'cancelled',
  needs_refund: 'cancelled',
  refunded: 'cancelled',
}

/** Which selected orders can be packed now (paid, or COD confirmed); the rest are skipped with a reason. */
export function packPlan(orders: { id: number; status?: string | null }[]) {
  const pack: number[] = []
  const skipped: BulkResult[] = []
  for (const o of orders) {
    if (o.status === 'paid' || o.status === 'cod_confirmed') pack.push(o.id)
    else skipped.push({ id: o.id, ok: false, reason: NOT_PACKABLE[o.status ?? ''] ?? 'cannot be packed' })
  }
  return { pack, skipped }
}

/** Which selected pieces can be marked sold: originals not sold yet. */
export function soldPlan(products: { id: number; type?: string | null; sold?: boolean | null }[]) {
  const sell: number[] = []
  const skipped: BulkResult[] = []
  for (const p of products) {
    if (p.type !== 'original') skipped.push({ id: p.id, ok: false, reason: 'not an original' })
    else if (p.sold) skipped.push({ id: p.id, ok: false, reason: 'already sold' })
    else sell.push(p.id)
  }
  return { sell, skipped }
}

// --- Phone photos ---

/** Scales width × height down (never up) so the longer side is at most `max`. */
export function fitWithin(width: number, height: number, max = 2400) {
  const k = Math.min(1, max / Math.max(width, height))
  return { width: Math.round(width * k), height: Math.round(height * k) }
}

/**
 * The largest `ratio` (width / height) box inside a width × height photo. `pos` 0..1 says where it sits (0.5 = centre),
 * the same way CSS object-position does, so the preview and the upload match.
 */
export function cropBox(width: number, height: number, ratio = 4 / 5, pos = { x: 0.5, y: 0.5 }) {
  const clamp = (n: number) => Math.min(1, Math.max(0, n))
  const sw = Math.round(Math.min(width, height * ratio))
  const sh = Math.round(Math.min(height, width / ratio))
  return { sx: Math.round((width - sw) * clamp(pos.x)), sy: Math.round((height - sh) * clamp(pos.y)), sw, sh }
}
