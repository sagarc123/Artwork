import { fillParts } from '@/lib/search'

/** A sentence with {slots} filled from the admin settings. Empty slots show a visible "to be filled in" marker for the owner. */
export function Filled({ text, values, missing }: { text: string; values: Record<string, string | number | null | undefined>; missing: string }) {
  return fillParts(text, values).map((part, i) =>
    typeof part === 'string' ? (
      part
    ) : (
      <mark key={i} data-missing={part.missing} className="rounded-sm bg-turmeric/40 px-1 text-charcoal">
        [{missing}]
      </mark>
    ),
  )
}

/** Plain text version (for metadata and JSON-LD): empty slots become "…". */
export const fillText = (text: string, values: Record<string, string | number | null | undefined>) =>
  fillParts(text, values)
    .map((p) => (typeof p === 'string' ? p : '…'))
    .join('')

/** A note for the site owner, shown only while developing (never to visitors in production). */
export function DevNote({ children }: { children: string }) {
  if (process.env.NODE_ENV === 'production') return null
  return <p className="rounded-ui border-2 border-dashed border-kumkum bg-surface p-4 font-semibold text-kumkum">{children}</p>
}
