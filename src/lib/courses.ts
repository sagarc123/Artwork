// Pure helpers for the courses pages (no database, no React).

type Row = { section: string; order: number }

/** "3h 20m", "45m", "1h". `units` are the words for hours and minutes in the page's language. */
export function formatDuration(seconds: number, units = { h: 'h', m: 'm' }) {
  const mins = Math.max(0, Math.round(seconds / 60))
  const [h, m] = [Math.floor(mins / 60), mins % 60]
  if (!h) return `${m}${units.m}`
  return m ? `${h}${units.h} ${m}${units.m}` : `${h}${units.h}`
}

/** Lessons in teaching order, grouped into sections: a new section starts whenever the section name changes. */
export function groupSections<T extends Row>(lessons: T[]) {
  const sections: { title: string; lessons: T[] }[] = []
  for (const l of [...lessons].sort((a, b) => a.order - b.order)) {
    const last = sections.at(-1)
    if (last && last.title === l.section) last.lessons.push(l)
    else sections.push({ title: l.section, lessons: [l] })
  }
  return sections
}

/** What a visitor pays: the sale price when it is lower, 0 meaning free. */
export function coursePrice(c: { price: number; salePrice?: number | null }) {
  const sale = c.salePrice != null && c.salePrice < c.price
  return { now: sale ? c.salePrice! : c.price, was: sale ? c.price : null, free: (sale ? c.salePrice! : c.price) === 0 }
}

/** Under-18 courses are bought by a parent. */
export const forUnder18 = (audience?: string | null) => audience === 'kids' || audience === 'teens'
