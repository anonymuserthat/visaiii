import { Check, MapPin } from 'lucide-react'
import type { CapagoCenter } from '@/lib/api/types'
export function CenterCard({
  center,
  selected,
  onSelect,
}: {
  center: CapagoCenter
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`center-option ${selected ? 'is-selected' : ''}`}
    >
      <MapPin size={18} aria-hidden="true" />
      <span className="center-description">
        <strong>{center.city}</strong>
        <span>
          {center.label} · {center.country}
        </span>
      </span>
      <span className="center-check" aria-hidden="true">
        {selected ? <Check size={14} /> : null}
      </span>
    </button>
  )
}
