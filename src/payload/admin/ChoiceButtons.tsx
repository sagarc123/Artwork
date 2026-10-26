'use client'

import type { SelectFieldClientProps } from 'payload'
import { FieldLabel, useDocumentInfo, useField, useFormProcessing } from '@payloadcms/ui'
import { useOneTap } from './one-tap'

/**
 * A select shown as big tap buttons (easier than a dropdown on a phone).
 * `saveOnTap` (enquiry status): on a saved document each tap saves at once, with Undo.
 */
export function ChoiceButtons({ field, path, saveOnTap }: SelectFieldClientProps & { saveOnTap?: boolean }) {
  const { value, setValue, disabled } = useField<string>({ path: path ?? field.name })
  const { id } = useDocumentInfo()
  const busy = useFormProcessing()
  const save = useOneTap(path ?? field.name)
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
