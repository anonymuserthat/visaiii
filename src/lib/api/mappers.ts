import type {
  AvailabilityResponse,
  BookingFailureResponse,
  CapagoCenter,
  FieldValidationError,
  GlobalParams,
  ServiceCategory,
  ServiceItem,
  SocialTitle,
  VisaFileVariation,
  ValidationChecklist,
  VisaTypeItem,
  VisaVariation,
} from '@/lib/api/types'
import { DEFAULT_QUEUE_CONDITIONS } from '@/lib/config'
import {
  ensureArray,
  formatSlotLabel,
  normalizeIsoDayString,
  normalizeText,
  parseBoolean,
  parseNumber,
} from '@/lib/utils'

type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord {
  return typeof value === 'object' && value !== null
    ? (value as UnknownRecord)
    : {}
}

function readString(record: UnknownRecord, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return fallback
}

function readNullableString(record: UnknownRecord, keys: string[]) {
  const value = readString(record, keys)
  return value || null
}

function readNumber(record: UnknownRecord, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = record[key]
    if (value != null) {
      return parseNumber(value, fallback)
    }
  }

  return fallback
}

function readBoolean(record: UnknownRecord, keys: string[], fallback = false) {
  for (const key of keys) {
    const value = record[key]
    if (value != null) {
      return parseBoolean(value, fallback)
    }
  }

  return fallback
}

function readArray(record: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (Array.isArray(value)) {
      return value
    }
  }

  return []
}

const FALLBACK_HTML_ENTITY_MAP: Record<string, string> = {
  amp: '&',
  apos: "'",
  nbsp: ' ',
  quot: '"',
  lt: '<',
  gt: '>',
  agrave: 'a',
  aacute: 'a',
  acirc: 'a',
  auml: 'a',
  egrave: 'e',
  eacute: 'e',
  ecirc: 'e',
  euml: 'e',
  igrave: 'i',
  iacute: 'i',
  icirc: 'i',
  iuml: 'i',
  ograve: 'o',
  oacute: 'o',
  ocirc: 'o',
  ouml: 'o',
  ugrave: 'u',
  uacute: 'u',
  ucirc: 'u',
  uuml: 'u',
  ccedil: 'c',
  rsquo: "'",
  lsquo: "'",
  ldquo: '"',
  rdquo: '"',
  hellip: '...',
}

function decodeHtmlEntities(value: string) {
  if (!value) {
    return ''
  }

  if (typeof document !== 'undefined') {
    const textArea = document.createElement('textarea')
    textArea.innerHTML = value
    return textArea.value
  }

  return value
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .replace(/&#x([\da-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(
      /&([a-z]+);/gi,
      (_, entity) => FALLBACK_HTML_ENTITY_MAP[entity.toLowerCase()] ?? ' ',
    )
}

function toPlainText(value: string) {
  const withoutMarkup = value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')

  return normalizeText(
    decodeHtmlEntities(withoutMarkup)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' '),
  )
}

function readPlainString(record: UnknownRecord, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) {
      const normalized = toPlainText(value)
      return normalized || fallback
    }
  }

  return fallback
}

function readNullablePlainString(record: UnknownRecord, keys: string[]) {
  const value = readPlainString(record, keys)
  return value || null
}

function deduceServiceCategory(record: UnknownRecord): ServiceCategory {
  const serviceCode = readString(record, [
    'service_code',
    'service_reference',
    'code',
  ]).toUpperCase()
  const serviceLabel = readString(record, [
    'service_label',
    'service_name',
    'label',
    'name',
  ])
  const fingerprint = `${serviceCode} ${serviceLabel}`.toLowerCase()

  if (
    serviceCode === 'SF-DEFAULT' ||
    serviceCode === 'SF-FREE' ||
    fingerprint.includes('service fee')
  ) {
    return 'service_fee'
  }

  if (serviceCode === 'PACK-PTA' || fingerprint.includes('prime time')) {
    return 'prime_time'
  }

  if (
    serviceCode === 'PACK-AFV' ||
    fingerprint.includes('france-visa') ||
    fingerprint.includes('france visa')
  ) {
    return 'france_visas'
  }

  if (fingerprint.includes('portrait') || fingerprint.includes('photo')) {
    return 'portrait'
  }

  if (
    fingerprint.includes('relation') ||
    fingerprint.includes('assurance') ||
    fingerprint.includes('insurance')
  ) {
    return 'insurance'
  }

  if (
    fingerprint.includes('delivery') ||
    fingerprint.includes('livraison') ||
    fingerprint.includes('courier')
  ) {
    return 'delivery'
  }

  if (fingerprint.includes('sms')) {
    return 'sms'
  }

  if (fingerprint.includes('printing') || fingerprint.includes('print')) {
    return 'printing'
  }

  if (fingerprint.includes('biometric') || fingerprint.includes('biometr')) {
    return 'biometrics'
  }

  if (fingerprint.includes('invoice') || fingerprint.includes('facture')) {
    return 'invoice'
  }

  if (
    serviceCode === 'PACK-PR-LNG' ||
    serviceCode === 'PACK-PR-LNG-FREE' ||
    fingerprint.includes('premium') ||
    fingerprint.includes('lounge')
  ) {
    return 'premium'
  }

  return 'misc'
}

function mapCenter(raw: unknown): CapagoCenter {
  const record = asRecord(raw)
  const id = readString(record, [
    'capago_center_id',
    'id',
    'area',
    'code',
  ])
  const label = readPlainString(
    record,
    [
      'label',
      'name',
      'title',
      'capago_center_name',
      'capago_center_city',
    ],
    id,
  )
  const city = readPlainString(
    record,
    ['city', 'center_city', 'label', 'capago_center_city'],
    id,
  )
  const premiumHeadline = readNullablePlainString(record, [
    'premium_headline',
    'premium_title',
    'capago_center_selection_tip_html',
  ])
  const premiumDescription = readNullablePlainString(record, [
    'premium_description',
    'premium_copy',
    'capago_center_vip_formula_html',
    'capago_center_bio_exemption_html',
  ])

  const repeatedTitleFragments = new Set(
    [city, label]
      .map((value) => value?.toLowerCase().trim())
      .filter(Boolean) as string[],
  )
  const repeatedDescriptionFragments = new Set(
    [city, label, premiumHeadline]
      .map((value) => value?.toLowerCase().trim())
      .filter(Boolean) as string[],
  )

  return {
    id,
    code: id,
    label,
    city,
    country: readPlainString(record, ['country', 'center_country'], 'Algerie'),
    imageUrl: readNullableString(record, [
      'image_url',
      'image',
      'hero_image',
      'capago_center_vip_image_url',
      'capago_center_std_image_url',
    ]),
    premiumHeadline:
      premiumHeadline &&
      repeatedTitleFragments.has(premiumHeadline.toLowerCase().trim())
        ? null
        : premiumHeadline,
    premiumDescription:
      premiumDescription &&
      repeatedDescriptionFragments.has(premiumDescription.toLowerCase().trim())
        ? null
        : premiumDescription,
  }
}

export function mapGlobalParams(raw: unknown): GlobalParams {
  const record = asRecord(raw)
  const centers = readArray(record, [
    'capago_center_list',
    'center_list',
    'centers',
  ]).map(mapCenter)

  const phoneNumberFormat = readString(record, [
    'phone_number_format',
    'phone_format',
  ])

  return {
    sessionId: readString(record, ['session_id', 'sessionId']),
    currencyCode: readString(record, ['currency_code', 'currency'], 'EUR'),
    termsAndConditionsUrl: readString(record, [
      'terms_and_conditions_url',
      'cgv_url',
      'terms_url',
    ]),
    maxTravellersPerGroup: readNumber(record, [
      'max_travellers_per_group',
      'maxTravellerPerGroup',
    ], 6),
    phoneNumberFormat,
    phoneNumberRegex: phoneNumberFormat || '^(0|\\+213)[0-9]{9}$',
    premiumIncludesHomeDelivery: readBoolean(record, [
      'premium_includes_home_delivery',
    ]),
    premiumIncludesPhoto: readBoolean(record, ['premium_includes_photo']),
    premiumIncludesSms: readBoolean(record, ['premium_includes_sms']),
    centers,
  }
}

export function mapSocialTitles(raw: unknown): SocialTitle[] {
  const rows = Array.isArray(raw)
    ? raw
    : readArray(asRecord(raw), [
        'social_title_category_list',
        'social_title_list',
        'titles',
      ])

  return rows.map((entry) => {
    const record = asRecord(entry)
    return {
      id: readString(record, ['id', 'social_title_id', 'value']),
      label: readString(record, ['label', 'name', 'title']),
      shortLabel: readNullableString(record, ['short_label', 'short']),
    }
  })
}

export function mapVisaFileVariations(raw: unknown): VisaFileVariation[] {
  const rows = Array.isArray(raw)
    ? raw
    : readArray(asRecord(raw), [
        'visa_file_variation_category_list',
        'visa_file_variation_list',
      ])

  return rows.map((entry) => {
    const record = asRecord(entry)
    return {
      id: readString(record, ['id', 'visa_file_variation_id', 'value']),
      label: readString(record, ['label', 'name', 'title']),
      description: readNullableString(record, ['description', 'subtitle']),
    }
  })
}

export function mapServices(raw: unknown, currencyCode: string): ServiceItem[] {
  const rows = Array.isArray(raw)
    ? raw
    : readArray(asRecord(raw), [
        'service_item_list',
        'applicable_service_list',
        'service_list',
      ])

  return rows.map((entry) => {
    const record = asRecord(entry)
    const formulas = ensureArray(
      record.formulas as string[] | string | undefined,
    ).filter((formula): formula is 'standard' | 'premium' =>
      formula === 'standard' || formula === 'premium',
    )

    return {
      id: readString(record, [
        'service_id',
        'id',
        'service_code',
        'service_reference',
        'code',
      ]),
      code: readString(record, [
        'service_code',
        'service_reference',
        'code',
        'service_id',
      ]),
      name: readString(record, [
        'service_label',
        'service_name',
        'label',
        'name',
      ]),
      description: readNullableString(record, ['description', 'subtitle']),
      price: readNumber(record, [
        'price',
        'unit_price',
        'amount',
        'service_price',
      ]),
      currencyCode: readString(
        record,
        ['currency_code', 'currency'],
        currencyCode,
      ),
      category: deduceServiceCategory(record),
      isMandatory: readBoolean(record, ['mandatory', 'is_mandatory']),
      isIncludedInPremium: readBoolean(record, [
        'included_in_premium',
        'is_included_in_premium',
      ]),
      formulas:
        formulas.length > 0
          ? formulas
          : readBoolean(record, ['premium_only'])
            ? ['premium']
            : ['standard', 'premium'],
      travellerScoped: readBoolean(record, [
        'traveller_scoped',
        'per_traveller',
      ], true),
    }
  })
}

function mapValidationChecklist(raw: unknown): ValidationChecklist {
  const record = asRecord(raw)
  return {
    id: readString(record, ['id', 'validation_checklist_id', 'value']),
    label: readString(record, [
      'label',
      'name',
      'title',
      'validation_checklist_name',
    ]),
    description: readNullableString(record, ['description', 'subtitle']),
  }
}

function mapVisaVariation(raw: unknown): VisaVariation {
  const record = asRecord(raw)
  return {
    id: readString(record, ['id', 'visa_variation_id', 'value']),
    label: readString(record, [
      'label',
      'name',
      'title',
      'visa_variation_name',
    ]),
    validationChecklistList: readArray(record, [
      'validation_checklist_list',
      'checklist_list',
    ]).map(mapValidationChecklist),
  }
}

export function mapVisaTypes(raw: unknown): VisaTypeItem[] {
  const rootRecord = asRecord(raw)
  const rows = Array.isArray(raw)
    ? raw
    : readArray(rootRecord, [
        'visa_type_list',
        'applicable_visa_type_list',
        'items',
      ])

  const productLineLookup = new Map<string, string>()
  const stayDurationOrderLookup = new Map<string, number>()
  const productLineOrderLookup = new Map<string, number>()
  readArray(rootRecord, ['product_line_list']).forEach((entry) => {
    const record = asRecord(entry)
    const stayDurationId = readString(record, ['product_line_id'])
    if (stayDurationId && !stayDurationOrderLookup.has(stayDurationId)) {
      stayDurationOrderLookup.set(stayDurationId, stayDurationOrderLookup.size)
    }
    readArray(record, ['product_line_list']).forEach((child) => {
      const childRecord = asRecord(child)
      const childId = readString(childRecord, ['product_line_id'])
      const childLabel = readString(childRecord, [
        'product_line',
        'label',
        'name',
      ])

      if (stayDurationId && childId && childLabel) {
        productLineLookup.set(`${stayDurationId}:${childId}`, childLabel)
        if (!productLineOrderLookup.has(`${stayDurationId}:${childId}`)) {
          productLineOrderLookup.set(
            `${stayDurationId}:${childId}`,
            productLineOrderLookup.size,
          )
        }
      }
    })
  })

  return rows.map((entry) => {
    const record = asRecord(entry)
    const visaStayDurationId = readString(record, [
      'visa_stay_duration_id',
      'stay_duration_id',
    ])
    const productLineId = readString(record, [
      'product_line_id',
      'travel_purpose_id',
      'visa_type_id',
    ])

    return {
      id: readString(record, [
        'resource_id',
        'id',
        'visa_type_id',
        'value',
      ]),
      label: readString(record, [
        'visa_type',
        'label',
        'visa_type_label',
        'name',
      ]),
      visaStayDurationId,
      visaStayDurationLabel: readString(record, [
        'visa_stay_duration',
        'visa_stay_duration_label',
        'stay_duration_label',
      ]),
      productLineId,
      productLineLabel:
        readString(record, [
          'product_line_label',
          'travel_purpose_label',
          'product_line',
        ]) || productLineLookup.get(`${visaStayDurationId}:${productLineId}`) || productLineId,
      travelProjectRelativeUrl: readString(record, [
        'travel_project_relative_url',
        'relative_url',
      ]),
      visaStayDurationOrder: stayDurationOrderLookup.get(visaStayDurationId),
      productLineOrder: productLineOrderLookup.get(
        `${visaStayDurationId}:${productLineId}`,
      ),
      legacyRenewalSupported: readBoolean(record, [
        'legacy_renewal_supported',
        'renewal_supported',
      ], true),
      visaVariationList: readArray(record, [
        'visa_variation_list',
        'variation_list',
      ]).map(mapVisaVariation),
      visaFileVariationRequired: readBoolean(record, [
        'visa_file_variation_required',
        'requires_visa_file_variation',
      ], true),
    }
  })
}

export function mapAvailability(raw: unknown): AvailabilityResponse {
  const record = asRecord(raw)
  const queueConditionList = readArray(record, [
    'queue_condition_list',
    'queue_conditions',
  ])
    .map((item) => normalizeText(item))
    .filter(Boolean)

  return {
    chooseAppointmentDate: readBoolean(record, [
      'choose_appointment_date',
      'chooseAppointmentDate',
    ], true),
    firstAvailableDay: normalizeIsoDayString(
      readString(record, ['first_available_day', 'firstAvailableDay']),
    ) || null,
    firstDay: normalizeIsoDayString(
      readString(record, ['first_day', 'firstDay']),
    ) || null,
    lastDay: normalizeIsoDayString(
      readString(record, ['last_day', 'lastDay']),
    ) || null,
    expectedWeekCountBeforeAppointment:
      readString(record, [
        'expected_week_count_before_appointment',
        'expectedWeekCountBeforeAppointment',
      ]) || null,
    availableDayList: readArray(record, [
      'available_day_list',
      'available_days',
    ])
      .map((value) => normalizeIsoDayString(normalizeText(value)))
      .filter(Boolean),
    unavailableDayList: readArray(record, [
      'unavailable_day_list',
      'disabled_days',
    ])
      .map((value) => normalizeIsoDayString(normalizeText(value)))
      .filter(Boolean),
    queueConditionList:
      queueConditionList.length > 0
        ? queueConditionList
        : DEFAULT_QUEUE_CONDITIONS,
  }
}

export function mapAvailableSlots(raw: unknown) {
  const rows = Array.isArray(raw)
    ? raw
    : readArray(asRecord(raw), ['slot_list', 'available_slot_list', 'slots'])

  return rows
    .map((entry) => {
      if (typeof entry === 'string') {
        return {
          value: entry,
          rawValue: entry,
          label: formatSlotLabel(entry),
        }
      }

      const record = asRecord(entry)
      const rawValue = readString(record, ['value', 'slot', 'datetime', 'iso'])
      const explicitLabel = readString(record, ['label'])
      const fallbackLabel = formatSlotLabel(rawValue)
      const labelLooksLikeTimestamp =
        explicitLabel === rawValue ||
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(explicitLabel)

      return {
        value: rawValue,
        rawValue,
        label:
          explicitLabel && !labelLooksLikeTimestamp
            ? explicitLabel
            : fallbackLabel,
      }
    })
    .filter((slot) => slot.value)
}

export function mapSubmissionErrors(raw: unknown): BookingFailureResponse {
  const record = asRecord(raw)
  const fieldErrors = readArray(record, [
    'form_validation_error_list',
    'validation_error_list',
    'field_errors',
  ]).map((entry) => {
    const fieldRecord = asRecord(entry)
    return {
      field: readString(fieldRecord, [
        'field_name',
        'field',
        'name',
      ]),
      message: readPlainString(fieldRecord, [
        'field_validation_error_description',
        'field_validation_error_message',
        'message',
        'error_message',
        'description',
        'label',
      ]),
    } satisfies FieldValidationError
  })

  const explicitMessages = [
    ...fieldErrors.map((error) => error.message).filter(Boolean),
    ...readArray(record, ['message_list', 'errors']).map((value) =>
      normalizeText(value),
    ),
    readPlainString(record, ['message', 'error', 'description']),
  ].filter(Boolean)

  const rawBodyMessage =
    explicitMessages.length === 0 ? normalizeText(record.raw_body) : ''
  const dedupedMessages = Array.from(
    new Set(
      rawBodyMessage ? [...explicitMessages, rawBodyMessage] : explicitMessages,
    ),
  )
  const status = readNumber(record, ['status'], 422)

  return {
    status,
    fieldErrors,
    rawMessages:
      dedupedMessages.length > 0
        ? dedupedMessages
        : [`Capago a rejete la requete (HTTP ${status}) sans fournir de details.`],
  }
}
