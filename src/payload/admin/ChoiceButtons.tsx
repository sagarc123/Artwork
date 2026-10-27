'use client'

import type { SelectFieldClientProps } from 'payload'
import { FieldLabel, useDocumentInfo, useField, useFormInitializing, useFormProcessing } from '@payloadcms/ui'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useOneTap } from './one-tap'

/**
 * A select shown as big tap buttons (easier than a dropdown on a phone).
 * `saveOnTap` (enquiry status): on a saved document each tap saves at once, with Undo.
 * `fromQuery`: a new document starts on the choice named in the address, e.g. Today's "+ Print" (?type=print).
 */
export function ChoiceButtons({ field, path, saveOnTap, fromQuery }: SelectFieldClientProps & { saveOnTap?: boolean; fromQuery?: string }) {
  const { value, setValue, disabled } = useField<string>({ path: path ?? field.name })
  const { id } = useDocumentInfo()
  const busy = useFormProcessing()
  const save = useOneTap(path ?? field.name)
  const preset = useSearchParams().get(fromQuery ?? '')
  const initializing = useFormInitializing()
  const applied = useRef(false)
  useEffect(() => {
    // Once, when the new document's form is ready (earlier, the form's own first values would replace it).
    if (initializing || applied.current || id || !preset) return
    applied.current = true
    if (preset !== value && field.options.some((o) => (typeof o === 'string' ? o : o.value) === preset)) setValue(preset)
  }, [initializing, id, preset, value, field.options, setValue])
  const label = (v: unknown) => {
    const o = field.options.find((x) => (typeof x === 'string' ? x : x.value) === v)
    return typeof o === 'object' && typeof o.label === 'string' ? o.label : String(v ?? '')
  }
  return (
    <div className="field-type choice-buttons">
      <FieldLabel label={field.label ?? field.name} path={path} />
      <div className="choice-buttons__row" role="radiogroup">
        {field.options.map((o) => {
          const option = typeof o === 'string' ? { label: o, value: o } : o
          const on = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={disabled || (saveOnTap && busy)}
              className={`choice-buttons__btn${on ? ' is-on' : ''}`}
              onClick={() => (saveOnTap && id && !on ? void save(option.value, `Saved: ${label(option.value)}`, value) : setValue(option.value))}
            >
              {typeof option.label === 'string' ? option.label : option.value}
            </button>
          )
        })}
      </div>
    </div>
  )
}
