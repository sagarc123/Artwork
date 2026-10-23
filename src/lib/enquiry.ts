// Enquiry form rules, shared by the server action and tests. No server-only imports.

export const ENQUIRY_TYPES = ['event', 'portrait', 'workshop', 'general'] as const
export type EnquiryType = (typeof ENQUIRY_TYPES)[number]
export type EnquiryField = 'type' | 'name' | 'phone' | 'email' | 'date' | 'dateRequired'

export type EnquiryData = {
  type: EnquiryType
  name: string
  phone: string
  email?: string
  city?: string
  eventDate?: string
  venue?: string
  size?: string
  styles?: string[]
  medium?: string
  paperSize?: string
  faces?: number
  occasion?: string
  framing?: boolean
  message?: string
  wantsOffers: boolean
  locale: string
}

type FormLike = { get(name: string): FormDataEntryValue | null; getAll(name: string): FormDataEntryValue[] }

const text = (form: FormLike, name: string, max: number) => {
  const v = form.get(name)
  const s = typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : ''
  return s ? s.slice(0, max) : undefined
}

/** Indian mobile number → 10 digits, or null. Accepts +91, 91, 0 prefixes, spaces and dashes. */
export function normalisePhone(raw: string | undefined): string | null {
  if (!raw) return null
  let d = raw.replace(/[\s\-()]/g, '')
  if (d.startsWith('+91')) d = d.slice(3)
  else if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  return /^[6-9]\d{9}$/.test(d) ? d : null
}

/** YYYY-MM-DD that exists on the calendar (Date rolls 2026-02-30 over to March, so round-trip it). */
const realDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s

/** Validates and cleans a submitted enquiry. `today` is YYYY-MM-DD (server date). */
export function validateEnquiry(form: FormLike, today: string): { ok: true; data: EnquiryData } | { ok: false; errors: EnquiryField[] } {
  const errors: EnquiryField[] = []
  const type = text(form, 'type', 20) as EnquiryType | undefined
  if (!type || !ENQUIRY_TYPES.includes(type)) errors.push('type')
  const name = text(form, 'name', 80)
  if (!name || name.length < 2) errors.push('name')
  const phone = normalisePhone(text(form, 'phone', 20))
  if (!phone) errors.push('phone')
  const email = text(form, 'email', 120)
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('email')
  const eventDate = text(form, 'eventDate', 10)
  if (eventDate && (!realDate(eventDate) || eventDate < today)) errors.push('date')
  // Events need a date to plan; portraits ("needed by") don't.
  if (!eventDate && type === 'event') errors.push('dateRequired')
  if (errors.length) return { ok: false, errors }

  const faces = Number(text(form, 'faces', 3))
  const locale = text(form, 'locale', 2)
  return {
    ok: true,
    data: {
      type: type!,
      name: name!,
      phone: phone!,
      email,
      city: text(form, 'city', 60),
      eventDate,
      venue: text(form, 'venue', 30),
      size: text(form, 'size', 30),
      styles: form.getAll('styles').filter((s): s is string => typeof s === 'string').slice(0, 6).map((s) => s.slice(0, 30)),
      medium: text(form, 'medium', 30),
      paperSize: text(form, 'paperSize', 10),
      faces: Number.isInteger(faces) && faces >= 1 && faces <= 12 ? faces : undefined,
      occasion: text(form, 'occasion', 80),
      framing: form.get('framing') === 'yes',
      message: text(form, 'message', 1000),
      wantsOffers: form.get('offers') === 'yes',
      locale: locale === 'mr' || locale === 'hi' ? locale : 'en',
    },
  }
}
