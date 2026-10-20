import { useId, useRef, useEffect, type ReactNode } from 'react'

import { Label } from '@/components/ui/label'

interface FormFieldProps {
  label: string
  htmlFor?: string
  hint?: string
  required?: boolean
  error?: string
  children: ReactNode
}

export function FormField({
  label,
  htmlFor,
  hint,
  required = false,
  error,
  children,
}: FormFieldProps) {
  const generatedId = useId()
  const fieldId = htmlFor ?? generatedId
  const wrapper = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const controls = wrapper.current?.querySelectorAll(
      'input:not([type="hidden"]),select,textarea,[role="combobox"]',
    )
    controls?.forEach((control, index) => {
      if (index === 0 && !control.id) control.id = fieldId
      control.setAttribute('aria-invalid', error ? 'true' : 'false')
      control.setAttribute('aria-required', String(required))
      const describedBy = [
        hint ? `${fieldId}-hint` : '',
        error ? `${fieldId}-error` : '',
      ]
        .filter(Boolean)
        .join(' ')
      if (describedBy) control.setAttribute('aria-describedby', describedBy)
      else control.removeAttribute('aria-describedby')
    })
  }, [fieldId, error, hint, required, children])
  return (
    <div ref={wrapper} className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={fieldId}>{label}</Label>
      </div>
      {children}
      {hint ? (
        <p id={`${fieldId}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${fieldId}-error`}
          role="alert"
          className="text-xs text-destructive"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}
