import { ImageIcon } from 'lucide-react'

export type PhotoKind = 'ART' | 'RNG' | 'EVT' | 'POR' | 'PRC'

type Props = {
  /** CSS aspect ratio, e.g. "4/5", "3/2", "16/9". */
  ratio: string
  kind: PhotoKind
  /** Shown inside the box so the owner knows which photo goes here. */
  label: string
  /** What the real photo will show; read out by screen readers. */
  alt: string
  className?: string
}

/** Stand-in for a photo until the artist's real images are uploaded. */
export function PhotoPlaceholder({ ratio, kind, label, alt, className = '' }: Props) {
  return (
    <div
      role="img"
      aria-label={alt}
      style={{ aspectRatio: ratio }}
      className={`flex w-full flex-col items-center justify-center gap-2 border border-border/30 bg-placeholder p-4 text-center text-muted ${className}`}
    >
      <ImageIcon aria-hidden="true" className="size-8" strokeWidth={1.5} />
      <span className="rounded-ui bg-surface/70 px-2 font-semibold tracking-wide">{kind}</span>
      <span className="max-w-[24ch]">{label}</span>
    </div>
  )
}
