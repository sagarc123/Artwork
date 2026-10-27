'use client'

import { useEffect } from 'react'
import { localToday } from '@/lib/dates'
import { festiveLook } from '@/lib/festive'

/**
 * Turns on the festival decoration (<html data-festive="diwali">, drawn in CSS) from the visitor's own date:
 * "auto" means the three weeks before a festival. A look the owner picked is already on <html> from the server.
 */
export function FestiveLook({ setting, festivals }: { setting: string; festivals: { slug: string; nextDate?: string | null }[] }) {
  useEffect(() => {
    const look = festiveLook(setting, festivals, localToday())
    if (look) document.documentElement.dataset.festive = look
    else delete document.documentElement.dataset.festive
  }, [setting, festivals])
  return null
}
