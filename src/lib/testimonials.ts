// Which customer reviews a page shows. No server-only imports.

type Review = { language?: string | null; topic?: string | null; featured?: boolean | null }

/**
 * Reviews for one page, newest first as given:
 * - home (no topic): the ones marked "Show on home page"; a service page: its topic plus general ones;
 * - in the page's language; English ones stand in only when there are none in that language.
 */
export function pickTestimonials<T extends Review>(all: T[], locale: string, topic?: 'event' | 'portrait' | 'shop', max = 6) {
  const forPage = all.filter((r) => (topic ? r.topic === topic || (r.topic ?? 'general') === 'general' : r.featured))
  const lang = (r: T) => r.language ?? 'en'
  const own = forPage.filter((r) => lang(r) === locale)
  return (own.length ? own : forPage.filter((r) => lang(r) === 'en')).slice(0, max)
}
