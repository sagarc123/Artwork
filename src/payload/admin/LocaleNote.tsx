'use client'

import { useLocale, useRouteTransition } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'

const NOTE: Record<string, { text: string; lang: string }> = {
  mr: { text: 'मराठी मजकूर बदलत आहात', lang: 'mr' },
  hi: { text: 'हिंदी टेक्स्ट बदल रहे हैं', lang: 'hi' },
}

/** Top bar: a clear reminder when the words being edited are the Marathi or Hindi ones. */
export function LocaleNote() {
  const locale = useLocale()
  const note = NOTE[locale?.code ?? '']
  if (!note) return null
  return (
    <span className="locale-note" lang={note.lang}>
      {note.text}
    </span>
  )
}

const LANGS = [
  { code: 'en', label: 'English', lang: 'en' },
  { code: 'mr', label: 'मराठी', lang: 'mr' },
  { code: 'hi', label: 'हिंदी', lang: 'hi' },
]

/** Above the name: switch the words being edited without hunting for the top bar's Language menu. */
export function LocaleSwitch() {
  const locale = useLocale()
  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()
  const go = (code: string) => {
    const params = new URLSearchParams(window.location.search)
    params.set('locale', code)
    startRouteTransition(() => router.push(`?${params}`))
  }
  return (
    <nav className="locale-switch" aria-label="Language of the words">
      <span>Write in</span>
      {LANGS.map((l) => (
        <button key={l.code} type="button" lang={l.lang} aria-pressed={locale?.code === l.code} className="locale-switch__btn" onClick={() => go(l.code)}>
          {l.label}
        </button>
      ))}
    </nav>
  )
}
