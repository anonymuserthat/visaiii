import type {
  AppointmentForm,
  BookingFormValues,
  DeliveryContact,
  Formula,
  InvoiceContact,
  OptionalServicesForm,
  TravellerForm,
} from '@/lib/api/types'
import { DEFAULT_QUEUE_CONDITIONS } from '@/lib/config'
import { createConditionKey, createTravellerId } from '@/lib/utils'

type DepartureDateFields = Pick<
  TravellerForm,
  'dayDepartureDate' | 'monthDepartureDate' | 'yearDepartureDate'
>

type LegacyTravellerForm = Partial<TravellerForm>
type LegacyOptionalServicesForm = Partial<
  Omit<OptionalServicesForm, 'deliveryContact' | 'invoiceContact'>
> & {
  deliveryContact?: Partial<DeliveryContact>
  invoiceContact?: Partial<InvoiceContact>
}

export function createDefaultDepartureDateParts(
  baseDate = new Date(),
): DepartureDateFields {
  const nextMonthIndex = baseDate.getMonth() + 1
  const year = baseDate.getFullYear() + Math.floor(nextMonthIndex / 12)
  const monthIndex = nextMonthIndex % 12
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate()
  const day = Math.min(baseDate.getDate(), lastDayOfMonth)

  return {
    dayDepartureDate: String(day).padStart(2, '0'),
    monthDepartureDate: String(monthIndex + 1).padStart(2, '0'),
    yearDepartureDate: String(year),
  }
}

export function applyDefaultDepartureDates(
  values: BookingFormValues,
  baseDate = new Date(),
) {
  const fallbackDepartureDate = createDefaultDepartureDateParts(baseDate)
  let hasChanges = false

  const travellers = values.travellers.map((traveller) => {
    if (
      traveller.dayDepartureDate ||
      traveller.monthDepartureDate ||
      traveller.yearDepartureDate
    ) {
      return traveller
    }

    hasChanges = true
    return {
      ...traveller,
      ...fallbackDepartureDate,
    }
  })

  if (!hasChanges) {
    return values
  }

  return {
    ...values,
    travellers,
  }
}

export function applyBookingDraftDefaults(
  values: BookingFormValues,
  baseDate = new Date(),
): BookingFormValues {
  const legacyOptionalServices = values.optionalServices as LegacyOptionalServicesForm
  const normalizedValues = applyDefaultDepartureDates(
    {
      ...values,
      nbTravellers: Math.max(1, Number(values.nbTravellers) || 1),
      travellers: (Array.isArray(values.travellers) ? values.travellers : []).map(
        (traveller, index) => {
          const legacyTraveller = traveller as LegacyTravellerForm

          return {
            ...createEmptyTraveller(index),
            ...legacyTraveller,
            id: legacyTraveller.id || createTravellerId(index),
            franceVisasAssistance: Boolean(
              legacyTraveller.franceVisasAssistance,
            ),
          }
        },
      ),
      optionalServices: {
        portrait: legacyOptionalServices?.portrait ?? 'no_portrait',
        relation: legacyOptionalServices?.relation ?? '',
        deliveryVisa: legacyOptionalServices?.deliveryVisa ?? 'me_delivery',
        deliveryContact: {
          ...createEmptyDeliveryContact(),
          ...(legacyOptionalServices?.deliveryContact ?? {}),
        },
        followSms: Boolean(legacyOptionalServices?.followSms),
        smsMobile: legacyOptionalServices?.smsMobile ?? '',
        invoiceEmail: Boolean(legacyOptionalServices?.invoiceEmail),
        invoiceContact: {
          ...createEmptyInvoiceContact(),
          ...(legacyOptionalServices?.invoiceContact ?? {}),
        },
        primeTimeAppointment: Boolean(
          legacyOptionalServices?.primeTimeAppointment,
        ),
      },
      appointment: {
        ...createEmptyAppointment(),
        ...(values.appointment ?? {}),
      },
    },
    baseDate,
  )

  if (normalizedValues.travellers.length === 0) {
    normalizedValues.travellers = createTravellers(normalizedValues.nbTravellers)
  }

  if (normalizedValues.formula) {
    return normalizedValues
  }

  return {
    ...normalizedValues,
    formula: 'standard' satisfies Formula,
  }
}

export function createEmptyTraveller(index: number): TravellerForm {
  return {
    id: createTravellerId(index),
    title: '',
    lastname: '',
    firstname: '',
    dayBirth: '',
    monthBirth: '',
    yearBirth: '',
    phone: '',
    email: '',
    emailConfirm: '',
    passportNumber: '',
    ...createDefaultDepartureDateParts(),
    visaStayDuration: '',
    travelPurpose: '',
    typeVisa: '',
    precision1: '',
    precision2: '',
    visaFileVariation: '',
    renewal: false,
    followSms: false,
    franceVisasAssistance: false,
  }
}

export function createTravellers(count: number) {
  return Array.from({ length: count }, (_, index) => createEmptyTraveller(index))
}

export function createEmptyDeliveryContact(): DeliveryContact {
  return {
    title: '',
    lastname: '',
    firstname: '',
    address: '',
    zip: '',
    city: '',
  }
}

export function createEmptyInvoiceContact(): InvoiceContact {
  return {
    society: '',
    tva: '',
    address: '',
    zip: '',
    city: '',
  }
}

export function createEmptyAppointment(): AppointmentForm {
  return {
    date: '',
    dateSubmit: '',
    time: '',
    captchaToken: '',
    chooseAppointmentDate: true,
    queueConditions: Object.fromEntries(
      DEFAULT_QUEUE_CONDITIONS.map((condition) => [
        createConditionKey(condition),
        true,
      ]),
    ),
    availableSlots: [],
    unavailableDayList: [],
  }
}

export function createEmptyBookingDraft(): BookingFormValues {
  return {
    nbTravellers: 1,
    cgv: false,
    area: '',
    formula: 'standard',
    travellers: createTravellers(1),
    optionalServices: {
      portrait: 'no_portrait',
      relation: '',
      deliveryVisa: 'me_delivery',
      deliveryContact: createEmptyDeliveryContact(),
      followSms: false,
      smsMobile: '',
      invoiceEmail: false,
      invoiceContact: createEmptyInvoiceContact(),
      primeTimeAppointment: false,
    },
    appointment: createEmptyAppointment(),
  }
}
