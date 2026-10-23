'use client'

import { useLocale } from '@payloadcms/ui'

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
