'use client'

import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Dictionary } from '@/i18n/dictionaries'
import { markLessonDone, openLesson } from '@/server/learn-actions'

type Nav = { href: string; title: string } | null

/** Under the video: remembers the lesson as the last one opened, then Mark as done, Previous and Next. */
export function LessonActions({ lessonId, done, hasNext, lessonBase, prev, next, t }: { lessonId: number; done: boolean; hasNext: boolean; lessonBase: string; prev: Nav; next: Nav; t: Dictionary['learn'] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  // Opening a lesson is what remembers it and starts the no-refund rule, so it is a deliberate call from the browser (not a side effect of a page fetch).
  useEffect(() => {
    openLesson(lessonId).catch(() => {})
  }, [lessonId])

  async function finish() {
    setBusy(true)
    setFailed(false)
    const r = await markLessonDone(lessonId).catch(() => null)
    if (r?.status !== 'ok') {
      setBusy(false)
      return setFailed(true)
    }
    // The next lesson not yet done; when none is left, stay here and show the certificate card.
    if (r.nextId && !r.complete) return router.push(`${lessonBase}/${r.nextId}`)
    router.refresh()
    setBusy(false)
  }

  const nav = 'press inline-flex min-h-12 items-center justify-center gap-2 rounded-ui border border-border px-4 font-semibold hover:bg-charcoal/5'
  return (
    <div className="grid gap-4">
      {done ? (
        <p className="inline-flex min-h-12 items-center gap-2 font-semibold text-leaf">
          <Check aria-hidden="true" className="size-6" />
          {t.markDone}
        </p>
      ) : (
        <button type="button" onClick={finish} disabled={busy} className="press inline-flex min-h-14 items-center justify-center gap-2 rounded-ui bg-kumkum px-6 text-center font-semibold text-white hover:bg-kumkum/90 disabled:opacity-60">
          {busy ? t.working : hasNext ? t.markNext : t.markLast}
        </button>
      )}
      {done && next && (
        <Link href={next.href} className="press inline-flex min-h-14 items-center justify-center gap-2 rounded-ui bg-kumkum px-6 text-center font-semibold text-white hover:bg-kumkum/90">
          {t.next}: {next.title}
          <ArrowRight aria-hidden="true" className="size-5 shrink-0" />
        </Link>
      )}
      {failed && (
        <p role="alert" className="font-semibold text-kumkum">
          {t.failed}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link href={prev.href} aria-label={t.prevLabel.replace('{title}', prev.title)} className={nav}>
            <ArrowLeft aria-hidden="true" className="size-5 shrink-0" />
            {t.prev}
          </Link>
        ) : (
          <span />
        )}
        {next && !done && (
          <Link href={next.href} aria-label={t.nextLabel.replace('{title}', next.title)} className={`${nav} sm:justify-self-end`}>
            {t.next}
            <ArrowRight aria-hidden="true" className="size-5 shrink-0" />
          </Link>
        )}
      </div>
    </div>
  )
}
