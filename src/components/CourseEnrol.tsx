'use client'

import { Award, Check, Infinity as Forever, MessageCircle, MonitorSmartphone } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { localePath, type Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { COURSE_VARIANT } from '@/lib/cart'
import { coursePrice, forUnder18, learnPath } from '@/lib/courses'
import { formatPrice, site, whatsappLink } from '@/lib/site'
import type { CourseCard } from '@/server/content'
import { enrolFree, getEnrolState, type EnrolState } from '@/server/auth-actions'
import { cartActions } from './cart-store'

type Course = Pick<CourseCard, 'slug' | 'title' | 'price' | 'salePrice' | 'audience' | 'certificateEnabled'>
type Props = { course: Course; locale: Locale; t: Dictionary['courses'] }
/** Under-18 courses: what the parent typed in the form of the Enrol card. */
type Parent = { childName: string; consent: boolean; onMissing: () => void }

/** Signed out, signed in, or already enrolled: asked after load, because the course pages themselves are cached for everyone. */
function useEnrolState(slug: string) {
  const [state, setState] = useState<EnrolState>('guest')
  useEffect(() => {
    let live = true
    getEnrolState(slug)
      .catch((): EnrolState => 'guest')
      .then((s) => live && setState(s))
    return () => {
      live = false
    }
  }, [slug])
  return state
}

const base = 'press inline-flex h-13 items-center justify-center gap-2 rounded-ui px-6 text-center font-semibold sm:h-12'

/**
 * The Enrol button.
 * - Already enrolled: "Go to my course".
 * - Paid: adds the course to the cart and goes to checkout, where signing in comes first.
 * - Free: signs in if needed, then enrols straight away.
 * - Under 18: needs the parent's box and the child's first name, which live in the card; elsewhere this button jumps to the card.
 */
export function EnrolButton({ course, locale, t, className = '', parent }: Props & { className?: string; parent?: Parent }) {
  const router = useRouter()
  const state = useEnrolState(course.slug)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const price = coursePrice(course)
  const child = forUnder18(course.audience)
  const label = child ? t.enrolChild : price.free ? t.enrolFree : t.enrol.replace('{price}', formatPrice(price.now))
  const coursePage = localePath(locale, `/courses/${course.slug}`)

  if (site.enrolByWhatsApp)
    return (
      <a href={whatsappLink(`${child ? t.waEnrolChild : t.waEnrol}: ${course.title}`)} target="_blank" rel="noopener noreferrer" className={`${base} bg-kumkum text-white hover:bg-kumkum/90 ${className}`}>
        <MessageCircle aria-hidden="true" className="size-6 shrink-0" />
        {label}
      </a>
    )

  if (state === 'enrolled')
    return (
      <a href={localePath(locale, learnPath(course.slug))} className={`${base} bg-leaf text-white hover:bg-leaf/90 ${className}`}>
        <Check aria-hidden="true" className="size-6 shrink-0" />
        {t.goToCourse}
      </a>
    )

  // An under-18 course is bought from the card, where the parent's box and the child's name are.
  if (child && !parent) return <a href={`${coursePage}#enrol`} className={`${base} bg-kumkum text-white hover:bg-kumkum/90 ${className}`}>{label}</a>

  async function enrol() {
    if (child && !parent!.consent) return parent!.onMissing()
    setFailed(false)
    const line = { slug: course.slug, variantId: COURSE_VARIANT, qty: 1, childName: parent?.childName.trim() || undefined, consent: child ? true : undefined }
    if (!price.free) {
      cartActions.add(line)
      return router.push(localePath(locale, '/checkout'))
    }
    if (state === 'guest') return router.push(`${localePath(locale, '/login')}?next=${encodeURIComponent(`/courses/${course.slug}`)}`)
    setBusy(true)
    const r = await enrolFree(course.slug, line.childName ?? '', child).catch(() => null)
    if (r?.status === 'ok') return router.push(localePath(locale, '/account'))
    setBusy(false)
    setFailed(true)
  }

  return (
    <>
      <button type="button" onClick={enrol} disabled={busy} className={`${base} bg-kumkum text-white hover:bg-kumkum/90 disabled:opacity-60 ${className}`}>
        {busy ? t.working : label}
      </button>
      {failed && (
        <p role="alert" className="font-semibold text-kumkum">
          {t.enrolFailed}
        </p>
      )}
    </>
  )
}

/** Price, the Enrol button and what you get, in a framed card. Sticky beside the video on desktop. */
export function EnrolCard({ course, locale, t }: Props) {
  const price = coursePrice(course)
  const child = forUnder18(course.audience)
  const [childName, setChildName] = useState('')
  const [consent, setConsent] = useState(false)
  const [missing, setMissing] = useState(false)
  const box = useRef<HTMLInputElement>(null)
  const perks = [
    { Icon: Forever, text: t.access },
    { Icon: MonitorSmartphone, text: t.devices },
    ...(course.certificateEnabled ? [{ Icon: Award, text: t.certificate }] : []),
  ]
  return (
    <div id="enrol" className="grid scroll-mt-32 gap-5 rounded-ui bg-surface p-6 shadow-frame">
      <p className="text-h2 font-semibold">
        {price.free ? t.free : formatPrice(price.now)}
        {price.was && <s className="ml-3 text-h3 font-normal text-muted">{formatPrice(price.was)}</s>}
      </p>
      {child && (
        <div className="grid gap-4 rounded-ui border-2 border-peacock p-4">
          <div className="grid gap-1">
            <p className="font-semibold">{t.parentTitle}</p>
            <p className="text-muted">{t.parentBody}</p>
          </div>
          <div className="grid gap-2">
            <label htmlFor="child-name" className="font-semibold">
              {t.childName}
            </label>
            <input id="child-name" value={childName} onChange={(e) => setChildName(e.target.value)} maxLength={40} autoComplete="off" aria-describedby="child-name-hint" className="h-13 w-full rounded-ui border border-border bg-surface px-4" />
            <p id="child-name-hint" className="text-muted">
              {t.childNameHint}
            </p>
          </div>
          <label className="flex min-h-11 items-start gap-3 font-semibold">
            <input ref={box} type="checkbox" checked={consent} onChange={(e) => (setConsent(e.target.checked), setMissing(false))} aria-invalid={missing} aria-describedby={missing ? 'consent-error' : undefined} className="mt-1 size-5 shrink-0 accent-kumkum" />
            {t.consent}
          </label>
          {missing && (
            <p id="consent-error" role="alert" className="font-semibold text-kumkum">
              {t.consentError}
            </p>
          )}
        </div>
      )}
      <EnrolButton course={course} locale={locale} t={t} parent={child ? { childName, consent, onMissing: () => (setMissing(true), box.current?.focus()) } : undefined} />
      {site.enrolByWhatsApp ? <p className="text-muted">{t.enrolNote}</p> : !price.free && <p className="text-muted">{t.noRefund}</p>}
      <ul className="grid gap-2 border-t border-border/30 pt-4">
        {perks.map(({ Icon, text }) => (
          <li key={text} className="flex items-center gap-3">
            <Icon aria-hidden="true" className="size-6 shrink-0 text-leaf" />
            {text}
          </li>
        ))}
      </ul>
    </div>
  )
}
