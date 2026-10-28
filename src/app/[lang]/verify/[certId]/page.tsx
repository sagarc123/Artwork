import config from '@payload-config'
import { Ban, BadgeCheck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import { PageHero } from '@/components/PageHero'
import { localePath } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { forUnder18 } from '@/lib/courses'
import { publicName, readCertId, showCertId } from '@/lib/learn'
import { whatsappLink } from '@/lib/site'
import { allow } from '@/server/rate-limit'

// Looked up per request, so an unknown number is a real 404 (the proxy checks too, before anything streams).
export const instant = false

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.verify.metaTitle, robots: { index: false, follow: false } }
}

/** Public check: shows only what is printed on the certificate (a child's first name only). */
export default async function VerifyPage({ params }: PageProps<'/[lang]/verify/[certId]'>) {
  const { certId } = await params
  const id = readCertId(certId)
  if (!id || !(await allow('verify', 60, 60_000))) notFound()
  const locale = await getLocale()
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'certificates', where: { publicId: { equals: id } }, limit: 1, depth: 0 })
  const cert = docs[0]
  if (!cert) notFound()
  const { docs: courses } = await payload.find({ collection: 'courses', locale, where: { id: { equals: cert.course as number } }, limit: 1, depth: 0 })
  const course = courses[0]
  const t = await getDictionary()
  const v = t.verify
  const date = new Intl.DateTimeFormat(`${locale}-IN`, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(cert.issuedAt))
  const valid = cert.status === 'valid'

  return (
    <>
      <PageHero title={valid ? v.genuine : v.withdrawn} />
      <section className="bg-paper pt-4 pb-20 lg:pt-8 lg:pb-28">
        <div className="wrap">
          <div className="mx-auto grid max-w-xl gap-5 rounded-ui bg-surface p-6 shadow-frame lg:p-8">
            <p className={`inline-flex items-center gap-2 font-semibold ${valid ? 'text-leaf' : 'text-kumkum'}`}>
              {valid ? <BadgeCheck aria-hidden="true" className="size-7" /> : <Ban aria-hidden="true" className="size-7" />}
              {valid ? v.verified : v.withdrawn}
            </p>
            {valid ? (
              <dl className="grid gap-4">
                <div>
                  <dt className="text-muted">{v.awarded}</dt>
                  <dd className="font-heading text-h2 [overflow-wrap:anywhere]">{publicName(cert.nameOnCert, course ? forUnder18(course.audience) : false)}</dd>
                </div>
                <div>
                  <dt className="text-muted">{v.forCourse}</dt>
                  <dd className="font-heading text-h3">{course?.title}</dd>
                </div>
                <div>
                  <dt className="text-muted">{v.on.replace('{date}', '')}</dt>
                  <dd className="font-semibold">{date}</dd>
                </div>
                <div>
                  <dt className="text-muted">{v.number}</dt>
                  <dd className="font-semibold">{showCertId(cert.publicId)}</dd>
                </div>
              </dl>
            ) : (
              <p>
                {v.withdrawnBody}{' '}
                <a href={whatsappLink(`${v.number}: ${showCertId(cert.publicId)}`)} target="_blank" rel="noopener noreferrer" className="ink-link font-semibold text-leaf">
                  WhatsApp
                </a>
              </p>
            )}
            {valid && (
              <div className="grid gap-3 sm:flex">
                <Link href={localePath(locale, `/certificate/${cert.publicId}`)} className="press inline-flex h-13 items-center justify-center rounded-ui border-[1.5px] border-charcoal px-6 font-semibold">
                  {v.viewCert}
                </Link>
                {course && (
                  <Link href={localePath(locale, `/courses/${course.slug}`)} className="press inline-flex h-13 items-center justify-center rounded-ui bg-kumkum px-6 font-semibold text-white hover:bg-kumkum/90">
                    {v.learnToo}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
