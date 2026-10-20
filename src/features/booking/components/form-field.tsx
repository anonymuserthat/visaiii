import { useId, type ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { FieldContext } from '@/components/ui/field-context'

interface FormFieldProps {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  children: ReactNode
}

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  children,
}: FormFieldProps) {
  const generatedId = useId()
  const id = htmlFor ?? generatedId
  const labelId = `${id}-label`
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  return (
    <FieldContext.Provider
      value={{
        id,
        labelId,
        descriptionId: [hintId, errorId].filter(Boolean).join(' ') || undefined,
        invalid: Boolean(error),
      }}
    >
      <div className="form-field">
        <Label id={labelId} htmlFor={id}>
          {label}
        </Label>
        {children}
        {hint ? (
          <p id={hintId} className="field-hint">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} className="field-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  )
}
