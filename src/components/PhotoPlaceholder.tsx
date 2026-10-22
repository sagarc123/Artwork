import { GenerativeRangoli } from './GenerativeRangoli'

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
  /** Seed for the stand-in rangoli (use the item's slug). */
  seed: string
  floor?: Floor
  /** What the real photo will show; read out by screen readers. */
  alt: string
  /** Owner note for which photo belongs here, e.g. "Product main image 4:5". Not shown to visitors. */
  slot: string
  className?: string
}

/** Where a real photo will go. Until then: a unique, code-drawn rangoli on a coloured floor. */
export function PhotoPlaceholder({ ratio, seed, floor = 'charcoal', alt, slot, className = '' }: Props) {
  return (
    <div
      role="img"
      aria-label={alt}
      data-photo-slot={slot}
      style={{ aspectRatio: ratio }}
      className={`relative grid w-full place-items-center overflow-hidden ${FLOORS[floor]} ${className}`}
    >
      <GenerativeRangoli seed={seed} tone={floor === 'paper' ? 'light' : 'dark'} className="w-[72%] max-w-80" />
    </div>
  )
}
