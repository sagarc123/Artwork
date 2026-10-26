import Image from 'next/image'
import type { Medium, RangoliStyle } from '@/lib/art'
import type { Media } from '@/payload-types'
import { PhotoPlaceholder, type Floor } from './PhotoPlaceholder'

type Props = {
  media?: number | Media | null
  alt: string
  ratio: string
  /** Seed for the stand-in shown until a photo is uploaded. */
  seed: string
  /** Which stand-in fits (rangoli, drawing, portrait, painting). */
  medium?: Medium
  style?: RangoliStyle
  floor?: Floor
  sizes: string
  priority?: boolean
  className?: string
}

// ponytail: the seed script's sample PNGs (sample-*.png) are all rangoli renders, so they count as "no photo yet" and the medium-correct stand-in shows.
const isReal = (m: Media) => Boolean(m.url) && !m.filename?.startsWith('sample-')

/** An uploaded photo (responsive, AVIF/WebP), or the code-drawn stand-in if there is none yet. */
export function MediaImage({ media, alt, ratio, seed, medium, style, floor, sizes, priority, className = '' }: Props) {
  if (media && typeof media === 'object' && isReal(media)) {
    // Payload-hosted files are served by this same site: use the path so image optimisation treats them as local.
    const src = media.url!.includes('/cms-api/') ? media.url!.replace(/^https?:\/\/[^/]+/, '') : media.url!
    return (
      <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio: ratio }}>
        <Image src={src} alt={alt === '' ? '' : media.alt || alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    )
  }
  return <PhotoPlaceholder ratio={ratio} seed={seed} medium={medium} style={style} floor={floor} alt={alt} slot={alt || seed} className={className} />
}
