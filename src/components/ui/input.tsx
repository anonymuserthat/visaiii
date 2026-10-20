import * as React from 'react'

import { useFieldContext } from '@/components/ui/field-context'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    const field = useFieldContext()
    return (
      <input
        {...props}
        id={props.id ?? field?.id}
        aria-describedby={
          [field?.descriptionId, props['aria-describedby']]
            .filter(Boolean)
            .join(' ') || undefined
        }
        aria-invalid={props['aria-invalid'] ?? (field?.invalid || undefined)}
        type={type}
        className={cn(
          'flex h-11 w-full rounded-lg border border-input bg-white px-3 py-2 text-[13px] text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
