import type { StateCreator } from 'zustand'

import type {
  AppointmentForm,
  AvailabilityResponse,
  BookingFailureResponse,
  BookingFormValues,
  BookingSuccessResponse,
  CapagoCenter,
  GlobalParams,
  Locale,
  OptionalServicesForm,
  ServiceItem,
  SocialTitle,
  StepId,
  TravellerForm,
  VisaFileVariation,
  VisaTypeItem,
} from '@/lib/api/types'
import type { RuntimeConfig } from '@/lib/config'

export interface AppConfigSlice {
  locale: Locale
  runtimeConfig: RuntimeConfig
  globalParams: GlobalParams | null
  socialTitles: SocialTitle[]
  visaFileVariations: VisaFileVariation[]
  services: ServiceItem[]
  visaTypes: VisaTypeItem[]
  selectedCenterId: string
  centers: CapagoCenter[]
  isBootstrapped: boolean
  setLocale: (locale: Locale) => void
  setRuntimeConfig: (config: RuntimeConfig) => void
  hydrateBootstrap: (payload: {
    globalParams: GlobalParams
    socialTitles: SocialTitle[]
    visaFileVariations: VisaFileVariation[]
    services: ServiceItem[]
    visaTypes: VisaTypeItem[]
  }) => void
  setSelectedCenterId: (centerId: string) => void
  setServices: (services: ServiceItem[]) => void
  setVisaTypes: (visaTypes: VisaTypeItem[]) => void
}

export interface BookingWizardSlice {
  currentStep: StepId
  completedSteps: StepId[]
  draft: BookingFormValues
  setCurrentStep: (step: StepId) => void
  markStepCompleted: (step: StepId) => void
  updateSetup: (
    setup: Partial<
      Pick<BookingFormValues, 'area' | 'cgv' | 'formula' | 'nbTravellers'>
    >,
  ) => void
  hydrateDraft: (draft: BookingFormValues) => void
  resetDraft: () => void
}

export interface TravellersSlice {
  setTravellers: (travellers: TravellerForm[]) => void
  updateTraveller: (index: number, traveller: Partial<TravellerForm>) => void
}

export interface OptionalServicesSlice {
  setOptionalServices: (optionalServices: OptionalServicesForm) => void
  updateOptionalServices: (
    optionalServices: Partial<OptionalServicesForm>,
  ) => void
}

export interface AppointmentSlice {
  availability: AvailabilityResponse | null
  setAvailability: (availability: AvailabilityResponse) => void
  setAppointment: (appointment: AppointmentForm) => void
  updateAppointment: (appointment: Partial<AppointmentForm>) => void
}

export interface SubmissionSlice {
  submissionStatus: 'idle' | 'submitting' | 'success' | 'error'
  lastSuccess: BookingSuccessResponse | null
  lastFailure: BookingFailureResponse | null
  rawServerErrors: string[]
  auditTrail: Array<{ action: string; timestamp: string; detail: string }>
  setSubmissionStatus: (status: SubmissionSlice['submissionStatus']) => void
  setSubmissionSuccess: (payload: BookingSuccessResponse) => void
  setSubmissionFailure: (payload: BookingFailureResponse) => void
  clearSubmission: () => void
  appendAudit: (action: string, detail: string) => void
}

export type BookingStore = AppConfigSlice &
  BookingWizardSlice &
  TravellersSlice &
  OptionalServicesSlice &
  AppointmentSlice &
  SubmissionSlice

export type SliceCreator<T> = StateCreator<BookingStore, [], [], T>
