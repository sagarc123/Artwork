/** The one "Sold" label: flat ink stamp on the photo corner or beside the price, so it never reads as a button. */
export function SoldBadge({ label, className = '' }: { label: string; className?: string }) {
  return <span className={`inline-block bg-charcoal px-2 py-0.5 text-base leading-snug font-semibold tracking-wide text-paper uppercase ${className}`}>{label}</span>
}
