import config from '@payload-config'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import { GenerativeRangoli } from '@/components/GenerativeRangoli'
import { PrintButton } from '@/components/PrintButton'
import { localePath } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { forUnder18 } from '@/lib/courses'
import { publicName, readCertId, showCertId } from '@/lib/learn'
import { site } from '@/lib/site'
import { allow } from '@/server/rate-limit'

export const instant = false

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.certificate.metaTitle, robots: { index: false, follow: false } }
}

// Printing: just the certificate, on one A4 landscape page.
const PRINT_CSS = `
@page { size: A4 landscape; margin: 0 }
@media print {
  header.site-header, footer, body > nav, .skip-link, .no-print, .wa-nudge, [data-print-hide] { display: none !important }
  html, body { background: #fff !important }
  .cert-wrap { padding: 0 !important }
  .cert-sheet { box-shadow: none !important; width: 297mm !important; height: 209mm !important; max-width: none !important; border-radius: 0 !important; break-inside: avoid }
}`

/** The certificate as a printable page (Print, or "Save as PDF" in the browser). The unguessable number in the link is the key, as on the verify page. */
export default async function CertificatePage({ params }: PageProps<'/[lang]/certificate/[certId]'>) {
  const { certId } = await params
  const id = readCertId(certId)
  if (!id || !(await allow('verify', 60, 60_000))) notFound()
  const locale = await getLocale()
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'certificates', where: { publicId: { equals: id } }, limit: 1, depth: 0 })
  const cert = docs[0]
  if (!cert) notFound()
  const [{ docs: courses }, { totalDocs: lessonCount }] = await Promise.all([
    payload.find({ collection: 'courses', locale, where: { id: { equals: cert.course as number } }, limit: 1, depth: 0 }),
    payload.count({ collection: 'lessons', where: { course: { equals: cert.course as number } } }),
  ])
  const course = courses[0]
  const t = await getDictionary()
  const k = t.certificate
  const level = course ? t.courses.levels[course.level] : ''
  const date = new Intl.DateTimeFormat(`${locale}-IN`, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(cert.issuedAt))
  const verifyUrl = `${site.url.replace(/\/$/, '')}/verify/${cert.publicId}`
  const valid = cert.status === 'valid'

  return (
    <section className="cert-wrap bg-paper px-4 py-8 lg:py-12">
      <style>{PRINT_CSS}</style>
      <div className="no-print mx-auto mb-6 flex max-w-4xl flex-wrap items-center justify-between gap-4">
        <Link href={localePath(locale, `/verify/${cert.publicId}`)} className="ink-link inline-flex min-h-11 items-center font-semibold text-peacock">
          {k.back}
        </Link>
        {valid && <PrintButton label={k.print} />}
      </div>
      {!valid && (
        <p role="alert" className="no-print mx-auto mb-6 max-w-4xl font-semibold text-kumkum">
          {k.withdrawn}
        </p>
      )}
      {valid && (
      <div className="cert-sheet relative mx-auto grid max-w-4xl place-items-center overflow-hidden rounded-ui bg-white p-3 text-center shadow-frame sm:p-5">
        <div className="relative grid size-full content-center justify-items-center gap-2 border-4 border-double border-marigold p-4 sm:gap-3 sm:p-10">
          <GenerativeRangoli seed={cert.publicId} className="size-14 sm:size-20" />
          <h1 className="font-heading text-h2 sm:text-h1">{k.title}</h1>
          <p className="text-muted">{k.certify}</p>
          <p className="font-heading text-h1 [overflow-wrap:anywhere] sm:text-[2.5rem]">{publicName(cert.nameOnCert, course ? forUnder18(course.audience) : false)}</p>
          <p className="text-muted">{k.completed}</p>
          <p className="font-heading text-h2 [overflow-wrap:anywhere]">{course?.title}</p>
          <p className="text-muted">{[level, t.courses.lessons.replace('{n}', String(lessonCount))].filter(Boolean).join(' · ')}</p>
          <p className="font-semibold">{k.on.replace('{date}', date)}</p>
          <div className="mt-2 grid w-full max-w-md grid-cols-2 items-end gap-6 text-left text-[0.9375rem]">
            <div>
              <div aria-hidden="true" className="h-10 border-b border-charcoal" />
              <p className="font-semibold">{site.artistName}</p>
              <p className="text-muted">
                {k.artist}
                {site.brandName !== site.artistName && `, ${site.brandName}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-muted">{k.number}</p>
              <p className="font-semibold">{showCertId(cert.publicId)}</p>
            </div>
          </div>
          <p className="text-muted [overflow-wrap:anywhere]">
            {k.verifyAt}: {verifyUrl}
          </p>
        </div>
      </div>
      )}
    </section>
  )
}
