import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PageHero } from '@/components/PageHero'
import { localePath } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { readCertId } from '@/lib/learn'

export const instant = false

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.verify.metaTitle, robots: { index: false, follow: false } }
}

/** A plain form: type the number from the paper, go to its page. Works without JavaScript. */
export default async function VerifyIndex({ searchParams }: PageProps<'/[lang]/verify'>) {
  const locale = await getLocale()
  const t = await getDictionary()
  const v = t.verify
  const { id: raw } = await searchParams
  const typed = Array.isArray(raw) ? raw[0] : raw
  const id = readCertId(typed)
  if (id) redirect(localePath(locale, `/verify/${id}`))
  return (
    <>
      <PageHero title={v.checkTitle} sub={v.checkBody} />
      <section className="bg-paper pt-4 pb-20 lg:pt-8 lg:pb-28">
        <div className="wrap">
          <form action={localePath(locale, '/verify')} className="mx-auto grid max-w-md gap-4 rounded-ui bg-surface p-6 shadow-frame">
            <label htmlFor="id" className="font-semibold">
              {v.checkLabel}
            </label>
            <input id="id" name="id" defaultValue={typed ?? ''} autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={30} aria-invalid={!!typed} aria-describedby={typed ? 'id-error' : undefined} className="h-13 w-full rounded-ui border border-border bg-surface px-4 aria-invalid:border-2 aria-invalid:border-kumkum" />
            {typed && (
              <p id="id-error" role="alert" className="font-semibold text-kumkum">
                {v.notFound}
              </p>
            )}
            <button type="submit" className="press h-13 rounded-ui bg-kumkum px-6 font-semibold text-white hover:bg-kumkum/90">
              {v.checkButton}
            </button>
          </form>
        </div>
      </section>
    </>
  )
}
