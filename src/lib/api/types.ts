export type Locale = 'fr' | 'en'
export type Formula = 'standard' | 'premium'
export type StepId = 1 | 2 | 3 | 4

export type ServiceCategory =
  | 'service_fee'
  | 'portrait'
  | 'insurance'
  | 'delivery'
  | 'sms'
  | 'invoice'
  | 'premium'
  | 'prime_time'
  | 'france_visas'
  | 'printing'
  | 'biometrics'
  | 'misc'

export interface CapagoCenter {
  id: string
  code: string
  label: string
  city: string
  country: string
  imageUrl: string | null
  premiumHeadline: string | null
  premiumDescription: string | null
}

export interface GlobalParams {
  sessionId: string
  currencyCode: string
  termsAndConditionsUrl: string
  maxTravellersPerGroup: number
  phoneNumberFormat: string
  phoneNumberRegex: string
  premiumIncludesHomeDelivery: boolean
  premiumIncludesPhoto: boolean
  premiumIncludesSms: boolean
  centers: CapagoCenter[]
}

export interface ServiceItem {
  id: string
  code: string
  name: string
  description: string | null
  price: number
  currencyCode: string
  category: ServiceCategory
  isMandatory: boolean
  isIncludedInPremium: boolean
  formulas: Formula[]
  travellerScoped: boolean
}

export interface SocialTitle {
  id: string
  label: string
  shortLabel: string | null
}

export interface VisaFileVariation {
  id: string
  label: string
  description: string | null
}

export interface ValidationChecklist {
  id: string
  label: string
  description: string | null
}

export interface VisaVariation {
  id: string
  label: string
  validationChecklistList: ValidationChecklist[]
}

export interface ProductLine {
  id: string
  label: string
  visaStayDurationId: string
  visaStayDurationLabel: string
  travelProjectRelativeUrl: string
  order?: number
}

export interface VisaTypeItem {
  id: string
  label: string
  visaStayDurationId: string
  visaStayDurationLabel: string
  productLineId: string
  productLineLabel: string
  travelProjectRelativeUrl: string
  visaStayDurationOrder?: number
  productLineOrder?: number
  legacyRenewalSupported: boolean
  visaVariationList: VisaVariation[]
  visaFileVariationRequired: boolean
}

export interface TravellerForm {
  id: string
  title: string
  lastname: string
  firstname: string
  dayBirth: string
  monthBirth: string
  yearBirth: string
  phone: string
  email: string
  emailConfirm: string
  passportNumber: string
  dayDepartureDate: string
  monthDepartureDate: string
  yearDepartureDate: string
  visaStayDuration: string
  travelPurpose: string
  typeVisa: string
  precision1: string
  precision2: string
  visaFileVariation: string
  renewal: boolean
  followSms: boolean
  franceVisasAssistance: boolean
}

export interface DeliveryContact {
  title: string
  lastname: string
  firstname: string
  address: string
  zip: string
  city: string
}

export interface InvoiceContact {
  society: string
  tva: string
  address: string
  zip: string
  city: string
}

export interface OptionalServicesForm {
  portrait: '' | 'yes_portrait' | 'no_portrait'
  relation: '' | 'yes_relation' | 'no_relation'
  deliveryVisa: '' | 'home_delivery' | 'me_delivery'
  deliveryContact: DeliveryContact
  followSms: boolean
  smsMobile: string
  invoiceEmail: boolean
  invoiceContact: InvoiceContact
  primeTimeAppointment: boolean
}

export interface AppointmentSlot {
  value: string
  label: string
  rawValue: string
}

export interface AvailabilityResponse {
  chooseAppointmentDate: boolean
  availableDayList: string[]
  unavailableDayList: string[]
  queueConditionList: string[]
  firstAvailableDay: string | null
  firstDay: string | null
  lastDay: string | null
  expectedWeekCountBeforeAppointment: string | null
}

export interface AppointmentForm {
  date: string
  dateSubmit: string
  time: string
  captchaToken: string
  chooseAppointmentDate: boolean
  queueConditions: Record<string, boolean>
  availableSlots: AppointmentSlot[]
  unavailableDayList: string[]
}

export interface BookingFormValues {
  nbTravellers: number
  cgv: boolean
  area: string
  formula: Formula | ''
  travellers: TravellerForm[]
  optionalServices: OptionalServicesForm
  appointment: AppointmentForm
}

export interface StoredBookingDraft {
  version: number
  updatedAt: string
  values: BookingFormValues
}

export interface CurrentUserProfile {
  name: string
  email: string
}

export interface BookingPayload {
  fields: Record<string, string>
  encoded: string
}

export interface CalendarVisaFile {
  resource_id: string
  variation_id: string
  visa_file_variation: string | null
}

export interface FieldValidationError {
  field: string
  message: string
}

export interface BookingSuccessResponse {
  status: number
  location: string | null
}

export interface BookingFailureResponse {
  status: number
  fieldErrors: FieldValidationError[]
  rawMessages: string[]
}

export type RequestDatabaseSyncStatus =
  | 'local_only'
  | 'database_synced'
  | 'database_failed'

export interface StoredRequestRecord {
  id: string
  submittedAt: string
  submitterName: string
  submitterEmail: string
  centerId: string
  centerLabel: string
  formula: Formula | ''
  travellerCount: number
  primaryTravellerName: string
  primaryTravellerEmail: string
  primaryTravellerPhone: string
  appointmentDate: string | null
  appointmentTime: string | null
  statusCode: number
  confirmationLocation: string | null
  encodedPayload: string
  bookingSnapshot: BookingFormValues
  dismissedReminderAt: string | null
  databaseSyncStatus: RequestDatabaseSyncStatus
  databaseSyncMessage: string | null
}

export interface RequestStatisticPoint {
  label: string
  count: number
}

export interface RequestStatistics {
  totalCount: number
  todayCount: number
  monthCount: number
  yearCount: number
  expiredCount: number
  pendingReminderCount: number
  byCenter: RequestStatisticPoint[]
  byFormula: RequestStatisticPoint[]
  monthlyTrend: RequestStatisticPoint[]
}

export interface UnavailableDayParams {
  capagoCenterId: string
  formula: Formula
  visaFileList: string
  travelProjectRelativeUrl?: string
}

export interface SlotParams {
  capagoCenterId: string
  formula: Formula
  day: string
}

export interface AppBootstrapData {
  globalParams: GlobalParams
  socialTitles: SocialTitle[]
  visaFileVariations: VisaFileVariation[]
  services: ServiceItem[]
  visaTypes: VisaTypeItem[]
}

/** Status of the shared database; no connection secrets are returned to the UI. */
export interface DatabaseStatus {
  configured: boolean
  connected: boolean
  remoteCount: number | null
  localCount: number
  pendingCount: number
  message: string
}
