'use client'

import { toast } from '@payloadcms/ui'

/** Copies text (e.g. the address for the courier form) and says so. */
export function CopyButton({ text, label }: { text: string; label: string }) {
  return (
    <button
      type="button"
      className="one-tap__btn is-small"
      onClick={() =>
        navigator.clipboard.writeText(text).then(
          () => toast.success('Copied'),
          () => toast.error('Could not copy. Press and hold the text to copy it.'),
        )
      }
    >
      {label}
    </button>
  )
}
