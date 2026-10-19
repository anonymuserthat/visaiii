import {
  addDays,
  addMonths,
  endOfMonth,
  endOfDay,
  format,
  getDay,
  isAfter,
  isBefore,
  startOfDay,
  startOfMonth,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn, toIsoDay } from '@/lib/utils'

interface CalendarGridProps {
  availableDays?: string[]
  unavailableDays: string[]
  selectedDay: string
  firstAvailableDay?: string | null
  minDay?: string | null
  maxDay?: string | null
  onSelect: (day: string) => void
}

function buildMonthDays(anchor: Date) {
  const monthStart = startOfMonth(anchor)
  const monthEnd = endOfMonth(anchor)
  const days: Array<Date | null> = []
  const leadingEmptyCells = (getDay(monthStart) + 6) % 7
  let cursor = monthStart

  for (let index = 0; index < leadingEmptyCells; index += 1) {
    days.push(null)
  }

  while (cursor <= monthEnd) {
    days.push(cursor)
    cursor = addDays(cursor, 1)
  }

  while (days.length % 7 !== 0) {
    days.push(null)
  }

  return days
}

function formatMonthLabel(value: Date) {
  const label = format(value, 'MMMM yyyy', { locale: fr })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function CalendarGrid({
  availableDays = [],
  unavailableDays,
  selectedDay,
  firstAvailableDay,
  minDay,
  maxDay,
  onSelect,
}: CalendarGridProps) {
  const anchorDay = selectedDay || firstAvailableDay || minDay
  const [cursor, setCursor] = useState(() => {
    return anchorDay ? new Date(`${anchorDay}T00:00:00`) : new Date()
  })
  const today = startOfDay(new Date())
  const days = buildMonthDays(cursor)
  const availableDaySet = useMemo(() => new Set(availableDays), [availableDays])
  const unavailableDaySet = useMemo(
    () => new Set(unavailableDays),
    [unavailableDays],
  )
  const hasAvailabilityData =
    availableDaySet.size > 0 ||
    unavailableDaySet.size > 0 ||
    Boolean(firstAvailableDay) ||
    Boolean(minDay) ||
    Boolean(maxDay)
  const minDate = minDay ? startOfDay(new Date(`${minDay}T00:00:00`)) : today
  const maxDate = maxDay ? endOfDay(new Date(`${maxDay}T00:00:00`)) : null
  const canGoPreviousMonth = !isBefore(
    endOfMonth(addMonths(cursor, -1)),
    minDate,
  )
  const canGoNextMonth = maxDate
    ? !isAfter(startOfMonth(addMonths(cursor, 1)), maxDate)
    : true

  useEffect(() => {
    if (!anchorDay) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      setCursor(new Date(`${anchorDay}T00:00:00`))
    })

    return () => window.cancelAnimationFrame(frame)
  }, [anchorDay])

  return (
    <div className="rounded-3xl border border-border/80 bg-slate-50/85 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <span className="text-xl font-semibold text-foreground">
            {formatMonthLabel(cursor)}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            disabled={!canGoPreviousMonth}
            onClick={() => setCursor((value) => addMonths(value, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            disabled={!canGoNextMonth}
            onClick={() => setCursor((value) => addMonths(value, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} />
          }

          const iso = toIsoDay(day)
          const outsideRange =
            isBefore(day, minDate) || (maxDate ? isAfter(day, maxDate) : false)
          const disabledByAvailability =
            !hasAvailabilityData
              ? true
              : unavailableDaySet.size > 0
                ? unavailableDaySet.has(iso)
                : availableDaySet.size > 0
                  ? !availableDaySet.has(iso)
                  : true
          const disabled =
            outsideRange || disabledByAvailability
          const selected = selectedDay === iso

          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(iso)}
              className={cn(
                'h-11 rounded-xl border border-transparent px-2 text-sm transition-colors',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-white text-foreground hover:border-border hover:bg-slate-100',
                disabled &&
                  'cursor-not-allowed border-transparent bg-slate-100 text-slate-400 line-through hover:bg-slate-100',
              )}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
