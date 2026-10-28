/** A plain labelled progress bar ("3 of 5 lessons done"). The text carries the meaning; the bar is a second cue. */
export function ProgressBar({ done, total, label }: { done: number; total: number; label: string }) {
  const percent = total ? Math.round((done / total) * 100) : 0
  return (
    <div className="grid gap-1.5">
      <p className="font-semibold">{label}</p>
      <div role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={label} className="h-2.5 overflow-hidden rounded-full bg-charcoal/15">
        <div className="h-full rounded-full bg-leaf" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
