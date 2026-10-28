import { Award, Infinity as Forever, MessageCircle, MonitorSmartphone } from 'lucide-react'
import { localePath, type Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { coursePrice, forUnder18 } from '@/lib/courses'
import { formatPrice, site, whatsappLink } from '@/lib/site'
import type { CourseCard } from '@/server/content'

type Props = { course: Pick<CourseCard, 'slug' | 'title' | 'price' | 'salePrice' | 'audience' | 'certificateEnabled'>; locale: Locale; t: Dictionary['courses'] }

/** The Enrol button. Part 1: WhatsApp (site.enrolByWhatsApp). Part 2 turns that flag off and the same button goes to login and payment. */
export function EnrolButton({ course, locale, t, className = '' }: Props & { className?: string }) {
  const price = coursePrice(course)
  const child = forUnder18(course.audience)
  const label = child ? t.enrolChild : price.free ? t.enrolFree : t.enrol.replace('{price}', formatPrice(price.now))
  const viaWhatsApp = site.enrolByWhatsApp
  const href = viaWhatsApp ? whatsappLink(`${child ? t.waEnrolChild : t.waEnrol}: ${course.title}`) : localePath(locale, `/login?next=${encodeURIComponent(`/courses/${course.slug}`)}`)
  return (
    <a
      href={href}
      {...(viaWhatsApp ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`press inline-flex h-13 items-center justify-center gap-2 rounded-ui bg-kumkum px-6 text-center font-semibold text-white hover:bg-kumkum/90 sm:h-12 ${className}`}
    >
      {viaWhatsApp && <MessageCircle aria-hidden="true" className="size-6 shrink-0" />}
      {label}
    </a>
  )
}

/** Price, the Enrol button and what you get, in a framed card. Sticky beside the video on desktop. */
export function EnrolCard({ course, locale, t }: Props) {
  const price = coursePrice(course)
  const perks = [
    { Icon: Forever, text: t.access },
    { Icon: MonitorSmartphone, text: t.devices },
    ...(course.certificateEnabled ? [{ Icon: Award, text: t.certificate }] : []),
  ]
  return (
    <div className="grid gap-5 rounded-ui bg-surface p-6 shadow-frame">
      <p className="text-h2 font-semibold">
        {price.free ? t.free : formatPrice(price.now)}
        {price.was && <s className="ml-3 text-h3 font-normal text-muted">{formatPrice(price.was)}</s>}
      </p>
      <EnrolButton course={course} locale={locale} t={t} />
      {site.enrolByWhatsApp && <p className="text-muted">{t.enrolNote}</p>}
      <ul className="grid gap-2 border-t border-border/30 pt-4">
        {perks.map(({ Icon, text }) => (
          <li key={text} className="flex items-center gap-3">
            <Icon aria-hidden="true" className="size-6 shrink-0 text-leaf" />
            {text}
          </li>
        ))}
      </ul>
      {forUnder18(course.audience) && (
        <div className="grid gap-1 rounded-ui border-2 border-peacock p-4">
          <p className="font-semibold">{t.parentTitle}</p>
          <p className="text-muted">{t.parentBody}</p>
        </div>
      )}
    </div>
  )
}
