// Decorative rangoli artwork. Always aria-hidden: it carries no information.

const PETAL = 'M0,-9 C7,-18 7,-32 0,-42 C-7,-32 -7,-18 0,-9Z'
const ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]

/** Mandala that draws itself in (CSS `.rangoli-draw`); static when the visitor prefers reduced motion. */
export function RangoliDraw({ className = '', animate = true }: { className?: string; animate?: boolean }) {
  return (
    <svg
      viewBox="-50 -50 100 100"
      aria-hidden="true"
      focusable="false"
      className={`${animate ? 'rangoli-draw' : ''} ${className}`}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle r="46" pathLength={1} className="stroke-turmeric" strokeWidth="1.5" strokeDasharray="0.01 0.02" />
      <circle r="27" pathLength={1} className="stroke-peacock" strokeWidth="1.2" />
      {ANGLES.map((a) => (
        <path key={a} d={PETAL} pathLength={1} transform={`rotate(${a})`} className="stroke-kumkum" strokeWidth="1.6" />
      ))}
      {ANGLES.map((a) => (
        <path
          key={`s${a}`}
          d="M0,-10 C4,-15 4,-21 0,-26 C-4,-21 -4,-15 0,-10Z"
          pathLength={1}
          transform={`rotate(${a + 22.5})`}
          className="stroke-marigold"
          strokeWidth="1.3"
        />
      ))}
      <circle r="6" pathLength={1} className="stroke-kumkum" strokeWidth="1.6" />
      {ANGLES.map((a) => (
        <circle key={`d${a}`} r="1.8" cx="0" cy="-36" transform={`rotate(${a + 22.5})`} className="fill-peacock rangoli-dot" />
      ))}
    </svg>
  )
}

/** Thin ornament between major sections (used at most twice per page). */
export function MandalaDivider({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`flex items-center justify-center gap-4 py-2 ${className}`}>
      <span className="h-px w-20 bg-turmeric/70" />
      <RangoliDraw animate={false} className="size-8" />
      <span className="h-px w-20 bg-turmeric/70" />
    </div>
  )
}
