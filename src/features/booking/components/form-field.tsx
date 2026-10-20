import { useId, useRef, useEffect, type ReactNode } from 'react'

import { Label } from '@/components/ui/label'

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
  const fieldId = htmlFor ?? generatedId
  const wrapper = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const controls = wrapper.current?.querySelectorAll(
      'input:not([type="hidden"]),select,textarea,[role="combobox"]',
    )
    controls?.forEach((control, index) => {
      if (index === 0 && !control.id) control.id = fieldId
      control.setAttribute('aria-invalid', error ? 'true' : 'false')
      if (error) control.setAttribute('aria-describedby', `${fieldId}-error`)
      else if (control.getAttribute('aria-describedby') === `${fieldId}-error`)
        control.removeAttribute('aria-describedby')
    })
  }, [fieldId, error, children])
  return (
    <div ref={wrapper} className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={fieldId}>{label}</Label>
        {hint ? (
          <span className="text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </div>
      {children}
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
