import { type ClassValue, clsx } from 'clsx'
import { format } from 'date-fns'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function ensureArray<T>(value: T | T[] | undefined | null): T[] {
  if (Array.isArray(value)) {
    return value
  }

  return value == null ? [] : [value]
}

export function parseBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value === 1
  }

  if (typeof value === 'string') {
    return ['1', 'true', 'on', 'yes', 'oui'].includes(value.toLowerCase())
  }

  return fallback
}

export function parseNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

export function normalizeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

export function formatCurrency(amount: number, currencyCode: string, locale = 'fr-FR') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode || 'EUR',
    maximumFractionDigits: 2,
  }).format(amount)
}

const SLOT_TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'UTC',
})

const ISO_WITH_EXPLICIT_TIMEZONE_PATTERN = /(?:[zZ]|[+-]\d{2}:\d{2})$/

export function formatSlotLabel(isoValue: string) {
  const directParse = new Date(isoValue)
  const parsed =
    Number.isNaN(directParse.getTime()) &&
    !ISO_WITH_EXPLICIT_TIMEZONE_PATTERN.test(isoValue)
      ? new Date(`${isoValue}Z`)
      : directParse

  if (Number.isNaN(parsed.getTime())) {
    return isoValue
  }

  return SLOT_TIME_FORMATTER.format(parsed)
}

export const QUEUE_LOADING_LABEL = 'Chargement...'

function parseIsoDayParts(value: string) {
  const normalized = normalizeIsoDayString(value)
  const [yearRaw, monthRaw, dayRaw] = normalized.split('-')
  const year = Number.parseInt(yearRaw ?? '', 10)
  const month = Number.parseInt(monthRaw ?? '', 10)
  const day = Number.parseInt(dayRaw ?? '', 10)

  if (!year || !month || !day) {
    return null
  }

  return { year, month, day }
}

export function formatAppointmentDateLabel(
  isoDay: string,
  locale: 'fr' | 'en' = 'fr',
) {
  const parts = parseIsoDayParts(isoDay)
  if (!parts) {
    return isoDay
  }

  const months =
    locale === 'en'
      ? [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ]
      : [
          'Janvier',
          'Fevrier',
          'Mars',
          'Avril',
          'Mai',
          'Juin',
          'Juillet',
          'Aout',
          'Septembre',
          'Octobre',
          'Novembre',
          'Decembre',
        ]

  return `${String(parts.day).padStart(2, '0')} ${
    months[parts.month - 1] ?? isoDay
  } ${parts.year}`
}

export function toIsoDay(value: Date) {
  return format(value, 'yyyy-MM-dd')
}

export function normalizeIsoDayString(value: string) {
  if (/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) {
    return value.slice(0, 10)
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10)
  }

  const year = parsed.getUTCFullYear()
  const month = `${parsed.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${parsed.getUTCDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function toAvailabilityDayParam(value: string) {
  return value.includes('T') ? value : `${value}T00:00:00Z`
}

export function todayPlusDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return toIsoDay(date)
}

export function createTravellerId(index: number) {
  return `traveller_${index + 1}`
}

export function createConditionKey(label: string) {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function compactObject<T extends Record<string, string>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== ''),
  ) as T
}

export function isTauriEnvironment() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}
