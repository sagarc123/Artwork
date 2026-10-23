'use client'

import type { SelectFieldClientComponent } from 'payload'
import { FieldLabel, useField } from '@payloadcms/ui'

/** A select shown as big tap buttons (easier than a dropdown on a phone). */
export const ChoiceButtons: SelectFieldClientComponent = ({ field, path }) => {
  const { value, setValue, disabled } = useField<string>({ path: path ?? field.name })
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
              disabled={disabled}
              className={`choice-buttons__btn${on ? ' is-on' : ''}`}
              onClick={() => setValue(option.value)}
            >
              {typeof option.label === 'string' ? option.label : option.value}
            </button>
          )
        })}
      </div>
    </div>
  )
}
