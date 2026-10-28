'use client'

import { useDocumentInfo, useLocale } from '@payloadcms/ui'
import { sitePath } from '../../lib/admin'

const PATH: Record<string, (slug: string) => string> = {
  products: (s) => `/shop/p/${s}`,
  courses: (s) => `/courses/${s}`,
  artworks: () => '/artwork',
}

/** Top of the form, once the piece is saved and live: a link to its page on the website, in the language being edited. */
export function ViewOnSite() {
  const { collectionSlug, id, initialData, hasPublishedDoc } = useDocumentInfo()
  const locale = useLocale()
  const slug = (initialData as { slug?: string } | undefined)?.slug
  const path = collectionSlug && PATH[collectionSlug]
  if (!id || !path || (collectionSlug !== 'artworks' && !slug)) return null
  if (!hasPublishedDoc) return <p className="view-on-site is-draft">Saved as a draft: it is not on the website yet.</p>
  return (
    <p className="view-on-site">
      <a href={sitePath(locale?.code, path(slug ?? ''))} target="_blank" rel="noopener noreferrer">
        View it on the website →
      </a>
    </p>
  )
}
