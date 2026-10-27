// Which festival decoration the site wears (Site settings → Announcement strip → Festive look). No server-only imports.
import { daysBetween } from './dates.ts'

export const FESTIVE_KINDS = ['diwali', 'ganesh', 'gudi', 'wedding'] as const
export type FestiveKind = (typeof FESTIVE_KINDS)[number]
export type FestiveSetting = 'off' | 'auto' | FestiveKind

/** How many days before a festival the automatic look switches on. */
export const FESTIVE_LEAD_DAYS = 21

/** The decoration for a festival page slug, or null when there is none (unknown festivals stay plain). */
export function festiveKindOf(slug: string): FestiveKind | null {
  if (slug.includes('ganesh')) return 'ganesh'
  if (slug.includes('gudi')) return 'gudi'
  if (slug.includes('wed') || slug.includes('lagna')) return 'wedding'
  if (slug.includes('diwali') || slug.includes('deepavali')) return 'diwali'
  return null
}

/**
 * The look to show today. "auto": the soonest festival with a date in the next three weeks (festival day included).
 * `today` is YYYY-MM-DD.
 */
export function festiveLook(setting: string | null | undefined, festivals: { slug: string; nextDate?: string | null }[], today: string): FestiveKind | null {
  if ((FESTIVE_KINDS as readonly string[]).includes(setting ?? '')) return setting as FestiveKind
  if (setting && setting !== 'auto') return null
  let best: { kind: FestiveKind; days: number } | null = null
  for (const f of festivals) {
    const kind = festiveKindOf(f.slug)
    if (!kind || !f.nextDate) continue
    const days = daysBetween(today, f.nextDate.slice(0, 10))
    if (days >= 0 && days <= FESTIVE_LEAD_DAYS && (!best || days < best.days)) best = { kind, days }
  }
  return best?.kind ?? null
}
