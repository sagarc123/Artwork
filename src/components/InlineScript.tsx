'use client'

/**
 * A script that runs once while the HTML is parsed (before first paint), as in Next's "Preventing flash" guide.
 * The server sends it as JavaScript; in the browser React sees `text/plain`, so it doesn't warn about rendering a script.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
