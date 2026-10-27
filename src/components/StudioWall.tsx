import type { CSSProperties, ReactNode } from 'react'
import { kolam, r1 } from '@/lib/art'
import type { Media } from '@/payload-types'
import { MediaImage } from './MediaImage'
import { Signature } from './Signature'
import { SketchStandIn, WashStandIn } from './StandIns'

/** A real photo for one spot on the wall (a product of that medium with an uploaded photo). */
export type WallPhoto = { media: Media; alt: string } | null

const drop = (px: number) => ({ '--drop': `${px}px` }) as CSSProperties

// The rangoli study: a 3×4 kolam, one unbroken line round every dot, in ink. Drawn once here, not per request.
// ponytail: not GenerativeRangoli — its powder layers and spilt grains cost ~4 KB of page HTML for a small sketch.
const KOLAM = kolam(3, 4, 8.6)
const KOLAM_DOTS = KOLAM.dots.map(([x, y]) => `M${r1(x)},${r1(y)}h0`).join('')

function Piece({ photo, ratio, sizes, standIn }: { photo: WallPhoto; ratio: string; sizes: string; standIn: ReactNode }) {
  return photo ? <MediaImage media={photo.media} alt={photo.alt} ratio={ratio} seed="studio" sizes={sizes} /> : standIn
}

/**
 * Everyday hero: his range on a studio wall. A charcoal portrait and a watercolour hang on strings, a rangoli study in ink
 * is taped up. Stand-ins draw themselves in pencil and ink (globals.css) until real photos exist.
 */
export function StudioWall({ portrait, painting, rangoli, labels }: { portrait: WallPhoto; painting: WallPhoto; rangoli: WallPhoto; labels: { portrait: string; painting: string; rangoli: string } }) {
  return (
    <div className="grid grid-cols-[1.2fr_1fr] items-start gap-x-4 gap-y-5 pt-7 sm:gap-x-8 sm:gap-y-6 sm:pt-9 lg:gap-x-12 lg:gap-y-10 lg:pt-12">
      <figure className="row-span-2 grid gap-3">
        <div className="hang bg-surface p-2 shadow-frame sm:p-3 lg:p-4" style={drop(30)}>
          <Piece
            photo={portrait}
            ratio="4/5"
            sizes="(min-width: 1024px) 30vw, 55vw"
            standIn={
              <div aria-hidden="true" className="sketch-draw grid aspect-[4/5] place-items-center bg-paper grain">
                <SketchStandIn seed="studio-portrait" subject="face" scribble={false} />
              </div>
            }
          />
        </div>
        <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 text-muted">
          {labels.portrait}
          {/* Phones: no signature, so the headline stays on the first screen. */}
          <span className="max-sm:hidden">
            <Signature draw="load" className="text-charcoal/80" />
          </span>
        </figcaption>
      </figure>
      <figure className="grid gap-3">
        <div className="hang rotate-1 bg-surface p-2 shadow-frame lg:p-3" style={drop(18)}>
          <Piece
            photo={painting}
            ratio="5/4"
            sizes="(min-width: 1024px) 24vw, 45vw"
            standIn={
              <div aria-hidden="true" className="wash-in relative aspect-[5/4] bg-paper grain">
                <WashStandIn seed="studio-wash-3" />
              </div>
            }
          />
        </div>
        <figcaption className="text-muted">{labels.painting}</figcaption>
      </figure>
      <figure className="grid w-4/5 gap-3 justify-self-center">
        <div className="tape relative -rotate-2 bg-paper p-2 shadow-frame grain lg:p-3">
          <Piece
            photo={rangoli}
            ratio="1/1"
            sizes="(min-width: 1024px) 18vw, 35vw"
            standIn={
              <svg aria-hidden="true" viewBox="-45 -45 90 90" className="ink-kolam block w-full">
                <path d={KOLAM_DOTS} />
                <path d={KOLAM.d} pathLength={1} />
              </svg>
            }
          />
        </div>
        <figcaption className="text-muted">{labels.rangoli}</figcaption>
      </figure>
    </div>
  )
}
