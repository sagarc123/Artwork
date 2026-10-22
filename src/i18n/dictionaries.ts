import { lang } from 'next/root-params'
import { notFound } from 'next/navigation'
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

export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()]()
}
