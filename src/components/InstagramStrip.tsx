import { ArrowUpRight } from 'lucide-react'
import type { Dictionary } from '@/i18n/dictionaries'
import type { Media } from '@/payload-types'
import { MediaImage } from './MediaImage'

const MIN_POSTS = 3

/** "From my Instagram": 3–6 photos the owner picked in Site settings, each opening the Instagram profile. No Instagram API. */
export function InstagramStrip({ href, posts, caption, t }: { href: string; posts: Media[]; caption?: string; t: Dictionary['home']['instagram'] }) {
  if (!href || posts.length < MIN_POSTS) return null
  return (
    <section className="bg-paper py-16 lg:py-24">
      <div className="wrap grid gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-2">
            <h2 className="font-heading text-h1">{t.title}</h2>
            {caption && <p className="max-w-[50ch] text-muted">{caption}</p>}
          </div>
          <a href={href} target="_blank" rel="noopener noreferrer" className="ink-link inline-flex min-h-11 items-center gap-1 font-semibold text-peacock">
            {t.follow}
            <ArrowUpRight aria-hidden="true" className="size-5" />
          </a>
        </div>
        <ul className="grid grid-cols-3 gap-2 sm:gap-4 lg:grid-cols-6">
          {posts.map((m, i) => {
            const label = t.open.replace('{title}', m.alt || t.photo.replace('{n}', String(i + 1)))
            return (
              <li key={m.id}>
                <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="card block bg-surface p-1.5 shadow-frame">
                  {/* Lazy (next/image default) and small: a third of a phone screen, a sixth of a laptop. */}
                  <MediaImage media={m} alt="" ratio="1/1" seed={`insta-${m.id}`} floor={(['kumkum', 'peacock', 'charcoal', 'leaf'] as const)[i % 4]} sizes="(min-width: 1024px) 16vw, 33vw" />
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
