import Image from 'next/image'
import type { Media } from '@/payload-types'
import { PhotoPlaceholder, type Floor } from './PhotoPlaceholder'

type Props = {
  media?: number | Media | null
  alt: string
  ratio: string
  /** Seed for the stand-in rangoli shown until a photo is uploaded. */
  seed: string
  floor?: Floor
  sizes: string
  priority?: boolean
  className?: string
}

/** An uploaded photo (responsive, AVIF/WebP), or the code-drawn stand-in if there is none yet. */
export function MediaImage({ media, alt, ratio, seed, floor, sizes, priority, className = '' }: Props) {
  if (media && typeof media === 'object' && media.url) {
    // Payload-hosted files are served by this same site: use the path so image optimisation treats them as local.
    const src = media.url.includes('/cms-api/') ? media.url.replace(/^https?:\/\/[^/]+/, '') : media.url
    return (
      <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio: ratio }}>
        <Image src={src} alt={media.alt || alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    )
  }
  return <PhotoPlaceholder ratio={ratio} seed={seed} floor={floor} alt={alt} slot={alt} className={className} />
}

/** First image of a document's `images` field, if populated. */
export const firstImage = (images: unknown) => (Array.isArray(images) && typeof images[0] === 'object' ? (images[0] as Media) : null)
