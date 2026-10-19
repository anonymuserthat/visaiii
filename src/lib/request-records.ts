import type {
  BookingFormValues,
  BookingPayload,
  BookingSuccessResponse,
  CurrentUserProfile,
  RequestStatisticPoint,
  RequestStatistics,
  StoredRequestRecord,
} from '@/lib/api/types'
import {
  applyBookingDraftDefaults,
  createEmptyAppointment,
} from '@/lib/state/defaults'
import { formatSlotLabel } from '@/lib/utils'

const EXPIRY_WINDOW_DAYS = 30
const MONTHLY_TREND_WINDOW = 6

export function normalizeSubmitterName(value: string | null | undefined) {
  return (value ?? '').trim().replace(/\s+/g, ' ')
}

export function normalizeSubmitterEmail(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase()
}

export function getSubmitterIdentityKey(input: {
  submitterEmail?: string | null
  submitterName?: string | null
  fallbackId?: string
}) {
  const normalizedEmail = normalizeSubmitterEmail(input.submitterEmail)
  if (normalizedEmail) {
    return normalizedEmail
  }

  const normalizedName = normalizeSubmitterName(input.submitterName).toLowerCase()
  return normalizedName || input.fallbackId || ''
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function normalizeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function daysBetween(start: Date, end: Date) {
  const difference = normalizeDate(end).getTime() - normalizeDate(start).getTime()
  return Math.floor(difference / 86_400_000)
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function createRecordId(now = new Date()) {
  const stamp = now
    .toISOString()
    .replaceAll('-', '')
    .replaceAll(':', '')
    .replaceAll('.', '')
    .replaceAll('T', '')
    .replaceAll('Z', '')
    .slice(0, 17)
  const random = Math.random().toString(36).slice(2, 8)
  return `req_${stamp}_${random}`
}

function formatStoredAppointmentTime(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)
    ? formatSlotLabel(value)
    : value
}

function toDate(value: string) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function sortStatisticPoints(points: RequestStatisticPoint[]) {
  return [...points].sort(
    (left, right) => right.count - left.count || left.label.localeCompare(right.label, 'fr'),
  )
}

export function buildStoredRequestRecord(args: {
  values: BookingFormValues
  payload: BookingPayload
  result: BookingSuccessResponse
  centerLabel: string
  submitter: CurrentUserProfile
}): StoredRequestRecord {
  const submittedAt = new Date().toISOString()
  const primaryTraveller = args.values.travellers[0]
  const primaryTravellerName = [primaryTraveller?.firstname, primaryTraveller?.lastname]
    .filter(Boolean)
    .join(' ')
    .trim()
  const selectedAppointmentSlot =
    args.values.appointment.availableSlots.find(
      (slot) => slot.value === args.values.appointment.time,
    ) ??
    args.values.appointment.availableSlots.find(
      (slot) => slot.label === args.values.appointment.time,
    )

  return {
    id: createRecordId(),
    submittedAt,
    submitterName: normalizeSubmitterName(args.submitter.name),
    submitterEmail: normalizeSubmitterEmail(args.submitter.email),
    centerId: args.values.area,
    centerLabel: args.centerLabel,
    formula: args.values.formula,
    travellerCount: args.values.nbTravellers,
    primaryTravellerName: primaryTravellerName || 'Voyageur principal',
    primaryTravellerEmail: primaryTraveller?.email ?? '',
    primaryTravellerPhone: primaryTraveller?.phone ?? '',
    appointmentDate:
      args.values.appointment.chooseAppointmentDate && args.values.appointment.date
        ? args.values.appointment.date
        : null,
    appointmentTime:
      args.values.appointment.chooseAppointmentDate && args.values.appointment.time
        ? selectedAppointmentSlot?.label ??
          formatSlotLabel(args.values.appointment.time)
        : null,
    statusCode: args.result.status,
    confirmationLocation: args.result.location,
    encodedPayload: args.payload.encoded,
    bookingSnapshot: args.values,
    dismissedReminderAt: null,
    databaseSyncStatus: 'local_only',
    databaseSyncMessage: null,
  }
}

export function getRequestPrimaryLabel(record: StoredRequestRecord) {
  return record.primaryTravellerName || 'Voyageur principal'
}

export function getRequestSubmitterLabel(record: StoredRequestRecord) {
  return normalizeSubmitterName(record.submitterName) || 'Utilisateur non renseigne'
}

export function formatRequestAppointmentSummary(record: StoredRequestRecord) {
  const appointmentTime = record.appointmentTime
    ? formatStoredAppointmentTime(record.appointmentTime)
    : null

  return record.appointmentDate
    ? `${record.appointmentDate}${
        appointmentTime ? `, ${appointmentTime}` : ''
      }`
    : "File d'attente ou a recharger"
}

export function formatRequestSubmittedAt(record: StoredRequestRecord) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(toDate(record.submittedAt))
}

export function getRequestAgeInDays(record: StoredRequestRecord, now = new Date()) {
  return daysBetween(toDate(record.submittedAt), now)
}

export function formatRequestAgeLabel(
  record: StoredRequestRecord,
  now = new Date(),
) {
  const ageInDays = getRequestAgeInDays(record, now)

  if (ageInDays <= 0) {
    return "Aujourd'hui"
  }

  if (ageInDays === 1) {
    return 'Hier'
  }

  return `Il y a ${ageInDays} jours`
}

export function isRequestExpired(record: StoredRequestRecord, now = new Date()) {
  return getRequestAgeInDays(record, now) >= EXPIRY_WINDOW_DAYS
}

export function getPendingExpiryReminders(
  records: StoredRequestRecord[],
  now = new Date(),
) {
  return records.filter(
    (record) => isRequestExpired(record, now) && !record.dismissedReminderAt,
  )
}

export function prepareRequestForResubmission(record: StoredRequestRecord) {
  return applyBookingDraftDefaults({
    ...record.bookingSnapshot,
    appointment: createEmptyAppointment(),
  })
}

export function getRequestStatistics(
  records: StoredRequestRecord[],
  now = new Date(),
): RequestStatistics {
  const todayKey = normalizeDate(now).toISOString().slice(0, 10)
  const currentMonthKey = monthKey(now)
  const currentYear = now.getFullYear()

  const byCenter = new Map<string, number>()
  const byFormula = new Map<string, number>()
  const monthBuckets = Array.from({ length: MONTHLY_TREND_WINDOW }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (MONTHLY_TREND_WINDOW - 1 - index), 1)
    return {
      key: monthKey(date),
      label: formatMonthLabel(date),
      count: 0,
    }
  })
  const monthBucketMap = new Map(monthBuckets.map((bucket) => [bucket.key, bucket]))

  let todayCount = 0
  let monthCount = 0
  let yearCount = 0
  let expiredCount = 0
  let pendingReminderCount = 0

  records.forEach((record) => {
    const submittedAt = toDate(record.submittedAt)
    const submittedDayKey = normalizeDate(submittedAt).toISOString().slice(0, 10)
    const submittedMonthKey = monthKey(submittedAt)
    const formulaLabel =
      record.formula === 'premium'
        ? 'Premium'
        : record.formula === 'standard'
          ? 'Standard'
          : 'Non defini'

    if (submittedDayKey === todayKey) {
      todayCount += 1
    }

    if (submittedMonthKey === currentMonthKey) {
      monthCount += 1
    }

    if (submittedAt.getFullYear() === currentYear) {
      yearCount += 1
    }

    if (isRequestExpired(record, now)) {
      expiredCount += 1
      if (!record.dismissedReminderAt) {
        pendingReminderCount += 1
      }
    }

    byCenter.set(record.centerLabel, (byCenter.get(record.centerLabel) ?? 0) + 1)
    byFormula.set(formulaLabel, (byFormula.get(formulaLabel) ?? 0) + 1)

    const bucket = monthBucketMap.get(submittedMonthKey)
    if (bucket) {
      bucket.count += 1
    }
  })

  return {
    totalCount: records.length,
    todayCount,
    monthCount,
    yearCount,
    expiredCount,
    pendingReminderCount,
    byCenter: sortStatisticPoints(
      Array.from(byCenter.entries()).map(([label, count]) => ({ label, count })),
    ),
    byFormula: sortStatisticPoints(
      Array.from(byFormula.entries()).map(([label, count]) => ({ label, count })),
    ),
    monthlyTrend: monthBuckets.map(({ label, count }) => ({ label, count })),
  }
}
