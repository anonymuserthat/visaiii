import { Check, MapPin } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CapagoCenter } from '@/lib/api/types'

interface CenterCardProps {
  center: CapagoCenter
  selected: boolean
  onSelect: () => void
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength).trimEnd()}...`
}

export function CenterCard({ center, selected, onSelect }: CenterCardProps) {
  const badgeLabel = center.code.replace(/^capago_/i, '').replace(/_/g, ' ').toUpperCase()
  const premiumDescription = center.premiumDescription
    ? truncateText(center.premiumDescription, 180)
    : null

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Choisir ${center.city}`}
      className={cn(
        'group relative overflow-hidden rounded-xl border px-3 py-3 text-left transition-colors',
        selected
          ? 'border-primary/25 bg-primary/5'
          : 'border-border/80 bg-white hover:border-primary/20',
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <Badge variant={selected ? 'default' : 'outline'}>{badgeLabel}</Badge>
          <p className="mt-2 font-display text-xl font-semibold text-foreground">
            {center.city}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{center.label}</p>
        </div>
        <div
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]',
            selected
              ? 'bg-primary text-primary-foreground'
              : 'bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary',
          )}
        >
          {selected ? <Check className="h-3.5 w-3.5" /> : null}
          {selected ? 'Selectionne' : 'Choisir'}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>{center.country}</span>
      </div>
      {center.premiumHeadline || premiumDescription ? (
        <div className="mt-3 rounded-lg border border-border/60 bg-slate-50 px-3 py-2.5 text-sm text-foreground">
          {center.premiumHeadline ? (
            <p className="font-semibold">{center.premiumHeadline}</p>
          ) : null}
          {premiumDescription ? (
            <p className={cn('text-muted-foreground', center.premiumHeadline ? 'mt-1' : '')}>
              {premiumDescription}
            </p>
          ) : null}
        </div>
      ) : null}
    </button>
  )
}
