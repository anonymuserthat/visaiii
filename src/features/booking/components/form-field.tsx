import type { ReactNode } from 'react'

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
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
