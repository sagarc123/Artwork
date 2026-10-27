import { lang } from 'next/root-params'
import { notFound } from 'next/navigation'
import { getBusiness } from '@/server/content'
import { isLocale, type Locale } from './config'
import type en from './messages/en.json'

export type Dictionary = typeof en

// Typed against en.json, so a missing key in mr/hi fails the type check.
const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import('./messages/en.json').then((m) => m.default),
  mr: () => import('./messages/mr.json').then((m) => m.default),
  hi: () => import('./messages/hi.json').then((m) => m.default),
}

export async function getLocale(): Promise<Locale> {
  const value = await lang()
  if (!isLocale(value)) notFound()
  return value
}

/** The interface text in the page's language, with the owner's reply promise ("within {hours} hours") filled in. */
export async function getDictionary(): Promise<Dictionary> {
  const locale = await getLocale()
  const [dict, { replyHours }] = await Promise.all([dictionaries[locale](), getBusiness()])
  // ponytail: one string round-trip per call (~40 KB); fine next to a page render.
  const hours = new Intl.NumberFormat(`${locale}-IN`).format(replyHours)
  return JSON.parse(JSON.stringify(dict).replaceAll('{hours}', hours))
}
