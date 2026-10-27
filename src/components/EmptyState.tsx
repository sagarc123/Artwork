import type { ReactNode } from 'react'

// Sikku figure-eight round two dots of a 4×3 grid: the first line of a kolam, the rest still to come.
const DOTS = [15, 35, 55].flatMap((y) => [20, 40, 60, 80].map((x) => [x, y]))
const LINE = 'M30 35C30 20 10 20 10 35C10 50 30 50 30 35C30 20 50 20 50 35C50 50 30 50 30 35'

/** An unfinished kolam: a dot grid with one line drawn once (~1.5s), then it holds. Ink on everyday days, colour when festive. */
export function UnfinishedKolam({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 70" className={`kolam-wait w-28 ${className}`}>
      <g className="kw-dots">
        {DOTS.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" />
        ))}
      </g>
      <path d={LINE} pathLength={1} />
    </svg>
  )
}

/** Empty (or still loading) state: the unfinished kolam, a heading, an optional line of help and an action. */
export function EmptyState({ title, body, children, className = '' }: { title: ReactNode; body?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={`grid justify-items-center gap-4 rounded-ui bg-surface p-8 text-center sm:p-10 ${className}`}>
      <UnfinishedKolam />
      <p className="max-w-[36ch] font-heading text-h3">{title}</p>
      {body && <p className="max-w-[46ch] text-muted">{body}</p>}
      {children}
    </div>
  )
}

/** Waiting for the browser (saved pieces, prices): the same unfinished kolam with a short line. */
export function Loading({ label }: { label: string }) {
  return (
    <div role="status" className="grid justify-items-center gap-3 py-10 text-center text-muted">
      <UnfinishedKolam />
      <p>{label}</p>
    </div>
  )
}
