import * as React from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'

import { useFieldContext } from '@/components/ui/field-context'
import { cn } from '@/lib/utils'

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  const field = useFieldContext()
  return (
    <RadioGroupPrimitive.Root
      {...props}
      id={props.id ?? field?.id}
      aria-labelledby={props['aria-labelledby'] ?? field?.labelId}
      aria-describedby={
        [field?.descriptionId, props['aria-describedby']]
          .filter(Boolean)
          .join(' ') || undefined
      }
      aria-invalid={props['aria-invalid'] ?? (field?.invalid || undefined)}
      className={cn('grid gap-3', className)}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    {...props}
    ref={ref}
    className={cn(
      'aspect-square h-5 w-5 rounded-full border border-border bg-white text-primary shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
  >
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <span className="h-2.5 w-2.5 rounded-full bg-primary" />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
))
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
