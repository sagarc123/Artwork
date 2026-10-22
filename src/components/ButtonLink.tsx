import Link from 'next/link'
import type { ComponentProps } from 'react'

const variants = {
  // One primary per view (design rule).
  primary: 'bg-kumkum text-white hover:bg-kumkum/90 active:bg-kumkum/80',
  secondary:
    'border-[1.5px] border-charcoal text-charcoal hover:bg-charcoal hover:text-paper active:bg-charcoal/90 active:text-paper',
  /** On coloured floors (kumkum, peacock, charcoal): paper button, dark text. */
  light: 'bg-paper text-charcoal hover:bg-white active:bg-paper/90',
  tertiary: 'text-peacock underline underline-offset-4 hover:no-underline px-0 min-h-11',
}

type Props = ComponentProps<typeof Link> & { variant?: keyof typeof variants }

/** A link that looks like a button: 52px tall on phones, 48px from tablets up. */
export function ButtonLink({ variant = 'primary', className = '', ...props }: Props) {
  const box = variant === 'tertiary' ? '' : 'h-13 px-6 sm:h-12 rounded-ui'
  return (
    <Link
      {...props}
      className={`press inline-flex items-center justify-center text-center font-semibold transition-[color,background-color,transform] ${box} ${variants[variant]} ${className}`}
    />
  )
}
