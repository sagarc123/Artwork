import { Info, MessageCircle } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DevNote, Filled } from '@/components/OwnerText'
import { PageHero } from '@/components/PageHero'
import { alternates } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { whatsappLink } from '@/lib/site'
import { getBusiness } from '@/server/content'

const SLUGS = ['shipping', 'returns', 'privacy', 'terms'] as const
type Slug = (typeof SLUGS)[number]

// Unknown slugs must wait for the full render so notFound() can still send a real 404 (not the streamed App Shell).
export const ensureStatic = 'navigation'
// Allowed to wait on navigation: unknown slugs must render fully so notFound() sends a real 404.
export const instant = false

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }))
}

async function load(params: PageProps<'/[lang]/policies/[slug]'>['params']) {
  const { slug } = await params
  if (!(SLUGS as readonly string[]).includes(slug)) notFound()
  const t = await getDictionary()
  return { slug: slug as Slug, t, policy: t.policies[slug as Slug] }
}

export async function generateMetadata({ params }: PageProps<'/[lang]/policies/[slug]'>): Promise<Metadata> {
  const { slug, policy } = await load(params)
  return { title: policy.title, description: policy.metaDesc, alternates: alternates(await getLocale(), `/policies/${slug}`) }
}

export default async function PolicyPage({ params }: PageProps<'/[lang]/policies/[slug]'>) {
  const { slug, t, policy } = await load(params)
  const b = await getBusiness()
  const fill = (text: string) => <Filled text={text} values={b.values} missing={t.missing} />
  const id = (i: number) => `${slug}-${i + 1}`
  // A section has paragraphs, a list, or both.
  const sections: { h: string; p?: string[]; list?: string[] }[] = policy.sections
  const toc = (
    <ol className="mt-2 grid gap-1">
      {sections.map((s, i) => (
        <li key={s.h}>
          <a href={`#${id(i)}`} className="ink-link inline-flex min-h-11 items-center text-peacock">
            {s.h}
          </a>
        </li>
      ))}
    </ol>
  )

  return (
    <>
      <PageHero title={policy.title} sub={t.policies.updated} word="नियम" />
      <section className="bg-paper pb-16 lg:pb-24">
        <div className="wrap grid gap-10 lg:grid-cols-12">
          {/* Phones: a closed "On this page" list, so the summary comes first. Desktop: an always-open sticky list. */}
          <nav aria-label={t.policies.contents} className="lg:col-span-3">
            <details className="rounded-ui bg-surface p-5 shadow-frame lg:hidden">
              <summary className="flex min-h-11 cursor-pointer items-center font-semibold">{t.policies.contents}</summary>
              {toc}
            </details>
            <div className="hidden rounded-ui bg-surface p-5 shadow-frame lg:sticky lg:top-32 lg:block">
              <p className="font-semibold">{t.policies.contents}</p>
              {toc}
            </div>
          </nav>

          <article className="grid max-w-[720px] content-start gap-10 lg:col-span-9">
            <DevNote>{t.policies.draft}</DevNote>
            <div className="flex gap-4 rounded-ui bg-placeholder p-5">
              <Info aria-hidden="true" className="mt-1 size-6 shrink-0 text-peacock" />
              <p>
                <strong>{t.policies.inShort}:</strong> {fill(policy.summary)}
              </p>
            </div>
            {sections.map((s, i) => (
              <section key={s.h} id={id(i)} className="grid scroll-mt-32 gap-3">
                <h2 className="font-heading text-h2">{s.h}</h2>
                {s.p?.map((p) => <p key={p}>{fill(p)}</p>)}
                {s.list && (
                  <ul className="grid list-disc gap-2 pl-6">
                    {s.list.map((li) => (
                      <li key={li}>{fill(li)}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
            <a
              href={whatsappLink(t.whatsapp.message, b.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="ink-link inline-flex min-h-11 items-center gap-2 justify-self-start font-semibold text-leaf"
            >
              <MessageCircle aria-hidden="true" className="size-5" />
              {t.policies.questions}
            </a>
          </article>
        </div>
      </section>
    </>
  )
}
