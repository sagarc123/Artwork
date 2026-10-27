import type { CSSProperties } from 'react'
import type { Dictionary } from '@/i18n/dictionaries'
import { kolam, r1 } from '@/lib/art'
import type { Media } from '@/payload-types'
import { BrushUnderline } from './Art'
import { MakingOfPlayer } from './MakingOfPlayer'
import { photoSrc } from './MediaImage'
import { SketchStandIn } from './StandIns'

const i = (n: number) => ({ '--i': n }) as CSSProperties

// Festive stand-in: a 4×5 kolam on the charcoal floor (sides must be coprime for one line). Dots pressed one by one,
// one line round them, colour poured from the centre outwards, then the kumkum bindu. Built once at module load.
const K = kolam(4, 5, 8)
const CELLS = [-24, -8, 8, 24].flatMap((y) => [-16, 0, 16].map((x) => ({ x, y, ring: Math.floor((Math.abs(x) + Math.abs(y)) / 16) })))
const COLOURS = ['var(--color-turmeric)', 'var(--color-kumkum)', 'var(--color-marigold)']

function RangoliInTheMaking() {
  return (
    <svg aria-hidden="true" viewBox="-50 -50 100 100" className="mo-rangoli size-full">
      <g className="fx" filter="url(#powder)">
        {CELLS.map(({ x, y, ring }) => (
          <path key={`${x}${y}`} d={`M${x} ${y - 6.5}L${x + 6.5} ${y}L${x} ${y + 6.5}L${x - 6.5} ${y}Z`} fill={COLOURS[ring]} opacity={0.92} className="mo-colour" style={i(ring)} />
        ))}
        <path d={K.d} pathLength={1} className="mo-line" />
        {K.dots.map(([x, y], n) => (
          <circle key={n} cx={r1(x)} cy={r1(y)} r={2} className="mo-dot" style={i(n)} />
        ))}
        <circle r={2.8} fill="var(--color-kumkum)" stroke="var(--color-paper)" strokeWidth={0.8} className="mo-bindu" />
      </g>
    </svg>
  )
}

type Props = {
  t: Dictionary['makingOf']
  makingOf: { video: Media | null; poster: Media | null; caption: string }
  className?: string
}

/** "Watch it being made": the owner's time-lapse (Website details → Making-of video), or a drawn stand-in until there is one. */
export function MakingOf({ t, makingOf, className = '' }: Props) {
  const src = photoSrc(makingOf.video)
  const video = src && makingOf.video?.mimeType?.startsWith('video/') ? { src, type: makingOf.video.mimeType } : null
  const standIn = (
    <>
      <div role="img" aria-label={t.standInFestive} className="look-festive absolute inset-0 grid place-items-center bg-charcoal grain-dark p-[8%]">
        <RangoliInTheMaking />
      </div>
      <div role="img" aria-label={t.standInEveryday} className="mo-sketch look-everyday absolute inset-0 grid place-items-center bg-paper grain">
        <SketchStandIn seed="making-of" subject="face" />
      </div>
      {/* ponytail: an invisible 4.9s timer; its animationend tells the player the drawing is finished (both looks run ~4.9s). */}
      <i className="mo-end" />
    </>
  )
  return (
    <section className={`bg-paper py-16 lg:py-24 ${className}`}>
      <div className="wrap grid gap-10 lg:grid-cols-12 lg:items-center">
        <div className="grid content-start gap-5 lg:col-span-5">
          <div>
            <h2 className="font-heading text-h1">{t.title}</h2>
            <BrushUnderline className="brush--view mt-2 w-48" />
          </div>
          <p className="max-w-[42ch] text-muted">{t.sub}</p>
        </div>
        <figure className="grid gap-3 lg:col-span-7">
          <div className="tape relative bg-surface p-2 shadow-frame sm:p-3">
            <MakingOfPlayer
              video={video}
              poster={photoSrc(makingOf.poster)}
              describedBy="making-of-caption"
              labels={{ play: t.play, pause: t.pause, replay: t.replay }}
              note={video ? undefined : <p className="text-muted">{t.soon}</p>}
            >
              {standIn}
            </MakingOfPlayer>
          </div>
          {video && (
            <figcaption id="making-of-caption" className="text-muted">
              {makingOf.caption || t.caption}
            </figcaption>
          )}
        </figure>
      </div>
    </section>
  )
}
