// The lesson player's pure rules: progress, resuming, completion and certificate ids. No database, no React.
import { randomInt } from 'node:crypto'

type Lesson = { id: number; order: number }

/** Lessons in teaching order. */
export const inOrder = <T extends Lesson>(lessons: T[]) => [...lessons].sort((a, b) => a.order - b.order || a.id - b.id)

/** "3 of 5 done": only lessons that still exist in the course count (a deleted lesson never blocks a certificate). */
export function progressCount(lessonIds: number[], doneIds: number[]) {
  const mine = new Set(lessonIds)
  const done = new Set(doneIds.filter((id) => mine.has(id))).size
  const total = mine.size
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0, complete: total > 0 && done === total }
}

/** Where "Go to my course" opens: the lesson they were last on, else the first one. Null when the course has no lessons yet. */
export function resumeLesson<T extends Lesson>(lessons: T[], lastId?: number | null): T | null {
  const sorted = inOrder(lessons)
  return sorted.find((l) => l.id === lastId) ?? sorted[0] ?? null
}

/** Previous and next lesson around `id`. */
export function neighbours<T extends Lesson>(lessons: T[], id: number) {
  const sorted = inOrder(lessons)
  const i = sorted.findIndex((l) => l.id === id)
  return { prev: i > 0 ? sorted[i - 1] : null, next: i >= 0 ? (sorted[i + 1] ?? null) : null }
}

/** After "done": the next lesson not yet done (so a student who skipped around is not sent back to a finished one), else null. */
export function nextToDo<T extends Lesson>(lessons: T[], id: number, doneIds: number[]) {
  const done = new Set(doneIds)
  const sorted = inOrder(lessons)
  const i = sorted.findIndex((l) => l.id === id)
  return sorted.slice(i + 1).find((l) => !done.has(l.id)) ?? sorted.find((l) => l.id !== id && !done.has(l.id)) ?? null
}

/** A certificate is issued once: when every lesson is done and none exists for this enrolment yet. */
export const shouldIssue = (progress: { complete: boolean }, existing: unknown) => progress.complete && !existing

// No 0/O/1/I, so a code read aloud or typed from paper is not mistaken.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const CERT_ID_LENGTH = 10

/** 10 random characters (32^10 possibilities): not sequential, not guessable by counting. */
export const newCertId = (pick: (max: number) => number = (n) => randomInt(0, n)) => Array.from({ length: CERT_ID_LENGTH }, () => ALPHABET[pick(ALPHABET.length)]).join('')

/** As printed: ART-ABCDE-FGHJK. */
export const showCertId = (id: string) => `ART-${id.slice(0, 5)}-${id.slice(5)}`

/** What people type or scan: "art-abcde-fghjk", spaces, lower case. Null if it cannot be a certificate id. */
export function readCertId(raw: string | undefined | null) {
  const id = (raw ?? '').toUpperCase().replace(/^ART/, '').replace(/[^A-Z0-9]/g, '')
  return new RegExp(`^[${ALPHABET}]{${CERT_ID_LENGTH}}$`).test(id) ? id : null
}

/** The name printed: a child's first name for under-18 courses (the parent's name never goes on it), else the student's name. */
export function nameOnCertificate(opts: { under18: boolean; customerName?: string | null; childFirstName?: string | null }) {
  const clean = (s?: string | null) => (s ?? '').trim().replace(/\s+/g, ' ')
  if (opts.under18) return clean(opts.childFirstName).split(' ')[0] || ''
  return clean(opts.customerName)
}

/** The verify page shows a child's first name only; adults' names as printed. */
export const publicName = (name: string, under18: boolean) => (under18 ? name.split(' ')[0] : name)
