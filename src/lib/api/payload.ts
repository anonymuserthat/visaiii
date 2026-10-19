import type {
  BookingFormValues,
  BookingPayload,
  FieldValidationError,
  ServiceItem,
  TravellerForm,
  VisaTypeItem,
} from '@/lib/api/types'

function serializeCheckbox(value: boolean) {
  return value ? 'on' : 'off'
}

const QUEUE_SUBMISSION_DATE_PLACEHOLDER = 'Chargement...'

interface PackageSelection {
  quantity: number
  service: string
}

function normalizeDatePart(value: string, padLength: number) {
  const trimmed = value.trim()
  if (!trimmed || !/^\d+$/.test(trimmed)) {
    return trimmed
  }

  return trimmed.padStart(padLength, '0')
}

function serializeTraveller(traveller: TravellerForm, index: number) {
  const suffix = `_traveller_${index + 1}`

  return {
    [`title${suffix}`]: traveller.title,
    [`lastname${suffix}`]: traveller.lastname,
    [`firstname${suffix}`]: traveller.firstname,
    [`day_birth${suffix}`]: normalizeDatePart(traveller.dayBirth, 2),
    [`month_birth${suffix}`]: normalizeDatePart(traveller.monthBirth, 2),
    [`year_birth${suffix}`]: normalizeDatePart(traveller.yearBirth, 4),
    [`phone${suffix}`]: traveller.phone,
    [`email${suffix}`]: traveller.email,
    [`email_confirm${suffix}`]: traveller.emailConfirm,
    [`number_passport${suffix}`]: traveller.passportNumber,
    [`day_departure_date${suffix}`]: normalizeDatePart(
      traveller.dayDepartureDate,
      2,
    ),
    [`month_departure_date${suffix}`]: normalizeDatePart(
      traveller.monthDepartureDate,
      2,
    ),
    [`year_departure_date${suffix}`]: normalizeDatePart(
      traveller.yearDepartureDate,
      4,
    ),
    [`visa_stay_duration${suffix}`]: traveller.visaStayDuration,
    [`travel_purpose${suffix}`]: traveller.travelPurpose,
    [`type_visa${suffix}`]: traveller.typeVisa,
    [`precision1${suffix}`]: traveller.precision1,
    [`precision2${suffix}`]: traveller.precision2,
    [`visa_file_variation${suffix}`]:
      traveller.visaFileVariation || 'primo_demand',
    [`renewal${suffix}`]: serializeCheckbox(traveller.renewal),
    [`follow_sms${suffix}`]: traveller.followSms ? 'on' : '',
  }
}

function findServiceCode(
  services: ServiceItem[],
  category: ServiceItem['category'],
  preferredCodes: string[],
) {
  const preferredCode = preferredCodes.find((code) =>
    services.some((service) => service.code === code),
  )

  if (preferredCode) {
    return preferredCode
  }

  return (
    services.find((service) => service.category === category)?.code ??
    preferredCodes[0]
  )
}

function buildTopLevelPackageList(
  values: BookingFormValues,
  services: ServiceItem[],
): PackageSelection[] {
  const packages: PackageSelection[] = []

  if (values.optionalServices.primeTimeAppointment) {
    packages.push({
      quantity: Math.max(1, values.nbTravellers),
      service: findServiceCode(services, 'prime_time', ['PACK-PTA']),
    })
  }

  if (values.optionalServices.deliveryVisa === 'home_delivery') {
    packages.push({
      quantity: Math.max(1, values.nbTravellers),
      service: findServiceCode(services, 'delivery', [
        'PACK-DEL-DZ',
        'PACK-DEL',
      ]),
    })
  }

  return packages
}

function buildTravellerPackageList(
  values: BookingFormValues,
  traveller: TravellerForm,
  services: ServiceItem[],
): PackageSelection[] {
  const packages: PackageSelection[] = []

  if (traveller.franceVisasAssistance) {
    packages.push({
      quantity: 1,
      service: findServiceCode(services, 'france_visas', ['PACK-AFV']),
    })
  }

  if (values.optionalServices.portrait === 'yes_portrait') {
    packages.push({
      quantity: 1,
      service: findServiceCode(services, 'portrait', ['PACK-ID-PHOTO']),
    })
  }

  return packages
}

export function buildVisaFileList(values: BookingFormValues) {
  return JSON.stringify(
    values.travellers
      .filter((traveller) => traveller.typeVisa && traveller.precision1)
      .map((traveller) => ({
        resource_id: traveller.typeVisa,
        variation_id: traveller.precision1,
        visa_file_variation:
          traveller.visaFileVariation ||
          (traveller.renewal ? 'renewal' : 'primo_demand'),
      })),
  )
}

export function findTravelProjectRelativeUrl(
  values: BookingFormValues,
  visaTypes: VisaTypeItem[],
) {
  const primaryTraveller = values.travellers[0]
  if (!primaryTraveller) {
    return ''
  }

  const selectedType = visaTypes.find(
    (visaType) =>
      visaType.id === primaryTraveller.typeVisa &&
      visaType.productLineId === primaryTraveller.travelPurpose &&
      visaType.visaStayDurationId === primaryTraveller.visaStayDuration,
  )

  return selectedType?.travelProjectRelativeUrl ?? ''
}

export function buildBookingPayload(
  values: BookingFormValues,
  sessionId = '',
  services: ServiceItem[] = [],
): BookingPayload {
  const queueMode = !values.appointment.chooseAppointmentDate
  const appointmentDate = queueMode
    ? QUEUE_SUBMISSION_DATE_PLACEHOLDER
    : values.appointment.date
  const appointmentDateSubmit = queueMode ? '' : values.appointment.dateSubmit

  const fields: Record<string, string> = {
    session_id: sessionId,
    nb_travellers: String(values.nbTravellers),
    cgv: values.cgv ? 'on' : '',
    area: values.area,
    formula: values.formula,
    portrait: values.optionalServices.portrait,
    relation: values.optionalServices.relation,
    delivery_visa: values.optionalServices.deliveryVisa,
    title_delivery_contact: values.optionalServices.deliveryContact.title,
    lastname_delivery_contact:
      values.optionalServices.deliveryContact.lastname,
    firstname_delivery_contact:
      values.optionalServices.deliveryContact.firstname,
    address_delivery_contact:
      values.optionalServices.deliveryContact.address,
    zip_delivery_contact: values.optionalServices.deliveryContact.zip,
    city_delivery_contact: values.optionalServices.deliveryContact.city,
    follow_sms: values.optionalServices.followSms ? 'follow_sms' : '',
    sms_mobile: values.optionalServices.smsMobile,
    invoice_email: values.optionalServices.invoiceEmail ? 'on' : '',
    society_invoice_contact: values.optionalServices.invoiceContact.society,
    tva_invoice_contact: values.optionalServices.invoiceContact.tva,
    address_invoice_contact: values.optionalServices.invoiceContact.address,
    zip_invoice_contact: values.optionalServices.invoiceContact.zip,
    city_invoice_contact: values.optionalServices.invoiceContact.city,
    date: appointmentDate,
    date_submit: appointmentDateSubmit,
    time: queueMode ? '' : values.appointment.time,
    'g-recaptcha-response': values.appointment.captchaToken,
    captcha: values.appointment.captchaToken,
  }

  fields.follow_sms = values.optionalServices.followSms ? 'follow_sms' : 'off'

  const topLevelPackageList = buildTopLevelPackageList(values, services)
  if (topLevelPackageList.length > 0) {
    fields.tp_package_list = JSON.stringify(topLevelPackageList)
  }

  const travellerFields = Object.assign(
    {},
    ...values.travellers.map(serializeTraveller),
  ) as Record<string, string>

  for (const [key, value] of Object.entries(travellerFields)) {
    fields[key] = value
  }

  values.travellers.forEach((traveller, index) => {
    const packageList = buildTravellerPackageList(values, traveller, services)
    if (packageList.length > 0) {
      fields[`vf_package_list_traveller_${index + 1}`] =
        JSON.stringify(packageList)
    }
  })

  const encoded = new URLSearchParams(
    Object.entries(fields).filter(([, value]) => value !== ''),
  ).toString()

  return {
    fields,
    encoded,
  }
}

export function mapServerFieldNameToPath(fieldName: string) {
  if (fieldName === 'g-recaptcha-response') {
    return 'appointment.captchaToken'
  }

  if (fieldName === 'captcha') {
    return 'appointment.captchaToken'
  }

  if (fieldName === 'date') {
    return 'appointment.date'
  }

  if (fieldName === 'time') {
    return 'appointment.time'
  }

  if (fieldName === 'nb_travellers') {
    return 'nbTravellers'
  }

  if (fieldName === 'cgv') {
    return 'cgv'
  }

  if (fieldName === 'area') {
    return 'area'
  }

  if (fieldName === 'formula') {
    return 'formula'
  }

  const travellerMatch = fieldName.match(/^(.*)_traveller_(\d+)$/)
  if (travellerMatch) {
    const [, base, indexRaw] = travellerMatch
    const index = Number.parseInt(indexRaw, 10) - 1
    const fieldMap: Record<string, keyof TravellerForm> = {
      title: 'title',
      lastname: 'lastname',
      firstname: 'firstname',
      day_birth: 'dayBirth',
      month_birth: 'monthBirth',
      year_birth: 'yearBirth',
      phone: 'phone',
      email: 'email',
      email_confirm: 'emailConfirm',
      number_passport: 'passportNumber',
      day_departure_date: 'dayDepartureDate',
      month_departure_date: 'monthDepartureDate',
      year_departure_date: 'yearDepartureDate',
      visa_stay_duration: 'visaStayDuration',
      travel_purpose: 'travelPurpose',
      type_visa: 'typeVisa',
      precision1: 'precision1',
      precision2: 'precision2',
      visa_file_variation: 'visaFileVariation',
      renewal: 'renewal',
      follow_sms: 'followSms',
      vf_package_list: 'franceVisasAssistance',
    }

    const mapped = fieldMap[base]
    return mapped ? `travellers.${index}.${mapped}` : fieldName
  }

  const optionalFieldMap: Record<string, string> = {
    portrait: 'optionalServices.portrait',
    relation: 'optionalServices.relation',
    delivery_visa: 'optionalServices.deliveryVisa',
    title_delivery_contact: 'optionalServices.deliveryContact.title',
    lastname_delivery_contact: 'optionalServices.deliveryContact.lastname',
    firstname_delivery_contact: 'optionalServices.deliveryContact.firstname',
    address_delivery_contact: 'optionalServices.deliveryContact.address',
    zip_delivery_contact: 'optionalServices.deliveryContact.zip',
    city_delivery_contact: 'optionalServices.deliveryContact.city',
    follow_sms: 'optionalServices.followSms',
    sms_mobile: 'optionalServices.smsMobile',
    invoice_email: 'optionalServices.invoiceEmail',
    society_invoice_contact: 'optionalServices.invoiceContact.society',
    tva_invoice_contact: 'optionalServices.invoiceContact.tva',
    address_invoice_contact: 'optionalServices.invoiceContact.address',
    zip_invoice_contact: 'optionalServices.invoiceContact.zip',
    city_invoice_contact: 'optionalServices.invoiceContact.city',
    tp_package_list: 'optionalServices.primeTimeAppointment',
  }

  return optionalFieldMap[fieldName] ?? fieldName
}

export function groupFieldErrorsByPath(errors: FieldValidationError[]) {
  return errors.map((error) => ({
    ...error,
    field: mapServerFieldNameToPath(error.field),
  }))
}
