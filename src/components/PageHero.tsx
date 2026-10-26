import type { CSSProperties, ReactNode } from 'react'
import { BrushUnderline, DisplayWord } from './Art'

const FLOORS = {
  paper: 'bg-paper grain text-charcoal',
  charcoal: 'bg-charcoal grain-dark text-paper',
  kumkum: 'bg-kumkum grain-dark text-paper',
  peacock: 'bg-peacock grain-dark text-paper',
  leaf: 'bg-leaf grain-dark text-paper',
} as const

type Props = {
  floor?: keyof typeof FLOORS
  kicker?: string
  title: string
  sub?: string
  /** Giant Devanagari word behind the section. */
  word?: string
  /** Buttons and links under the text. */
  children?: ReactNode
  /** Illustration on the right (desktop) / below (phone). */
  art?: ReactNode
  /** false: the illustration is desktop-only decoration. */
  artOnPhones?: boolean
}

/** Top section for inner pages, on a coloured "floor". */
export function PageHero({ floor = 'paper', kicker, title, sub, word, children, art, artOnPhones = true }: Props) {
  const dark = floor !== 'paper'
  return (
    <section className={`relative overflow-hidden ${FLOORS[floor]}`}>
      {word && <DisplayWord className={`absolute top-2 -right-4 ${dark ? 'text-paper/[0.08]' : 'text-charcoal/[0.05]'}`}>{word}</DisplayWord>}
      <div className="wrap relative grid gap-10 py-12 lg:grid-cols-12 lg:items-center lg:py-20">
        <div className={`grid gap-5 ${art ? 'lg:col-span-6' : 'lg:col-span-9'}`}>
          {kicker && <p className={`hero-in font-semibold ${dark ? 'text-paper/85' : 'text-kumkum'}`}>{kicker}</p>}
          <div>
            <h1 className="hero-title font-heading text-display">{title}</h1>
            <BrushUnderline className="brush--draw mt-3 w-2/3 max-w-xs" />
          </div>
          {sub && (
            <p className={`hero-in max-w-[50ch] ${dark ? 'text-paper/90' : 'text-muted'}`} style={{ '--n': 1 } as CSSProperties}>
              {sub}
            </p>
          )}
          {children && (
            <div className="hero-in grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-x-7" style={{ '--n': 2 } as CSSProperties}>
              {children}
            </div>
          )}
        </div>
        {art && <div className={`lg:col-span-6 ${artOnPhones ? '' : 'max-lg:hidden'}`}>{art}</div>}
      </div>
    </section>
  )
}
