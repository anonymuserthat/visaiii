import { invoke } from '@tauri-apps/api/core'

import {
  mapAvailability,
  mapAvailableSlots,
  mapGlobalParams,
  mapServices,
  mapSocialTitles,
  mapSubmissionErrors,
  mapVisaFileVariations,
  mapVisaTypes,
} from '@/lib/api/mappers'
import {
  parseAvailableSlotsResponse,
  parseGlobalParamsResponse,
  parseServiceListResponse,
  parseSocialTitlesResponse,
  parseSubmissionFailure,
  parseUnavailableDaysResponse,
  parseVisaFileVariationsResponse,
  parseVisaTypesResponse,
} from '@/lib/api/parsers'
import type {
  AvailabilityResponse,
  BookingFailureResponse,
  BookingPayload,
  BookingSuccessResponse,
  CurrentUserProfile,
  DatabaseStatus,
  GlobalParams,
  SlotParams,
  SocialTitle,
  StoredBookingDraft,
  StoredRequestRecord,
  UnavailableDayParams,
  VisaFileVariation,
  VisaTypeItem,
  ServiceItem,
} from '@/lib/api/types'
import { RUNTIME_CONFIG } from '@/lib/config'
import {
  normalizeSubmitterEmail,
  normalizeSubmitterName,
} from '@/lib/request-records'
import { isTauriEnvironment, toAvailabilityDayParam } from '@/lib/utils'

interface BackendGetArgs {
  baseUrl: string
  frontendUrl: string
  path: string
  query: Record<string, string>
}

interface BackendSubmitArgs {
  baseUrl: string
  frontendUrl: string
  path: string
  body: string
}

interface BackendSubmitResult {
  status: number
  location: string | null
  jsonBody: unknown | null
  rawBody: string
}

function asObjectRecord(value: unknown) {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null
}

const REQUEST_RECORDS_STORAGE_KEY = 'damander-visa-request-records'
const CURRENT_USER_STORAGE_KEY = 'damander-visa-current-user'

function normalizeCurrentUserProfile(
  value: Partial<CurrentUserProfile> | null | undefined,
): CurrentUserProfile | null {
  const name = normalizeSubmitterName(value?.name)
  const email = normalizeSubmitterEmail(value?.email)

  if (!name || !email) {
    return null
  }

  return { name, email }
}

function normalizeRequestRecord(record: StoredRequestRecord): StoredRequestRecord {
  return {
    ...record,
    submitterName: normalizeSubmitterName(record.submitterName),
    submitterEmail: normalizeSubmitterEmail(record.submitterEmail),
  }
}

function readLocalRequestRecords() {
  const raw = localStorage.getItem(REQUEST_RECORDS_STORAGE_KEY)
  return raw ? (JSON.parse(raw) as StoredRequestRecord[]).map(normalizeRequestRecord) : []
}

function writeLocalRequestRecords(records: StoredRequestRecord[]) {
  localStorage.setItem(REQUEST_RECORDS_STORAGE_KEY, JSON.stringify(records))
}

function upsertRequestRecord(records: StoredRequestRecord[], nextRecord: StoredRequestRecord) {
  return [nextRecord, ...records.filter((record) => record.id !== nextRecord.id)].sort(
    (left, right) => right.submittedAt.localeCompare(left.submittedAt),
  )
}

async function fetchFixture<T>(fixtureName: string): Promise<T> {
  const response = await fetch(`/fixtures/${fixtureName}`)
  if (!response.ok) {
    throw new Error(`Fixture introuvable: ${fixtureName}`)
  }

  return (await response.json()) as T
}

async function backendGet(path: string, query: Record<string, string>) {
  if (RUNTIME_CONFIG.mockMode) {
    return null
  }

  if (!isTauriEnvironment()) {
    throw new Error(
      'Le mode reseau reel requiert une execution Tauri pour gerer la session et les cookies.',
    )
  }

  return invoke<unknown>('fetch_booking_json', {
    payload: {
      baseUrl: RUNTIME_CONFIG.bookingBaseUrl,
      frontendUrl: RUNTIME_CONFIG.bookingFrontendUrl,
      path,
      query,
    } satisfies BackendGetArgs,
  })
}

async function backendSubmit(path: string, body: string) {
  if (RUNTIME_CONFIG.mockMode) {
    return {
      status: 201,
      location: `${RUNTIME_CONFIG.bookingBaseUrl}/success/mock-reference`,
      jsonBody: null,
      rawBody: '',
    } satisfies BackendSubmitResult
  }

  if (!isTauriEnvironment()) {
    throw new Error(
      'La soumission reelle requiert une execution Tauri pour gerer la session et les cookies.',
    )
  }

  return invoke<BackendSubmitResult>('submit_booking_form', {
    payload: {
      baseUrl: RUNTIME_CONFIG.bookingBaseUrl,
      frontendUrl: RUNTIME_CONFIG.bookingFrontendUrl,
      path,
      body,
    } satisfies BackendSubmitArgs,
  })
}

async function resolveGlobalParamsRaw() {
  if (RUNTIME_CONFIG.mockMode) {
    return fetchFixture<unknown>('global-params.json')
  }

  return backendGet('/WebSite_getCapagoBookingSiteGlobalParameter', {})
}

async function resolveSocialTitlesRaw() {
  if (RUNTIME_CONFIG.mockMode) {
    return fetchFixture<unknown>('social-titles.json')
  }

  return backendGet('/WebSite_getSocialTitleCategoryList', {})
}

async function resolveVisaFileVariationsRaw() {
  if (RUNTIME_CONFIG.mockMode) {
    return fetchFixture<unknown>('visa-file-variations.json')
  }

  return backendGet('/WebSite_getVisaFileVariationCategoryList', {})
}

async function resolveServicesRaw(centerId: string) {
  if (RUNTIME_CONFIG.mockMode) {
    return fetchFixture<unknown>(`services-${centerId}.json`)
  }

  return backendGet('/WebSite_getApplicableServiceList', {
    capago_center_id: centerId,
  })
}

async function resolveVisaTypesRaw(centerId: string) {
  if (RUNTIME_CONFIG.mockMode) {
    return fetchFixture<unknown>(`visa-types-${centerId}.json`)
  }

  return backendGet('/WebSite_getApplicableVisaTypeList', {
    capago_center_id: centerId,
  })
}

async function resolveUnavailableDaysRaw(params: UnavailableDayParams) {
  if (RUNTIME_CONFIG.mockMode) {
    const fixtureName =
      params.capagoCenterId === 'capago_CZL' && params.formula === 'premium'
        ? 'unavailable-capago_CZL-queue.json'
        : `unavailable-${params.capagoCenterId}-${params.formula}.json`

    try {
      return await fetchFixture<unknown>(fixtureName)
    } catch {
      return fetchFixture<unknown>(`unavailable-${params.capagoCenterId}.json`)
    }
  }

  const query: Record<string, string> = {
    capago_center_id: params.capagoCenterId,
    formula: params.formula,
    visa_file_list: params.visaFileList,
  }

  if (params.travelProjectRelativeUrl) {
    query.travel_project_relative_url = params.travelProjectRelativeUrl
  }

  return backendGet('/WebSite_getUnavailableDayList', query)
}

async function resolveSlotsRaw(params: SlotParams) {
  if (RUNTIME_CONFIG.mockMode) {
    try {
      return await fetchFixture<unknown>(
        `slots-${params.capagoCenterId}-${params.day}.json`,
      )
    } catch {
      return fetchFixture<unknown>(`slots-${params.capagoCenterId}.json`)
    }
  }

  return backendGet('/WebSite_getAvailableAppointmentSlotList', {
    capago_center_id: params.capagoCenterId,
    formula: params.formula,
    day: toAvailabilityDayParam(params.day),
  })
}

export const bookingClient = {
  async getGlobalParams(): Promise<GlobalParams> {
    const raw = parseGlobalParamsResponse(await resolveGlobalParamsRaw())
    return mapGlobalParams(raw)
  },

  async getSocialTitles(): Promise<SocialTitle[]> {
    const raw = parseSocialTitlesResponse(await resolveSocialTitlesRaw())
    return mapSocialTitles(raw)
  },

  async getVisaFileVariations(): Promise<VisaFileVariation[]> {
    const raw = parseVisaFileVariationsResponse(
      await resolveVisaFileVariationsRaw(),
    )
    return mapVisaFileVariations(raw)
  },

  async getApplicableServiceList(
    centerId: string,
    currencyCode: string,
  ): Promise<ServiceItem[]> {
    const raw = parseServiceListResponse(await resolveServicesRaw(centerId))
    return mapServices(raw, currencyCode)
  },

  async getApplicableVisaTypeList(centerId: string): Promise<VisaTypeItem[]> {
    const raw = parseVisaTypesResponse(await resolveVisaTypesRaw(centerId))
    return mapVisaTypes(raw)
  },

  async getUnavailableDayList(
    params: UnavailableDayParams,
  ): Promise<AvailabilityResponse> {
    const raw = parseUnavailableDaysResponse(
      await resolveUnavailableDaysRaw(params),
    )
    return mapAvailability(raw)
  },

  async getAvailableAppointmentSlotList(params: SlotParams) {
    const raw = parseAvailableSlotsResponse(await resolveSlotsRaw(params))
    return mapAvailableSlots(raw)
  },

  async submitBooking(payload: BookingPayload): Promise<
    BookingSuccessResponse | BookingFailureResponse
  > {
    const result = await backendSubmit('/WebSite_createNewAppointment', payload.encoded)

    if (result.status === 201) {
      return {
        status: result.status,
        location: result.location,
      }
    }

    const parsedRawBody = (() => {
      const raw = result.rawBody.trim()
      if (!raw.startsWith('{')) {
        return null
      }

      try {
        return asObjectRecord(JSON.parse(raw))
      } catch {
        return null
      }
    })()

    const failurePayload = parseSubmissionFailure({
      ...(asObjectRecord(result.jsonBody) ?? parsedRawBody ?? {}),
      status: result.status,
      raw_body: result.rawBody,
    })

    return mapSubmissionErrors(failurePayload)
  },

  async saveDraft(draft: StoredBookingDraft) {
    if (!isTauriEnvironment()) {
      localStorage.setItem('damander-visa-draft-file', JSON.stringify(draft))
      return
    }

    await invoke('save_draft', { draft })
  },

  async loadDraft() {
    if (!isTauriEnvironment()) {
      const raw = localStorage.getItem('damander-visa-draft-file')
      return raw ? (JSON.parse(raw) as StoredBookingDraft) : null
    }

    return invoke<StoredBookingDraft | null>('load_draft')
  },

  async saveCurrentUserProfile(profile: CurrentUserProfile) {
    const normalized = normalizeCurrentUserProfile(profile)
    if (!normalized) {
      throw new Error("Nom et email de l'utilisateur requis.")
    }

    if (!isTauriEnvironment()) {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(normalized))
      return
    }

    await invoke('save_current_user_profile', { profile: normalized })
  },

  async loadCurrentUserProfile() {
    if (!isTauriEnvironment()) {
      const raw = localStorage.getItem(CURRENT_USER_STORAGE_KEY)
      return raw
        ? normalizeCurrentUserProfile(JSON.parse(raw) as CurrentUserProfile)
        : null
    }

    const profile = await invoke<CurrentUserProfile | null>('load_current_user_profile')
    return normalizeCurrentUserProfile(profile)
  },

  async appendAuditEntry(action: string, detail: string) {
    if (!isTauriEnvironment()) {
      return
    }

    await invoke('append_audit_entry', { action, detail })
  },

  async saveRequestRecord(record: StoredRequestRecord) {
    if (!isTauriEnvironment()) {
      const nextRecords = upsertRequestRecord(readLocalRequestRecords(), record)
      writeLocalRequestRecords(nextRecords)
      return normalizeRequestRecord(record)
    }

    return normalizeRequestRecord(
      await invoke<StoredRequestRecord>('save_request_record', { record }),
    )
  },

  async listRequestRecords() {
    if (!isTauriEnvironment()) {
      return readLocalRequestRecords()
    }

    return (await invoke<StoredRequestRecord[]>('list_request_records')).map(
      normalizeRequestRecord,
    )
  },

  async getDatabaseStatus(): Promise<DatabaseStatus | null> {
    if (!isTauriEnvironment()) return null
    return invoke<DatabaseStatus>('get_database_status')
  },

  async configureDatabase(url: string): Promise<DatabaseStatus> {
    if (!isTauriEnvironment()) throw new Error('Configuration reservee a la version desktop.')
    return invoke<DatabaseStatus>('configure_database', { url })
  },

  async clearDatabaseConfiguration(): Promise<DatabaseStatus> {
    if (!isTauriEnvironment()) throw new Error('Configuration reservee a la version desktop.')
    return invoke<DatabaseStatus>('clear_database_configuration')
  },

  async dismissRequestReminder(recordId: string) {
    const dismissedAt = new Date().toISOString()

    if (!isTauriEnvironment()) {
      const nextRecords = readLocalRequestRecords().map((record) =>
        record.id === recordId ? { ...record, dismissedReminderAt: dismissedAt } : record,
      )
      writeLocalRequestRecords(nextRecords)
      return
    }

    await invoke('dismiss_request_reminder', {
      recordId,
      dismissedAt,
    })
  },
}
