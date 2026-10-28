// Review rules, shared by the server and the tests. Pure: no database, no Next.

/** A course can be reviewed once this share of its lessons is done (docs/plan/full/00-decisions.md). */
export const MIN_PROGRESS = 30
export const TEXT_MIN = 10
export const TEXT_MAX = 1000
export const PHOTO_MAX_BYTES = 4 * 1024 * 1024
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export type ReviewField = 'rating' | 'text' | 'photo'

/** Plain text only: tags and angle brackets removed, spaces collapsed, at most TEXT_MAX characters. */
export const cleanText = (raw: unknown) =>
  (typeof raw === 'string' ? raw : '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
    .slice(0, TEXT_MAX)

/** The only name shown publicly: first name and the initial of the last, "Priya K.". */
export function reviewerName(name: string | null | undefined) {
  const parts = cleanText(name).replace(/\s+/g, ' ').split(' ').filter(Boolean)
  if (!parts.length) return ''
  const first = parts[0].slice(0, 30)
  return parts.length > 1 ? `${first} ${[...parts[parts.length - 1]][0].toUpperCase()}.` : first
}

export const validRating = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 5

/** Field errors for a submitted review (empty = fine). */
export function reviewErrors(rating: unknown, text: string): ReviewField[] {
  return [...(validRating(rating) ? [] : ['rating' as const]), ...(text.length >= TEXT_MIN ? [] : ['text' as const])]
}

/** What the photo really is, from its first bytes (the browser's file type and name can be anything). */
export function sniffImage(b: Uint8Array): (typeof PHOTO_TYPES)[number] | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to))
  if (b.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp'
  return null
}

/** A photo is fine if it is small enough and really a JPEG, PNG or WebP. */
export const photoOk = (bytes: Uint8Array) => bytes.length > 0 && bytes.length <= PHOTO_MAX_BYTES && sniffImage(bytes) !== null

type Order = { status: string; items: { product?: number | null; type?: string | null }[] }
/** Delivered, or a digital product that is paid for (nothing is shipped, so "paid" is the end). */
const DIGITAL_OK = ['paid', 'packed', 'shipped', 'delivered']
export const productBought = (orders: Order[], productId: number) =>
  orders.some((o) => o.items.some((i) => i.product === productId && (o.status === 'delivered' || (i.type === 'digital' && DIGITAL_OK.includes(o.status)))))

export type ReviewCheck = 'ok' | 'not_buyer' | 'not_enrolled' | 'too_early' | 'already'

/** One review per customer per item; products need a bought order, courses a seat and MIN_PROGRESS percent. */
export function checkProductReview(bought: boolean, existing: boolean): ReviewCheck {
  return existing ? 'already' : bought ? 'ok' : 'not_buyer'
}
export function checkCourseReview(enrolled: boolean, percent: number, existing: boolean): ReviewCheck {
  return existing ? 'already' : !enrolled ? 'not_enrolled' : percent < MIN_PROGRESS ? 'too_early' : 'ok'
}

/** Average to one decimal and the count. */
export function summarise(ratings: number[]) {
  const r = ratings.filter(validRating)
  return { count: r.length, average: r.length ? Math.round((r.reduce((a, b) => a + b, 0) / r.length) * 10) / 10 : 0 }
}
