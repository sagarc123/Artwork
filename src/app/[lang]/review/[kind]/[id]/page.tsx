import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import config from '@payload-config'
import { getPayload } from 'payload'
import { PageHero } from '@/components/PageHero'
import { ReviewForm } from '@/components/ReviewForm'
import { localePath } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { getCustomer } from '@/server/customer'
import { reviewCheck } from '@/server/reviews'

// Private and per person: eligibility is decided on the server for the signed-in customer.
export const instant = false

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.reviews.metaTitle, robots: { index: false, follow: false } }
}

/** /review/product/12 or /review/course/3: the form, only for someone who may review it. Linked from My account and the lesson player. */
export default async function ReviewPage({ params }: PageProps<'/[lang]/review/[kind]/[id]'>) {
  const { kind, id: raw } = await params
  if ((kind !== 'product' && kind !== 'course') || !/^\d{1,9}$/.test(raw)) notFound()
  const id = Number(raw)
  const locale = await getLocale()
  const me = await getCustomer()
  if (!me) redirect(`${localePath(locale, '/login')}?next=${encodeURIComponent(`/review/${kind}/${id}`)}`)
  const t = await getDictionary()
  const r = t.reviews
  const payload = await getPayload({ config })
  const item = await payload.findByID({ collection: kind === 'product' ? 'products' : 'courses', id, locale, depth: 0, select: { title: true, _status: true } }).catch(() => null)
  if (!item || ('_status' in item && item._status !== 'published')) notFound()
  const check = await reviewCheck(me, kind, id)
  const back = localePath(locale, kind === 'course' ? '/account' : '/account?tab=orders')
  return (
    <>
      <PageHero title={r.write} sub={`${r.formFor} ${item.title}`} />
      <section className="bg-paper pt-4 pb-20 lg:pt-8 lg:pb-28">
        <div className="wrap grid gap-6">
          <ReviewForm kind={kind} id={id} name={me.name} back={back} t={r} blocked={check === 'ok' ? undefined : check} />
        </div>
      </section>
    </>
  )
}
