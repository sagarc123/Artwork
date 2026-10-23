import type { Medium, RangoliStyle } from '@/lib/art'
import { GenerativeRangoli } from './GenerativeRangoli'
import { SketchStandIn, WashStandIn } from './StandIns'

const FLOORS = {
  paper: 'bg-paper grain',
  charcoal: 'bg-charcoal grain-dark',
  kumkum: 'bg-kumkum grain-dark',
  peacock: 'bg-peacock grain-dark',
  leaf: 'bg-leaf grain-dark',
} as const

export type Floor = keyof typeof FLOORS

type Props = {
  /** CSS aspect ratio, e.g. "4/5". */
  ratio: string
  /** Seed for the stand-in (use the item's slug). */
  seed: string
  /** What kind of piece this is, so the stand-in matches: a rangoli, a charcoal sketch, a wash, or a note for the artist's photo. */
  medium?: Medium
  /** Rangoli style (rangoli only); default from the seed. */
  style?: RangoliStyle
  floor?: Floor
  /** What the real photo will show; read out by screen readers. */
  alt: string
  /** Owner note for which photo belongs here, e.g. "Product main image 4:5". Not shown to visitors. */
  slot: string
  /** Visible line on the artist card, e.g. "Siddesh's photo coming soon". */
  note?: string
  className?: string
}

/** Where a real photo will go. Until then: a code-drawn stand-in in the right medium (never a pattern for the artist himself). */
export function PhotoPlaceholder({ ratio, seed, medium = 'rangoli', style, floor = 'charcoal', alt, slot, note, className = '' }: Props) {
  const paper = medium !== 'rangoli'
  return (
    <div
      // alt="" = decorative (the visible title already names it).
      // The artist card's note is real text, so it is read out as is (no fake "image").
      role={alt && medium !== 'artist' ? 'img' : undefined}
      aria-label={alt && medium !== 'artist' ? alt : undefined}
      aria-hidden={alt || medium === 'artist' ? undefined : true}
      data-photo-slot={slot}
      style={{ aspectRatio: ratio }}
      className={`relative grid w-full place-items-center overflow-hidden ${medium === 'artist' ? 'bg-placeholder' : paper ? FLOORS.paper : FLOORS[floor]} ${className}`}
    >
      {medium === 'artist' ? (
        <p className="max-w-[18ch] p-6 text-center font-heading text-h3 text-muted">{note}</p>
      ) : medium === 'painting' ? (
        <WashStandIn seed={seed} />
      ) : medium === 'drawing' || medium === 'portrait' ? (
        <SketchStandIn seed={seed} subject={medium === 'portrait' ? 'face' : 'still'} />
      ) : (
        <GenerativeRangoli seed={seed} style={style} tone={floor === 'paper' ? 'light' : 'dark'} className="w-[78%] max-w-96" />
      )}
    </div>
  )
}
