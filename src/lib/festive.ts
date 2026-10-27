// Which look the site wears (Site settings → Announcement strip → Site look / Festival decoration). No server-only imports.
import { addDays } from './dates.ts'

export const FESTIVE_KINDS = ['diwali', 'ganesh', 'gudi', 'wedding'] as const
export type FestiveKind = (typeof FESTIVE_KINDS)[number]
export type FestiveSetting = 'off' | 'auto' | FestiveKind
/** everyday = the calm studio look; festive = colour floors, paithani borders and the toran. */
export type Season = 'everyday' | 'festive'
export type SiteLook = 'auto' | Season

/** How many days before a festival the automatic look switches on. */
export const FESTIVE_LEAD_DAYS = 21

const isKind = (s: string | null | undefined): s is FestiveKind => (FESTIVE_KINDS as readonly string[]).includes(s ?? '')

/** The decoration for a festival page slug, or null when there is none (unknown festivals stay plain). */
export function festiveKindOf(slug: string): FestiveKind | null {
  if (slug.includes('ganesh')) return 'ganesh'
  if (slug.includes('gudi')) return 'gudi'
  if (slug.includes('wed') || slug.includes('lagna')) return 'wedding'
  if (slug.includes('diwali') || slug.includes('deepavali')) return 'diwali'
  return null
}

/** [kind, first day, festival day] for every dated festival, soonest first. Small enough to inline in the page head. */
export function festiveWindows(festivals: { slug: string; nextDate?: string | null }[]): [FestiveKind, string, string][] {
  return festivals
    .flatMap((f): [FestiveKind, string, string][] => {
      const kind = festiveKindOf(f.slug)
      const day = f.nextDate?.slice(0, 10)
      return kind && day ? [[kind, addDays(day, -FESTIVE_LEAD_DAYS), day]] : []
    })
    .sort((a, b) => a[2].localeCompare(b[2]))
}

/** The window today falls in (first match = soonest festival). Mirrored by the inline head script in the [lang] layout. */
export const pickWindow = (windows: [FestiveKind, string, string][], today: string) => windows.find(([, from, to]) => from <= today && today <= to)?.[0] ?? null

/**
 * The decoration to show today. "auto": the soonest festival with a date in the next three weeks (festival day included).
 * `today` is YYYY-MM-DD.
 */
export function festiveLook(setting: string | null | undefined, festivals: { slug: string; nextDate?: string | null }[], today: string): FestiveKind | null {
  if (isKind(setting)) return setting
  if (setting && setting !== 'auto') return null
  return pickWindow(festiveWindows(festivals), today)
}

/**
 * The season when it doesn't depend on today's date, else null (the head script decides before first paint).
 * A festival picked as the decoration keeps "auto" festive; "off" only drops the decoration, the dates still count.
 */
export function fixedSeason(look: string | null | undefined, decoration: string | null | undefined): Season | null {
  if (look === 'everyday' || look === 'festive') return look
  return isKind(decoration) ? 'festive' : null
}

/** The site's look today. */
export function siteSeason(look: string | null | undefined, decoration: string | null | undefined, festivals: { slug: string; nextDate?: string | null }[], today: string): Season {
  return fixedSeason(look, decoration) ?? (festiveLook('auto', festivals, today) ? 'festive' : 'everyday')
}
