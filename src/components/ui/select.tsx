import type * as React from 'react'
import { ChevronDown } from 'lucide-react'

import { useFieldContext } from '@/components/ui/field-context'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<React.ComponentProps<'select'>, 'children'> {
  options: SelectOption[]
  placeholder?: string
}

export function Select({
  className,
  options,
  placeholder,
  value,
  ...props
}: SelectProps) {
  const field = useFieldContext()
  return (
    <div className="relative">
      <select
        {...props}
        id={props.id ?? field?.id}
        aria-describedby={
          [field?.descriptionId, props['aria-describedby']]
            .filter(Boolean)
            .join(' ') || undefined
        }
        aria-invalid={props['aria-invalid'] ?? (field?.invalid || undefined)}
        className={cn(
          'flex h-11 w-full appearance-none rounded-lg border border-input bg-white px-3 py-2 pr-9 text-[13px] text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        value={value}
      >
        <option value="">{placeholder ?? 'Selectionner'}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" />
    </div>
  )
}
