'use client'

import { toast, useForm } from '@payloadcms/ui'

/**
 * Saves one field straight away (the one-tap buttons), then puts the new value in the form too: after a save with
 * overrides Payload keeps showing the old one, and a later Save would send it back. With `undoTo`, the toast offers
 * Undo for 6 seconds (the server's rules still decide whether it is allowed).
 */
export function useOneTap(path = 'status') {
  const { submit, dispatchFields } = useForm()
  const save = async (value: string, message: string, undoTo?: string | null): Promise<boolean> => {
    const r = await submit({ overrides: { [path]: value }, disableSuccessStatus: true })
    if (!r?.res?.ok) return false // Payload already showed why
    dispatchFields({ type: 'UPDATE', path, value })
    if (undoTo) toast.success(message, { duration: 6000, action: { label: 'Undo', onClick: () => void save(undoTo, 'Undone') } })
    else toast.success(message)
    return true
  }
  return save
}
