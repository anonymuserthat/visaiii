import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch, type FieldErrors, type Path } from 'react-hook-form'
import { Download, FileUp, LoaderCircle, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { bookingClient } from '@/lib/api/bookingClient'
import { bookingQueryKeys } from '@/lib/api/queryKeys'
import {
  buildBookingPayload,
  buildVisaFileList,
  groupFieldErrorsByPath,
} from '@/lib/api/payload'
import { RUNTIME_CONFIG } from '@/lib/config'
import { Step1Setup } from '@/features/booking/steps/step-1-setup'
import { Step2Travellers } from '@/features/booking/steps/step-2-travellers'
import { Step3Services } from '@/features/booking/steps/step-3-services'
import { Step4Appointment } from '@/features/booking/steps/step-4-appointment'
import {
  canSolveAutomatically,
  getCaptchaSettings,
  solveCaptcha,
  type CaptchaSettings,
} from '@/lib/recaptcha/solver'
import { isTauriEnvironment } from '@/lib/utils'
import { useBookingBootstrap } from '@/features/booking/hooks/use-booking-bootstrap'
import { SummaryPanel } from '@/features/booking/components/summary-panel'
import { Stepper } from '@/features/booking/components/stepper'
import { ServerErrorPanel } from '@/features/booking/components/server-error-panel'
import { SubmissionSuccess } from '@/features/booking/components/submission-success'
import { recordAudit } from '@/lib/audit/logger'
import { openExternalUrl } from '@/lib/persistence/external'
import { exportDraftJson, importDraftJson } from '@/lib/persistence/drafts'
import type { BookingFormValues, CurrentUserProfile } from '@/lib/api/types'
import { buildStoredRequestRecord } from '@/lib/request-records'
import { selectCurrentCenter } from '@/lib/state/selectors'
import {
  listenForRecaptchaToken,
  openEmbeddedRecaptchaWindow,
} from '@/lib/recaptcha/bridge'
import { useBookingStore } from '@/lib/state/store'
import {
  applyBookingDraftDefaults,
  createEmptyAppointment,
  createEmptyBookingDraft,
  createEmptyTraveller,
} from '@/lib/state/defaults'
import { createBookingSchema, getStepFieldPaths } from '@/lib/validation/bookingSchemas'
import {
  useAvailableSlotsQuery,
  useUnavailableDaysQuery,
} from '@/lib/api/hooks'
import {
  createConditionKey,
  normalizeIsoDayString,
  QUEUE_LOADING_LABEL,
} from '@/lib/utils'

function flattenErrorPaths(
  value: unknown,
  prefix = '',
): Path<BookingFormValues>[] {
  if (!value || typeof value !== 'object') {
    return []
  }

  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([key]) => !['message', 'type', 'types', 'ref', 'root'].includes(key),
  )

  const hasLeafMessage =
    typeof (value as { message?: unknown }).message === 'string'

  if (hasLeafMessage && prefix) {
    return [prefix as Path<BookingFormValues>]
  }

  return entries.flatMap(([key, child]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key
    return flattenErrorPaths(child, nextPrefix)
  })
}

function getStepFromErrorPath(path: Path<BookingFormValues>): 1 | 2 | 3 | 4 {
  if (
    path === 'nbTravellers' ||
    path === 'cgv' ||
    path === 'area' ||
    path === 'formula'
  ) {
    return 1
  }

  if (path.startsWith('travellers.')) {
    return 2
  }

  if (path.startsWith('optionalServices.')) {
    return 3
  }

  return 4
}

function getInvalidSubmissionMessage(path: Path<BookingFormValues> | null) {
  if (!path) {
    return 'Certains champs doivent etre corriges avant la soumission.'
  }

  if (path === 'cgv') {
    return 'Acceptez les conditions generales avant de soumettre.'
  }

  if (path === 'appointment.captchaToken') {
    return 'Completez la verification reCAPTCHA avant de soumettre.'
  }

  if (path.startsWith('appointment.queueConditions.')) {
    return 'Acceptez toutes les conditions de file avant de soumettre.'
  }

  if (path.startsWith('appointment.')) {
    return 'Finalisez les informations de rendez-vous avant de soumettre.'
  }

  if (path.startsWith('travellers.')) {
    return 'Certaines informations voyageurs doivent etre corrigees avant la soumission.'
  }

  if (path.startsWith('optionalServices.')) {
    return 'Completez les options requises avant la soumission.'
  }

  return 'Certains champs doivent etre corriges avant la soumission.'
}

function hasDraftContent(values: BookingFormValues) {
  if (values.area || values.formula || values.cgv) {
    return true
  }

  if (
    values.optionalServices.portrait ||
    values.optionalServices.relation ||
    values.optionalServices.deliveryVisa ||
    values.optionalServices.followSms ||
    values.optionalServices.invoiceEmail ||
    values.optionalServices.smsMobile ||
    values.optionalServices.primeTimeAppointment
  ) {
    return true
  }

  if (
    values.appointment.date ||
    values.appointment.dateSubmit ||
    values.appointment.time ||
    values.appointment.captchaToken
  ) {
    return true
  }

  return values.travellers.some((traveller) =>
    [
      traveller.title,
      traveller.lastname,
      traveller.firstname,
      traveller.dayBirth,
      traveller.monthBirth,
      traveller.yearBirth,
      traveller.phone,
      traveller.email,
      traveller.emailConfirm,
      traveller.passportNumber,
      traveller.dayDepartureDate,
      traveller.monthDepartureDate,
      traveller.yearDepartureDate,
      traveller.visaStayDuration,
      traveller.travelPurpose,
      traveller.typeVisa,
      traveller.precision1,
      traveller.precision2,
      traveller.visaFileVariation,
    ].some(Boolean) ||
      traveller.renewal ||
      traveller.followSms ||
      traveller.franceVisasAssistance,
  )
}

function countVisaFileListEntries(visaFileList: string) {
  try {
    const parsed = JSON.parse(visaFileList) as unknown
    return Array.isArray(parsed) ? parsed.length : 0
  } catch {
    return 0
  }
}

function extractQueryMessage(error: unknown, fallback: string) {
  if (!error) {
    return null
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  const message = String(error).trim()
  return message || fallback
}

function isSelectedDayStillAvailable(
  selectedDay: string,
  availability: NonNullable<
    ReturnType<typeof useUnavailableDaysQuery>['data']
  >,
) {
  if (!selectedDay) {
    return true
  }

  const normalizedSelectedDay = normalizeIsoDayString(selectedDay)
  const unavailableDays = new Set(
    availability.unavailableDayList.map(normalizeIsoDayString),
  )

  if (unavailableDays.size > 0 && unavailableDays.has(normalizedSelectedDay)) {
    return false
  }

  if (availability.availableDayList.length > 0) {
    const availableDays = new Set(
      availability.availableDayList.map(normalizeIsoDayString),
    )
    if (!availableDays.has(normalizedSelectedDay)) {
      return false
    }
  }

  if (availability.firstDay && normalizedSelectedDay < normalizeIsoDayString(availability.firstDay)) {
    return false
  }

  if (availability.lastDay && normalizedSelectedDay > normalizeIsoDayString(availability.lastDay)) {
    return false
  }

  return true
}

interface BookingShellProps {
  currentUser?: CurrentUserProfile | null
}

export function BookingShell({
  currentUser = null,
}: BookingShellProps) {
  const queryClient = useQueryClient()
  const {
    globalParamsQuery,
    socialTitlesQuery,
    visaFileVariationsQuery,
    servicesQuery,
    visaTypesQuery,
  } = useBookingBootstrap()
  const currentStep = useBookingStore((state) => state.currentStep)
  const completedSteps = useBookingStore((state) => state.completedSteps)
  const setCurrentStep = useBookingStore((state) => state.setCurrentStep)
  const markStepCompleted = useBookingStore((state) => state.markStepCompleted)
  const hydrateDraft = useBookingStore((state) => state.hydrateDraft)
  const resetDraft = useBookingStore((state) => state.resetDraft)
  const setSelectedCenterId = useBookingStore((state) => state.setSelectedCenterId)
  const selectedCenterId = useBookingStore((state) => state.selectedCenterId)
  const globalParams = useBookingStore((state) => state.globalParams)
  const socialTitles = useBookingStore((state) => state.socialTitles)
  const visaFileVariations = useBookingStore((state) => state.visaFileVariations)
  const services = useBookingStore((state) => state.services)
  const visaTypes = useBookingStore((state) => state.visaTypes)
  const currentCenter = useBookingStore(selectCurrentCenter)
  const setAvailability = useBookingStore((state) => state.setAvailability)
  const setSubmissionFailure = useBookingStore((state) => state.setSubmissionFailure)
  const setSubmissionStatus = useBookingStore((state) => state.setSubmissionStatus)
  const setSubmissionSuccess = useBookingStore((state) => state.setSubmissionSuccess)
  const clearSubmission = useBookingStore((state) => state.clearSubmission)
  const submissionStatus = useBookingStore((state) => state.submissionStatus)
  const lastSuccess = useBookingStore((state) => state.lastSuccess)
  const rawServerErrors = useBookingStore((state) => state.rawServerErrors)
  const draftLoadedRef = useRef(false)
  const formSeedRef = useRef<BookingFormValues>(
    applyBookingDraftDefaults(useBookingStore.getState().draft),
  )
  const previousAreaRef = useRef<string | null>(formSeedRef.current.area || null)
  const lastPersistedDraftRef = useRef(JSON.stringify(formSeedRef.current))
  const latestSessionIdRef = useRef('')
  const [lastSavedAt, setLastSavedAt] = useState<string>('')
  const [verificationOpening, setVerificationOpening] = useState(false)
  const [captchaSettings, setCaptchaSettings] = useState<CaptchaSettings | null>(null)
  const [solvingCaptcha, setSolvingCaptcha] = useState(false)
  const submittingRef = useRef(false)
  const automaticCaptcha = canSolveAutomatically(captchaSettings)

  const form = useForm<BookingFormValues>({
    defaultValues: formSeedRef.current,
    resolver: (values, context, options) =>
      zodResolver(
        createBookingSchema({
          globalParams,
          services,
          formula: values.formula,
          captchaRequired: !automaticCaptcha,
        }),
      )(values, context, options),
    mode: 'onBlur',
    shouldFocusError: true,
  })

  const {
    control,
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
    reset,
    setError,
    setValue,
    trigger,
  } = form

  const liveValues =
    (useWatch({ control }) as BookingFormValues | undefined) ?? formSeedRef.current
  const visibleServices = services.filter((service) =>
    liveValues.formula ? service.formulas.includes(liveValues.formula) : true,
  )
  const visaFileList = buildVisaFileList(liveValues)
  const travellersReadyForAvailability =
    liveValues.travellers.length > 0 &&
    countVisaFileListEntries(visaFileList) === liveValues.travellers.length
  const canLoadAvailability =
    currentStep >= 2 &&
    Boolean(liveValues.area) &&
    Boolean(liveValues.formula) &&
    travellersReadyForAvailability &&
    !servicesQuery.isFetching &&
    !visaTypesQuery.isFetching

  const availabilityQuery = useUnavailableDaysQuery(
    liveValues.area || selectedCenterId,
    liveValues.formula,
    visaFileList,
    canLoadAvailability,
  )

  const slotsQuery = useAvailableSlotsQuery(
    liveValues.area || selectedCenterId,
    liveValues.formula,
    liveValues.appointment.dateSubmit,
    currentStep >= 4 &&
      liveValues.appointment.chooseAppointmentDate &&
      Boolean(liveValues.appointment.dateSubmit),
  )

  const bootstrapError = [
    globalParamsQuery.error,
    socialTitlesQuery.error,
    visaFileVariationsQuery.error,
    servicesQuery.error,
    visaTypesQuery.error,
  ]
    .filter(Boolean)
    .map((error) => (error instanceof Error ? error.message : String(error)))
  const availabilityErrorMessage = extractQueryMessage(
    availabilityQuery.error,
    'Impossible de charger les disponibilites Capago.',
  )
  const slotsErrorMessage = extractQueryMessage(
    slotsQuery.error,
    'Impossible de charger les horaires pour cette date.',
  )

  useEffect(() => {
    latestSessionIdRef.current = globalParams?.sessionId ?? ''
  }, [globalParams?.sessionId])

  useEffect(() => {
    if (!isTauriEnvironment()) {
      return
    }
    void getCaptchaSettings()
      .then(setCaptchaSettings)
      .catch((error) => {
        console.error(error)
      })
  }, [])

  useEffect(() => {
    if (!draftLoadedRef.current) {
      draftLoadedRef.current = true

      if (hasDraftContent(formSeedRef.current)) {
        return
      }

      void bookingClient
        .loadDraft()
        .then((storedDraft) => {
          if (!storedDraft || storedDraft.version !== RUNTIME_CONFIG.draftVersion) {
            return
          }

          const normalizedDraft = applyBookingDraftDefaults(storedDraft.values)

          formSeedRef.current = normalizedDraft
          previousAreaRef.current = normalizedDraft.area || null
          lastPersistedDraftRef.current = JSON.stringify(storedDraft.values)
          hydrateDraft(normalizedDraft)
          reset(normalizedDraft)
          toast.success('Brouillon restaure')
        })
        .catch((error) => {
          console.error(error)
        })
    }
  }, [hydrateDraft, reset])

  useEffect(() => {
    let isDisposed = false
    let cleanup: (() => void) | null = null

    void listenForRecaptchaToken(({ token }) => {
      setValue('appointment.captchaToken', token, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
      setVerificationOpening(false)
      toast.success("Jeton reCAPTCHA recupere dans l'app.")
    }).then((unlisten) => {
      if (isDisposed) {
        unlisten?.()
        return
      }

      cleanup = unlisten
    })

    return () => {
      isDisposed = true
      cleanup?.()
    }
  }, [setValue])

  useEffect(() => {
    if (selectedCenterId && !liveValues.area) {
      setValue('area', selectedCenterId, { shouldDirty: false })
    }
  }, [liveValues.area, selectedCenterId, setValue])

  useEffect(() => {
    const expectedTravellerCount = Math.max(1, Number(liveValues.nbTravellers) || 1)
    const currentTravellerCount = liveValues.travellers.length

    if (currentTravellerCount === expectedTravellerCount) {
      return
    }

    const nextTravellers =
      currentTravellerCount < expectedTravellerCount
        ? [
            ...liveValues.travellers,
            ...Array.from(
              { length: expectedTravellerCount - currentTravellerCount },
              (_, offset) => createEmptyTraveller(currentTravellerCount + offset),
            ),
          ]
        : liveValues.travellers.slice(0, expectedTravellerCount)

    setValue('travellers', nextTravellers, {
      shouldDirty: true,
      shouldValidate: currentStep >= 2,
    })
    setValue('appointment', createEmptyAppointment(), { shouldDirty: true })
    clearSubmission()
  }, [
    clearSubmission,
    currentStep,
    liveValues.nbTravellers,
    liveValues.travellers,
    setValue,
  ])

  useEffect(() => {
    if (liveValues.area && liveValues.area !== selectedCenterId) {
      setSelectedCenterId(liveValues.area)
    }
  }, [liveValues.area, selectedCenterId, setSelectedCenterId])

  useEffect(() => {
    if (!liveValues.area) {
      previousAreaRef.current = null
      return
    }

    if (!previousAreaRef.current) {
      previousAreaRef.current = liveValues.area
      return
    }

    if (previousAreaRef.current === liveValues.area) {
      return
    }

    liveValues.travellers.forEach((traveller, index) => {
      if (traveller.visaStayDuration) {
        setValue(`travellers.${index}.visaStayDuration`, '', { shouldDirty: true })
      }
      if (traveller.travelPurpose) {
        setValue(`travellers.${index}.travelPurpose`, '', { shouldDirty: true })
      }
      if (traveller.typeVisa) {
        setValue(`travellers.${index}.typeVisa`, '', { shouldDirty: true })
      }
      if (traveller.precision1) {
        setValue(`travellers.${index}.precision1`, '', { shouldDirty: true })
      }
      if (traveller.precision2) {
        setValue(`travellers.${index}.precision2`, '', { shouldDirty: true })
      }
      if (traveller.visaFileVariation) {
        setValue(`travellers.${index}.visaFileVariation`, '', {
          shouldDirty: true,
        })
      }
      if (traveller.renewal) {
        setValue(`travellers.${index}.renewal`, false, { shouldDirty: true })
      }
    })

    setValue('appointment', createEmptyAppointment(), { shouldDirty: true })
    clearSubmission()
    previousAreaRef.current = liveValues.area
  }, [clearSubmission, liveValues.area, liveValues.travellers, setValue])

  useEffect(() => {
    const primaryTraveller = liveValues.travellers[0]
    if (!primaryTraveller) {
      return
    }

    if (!liveValues.optionalServices.portrait) {
      setValue('optionalServices.portrait', 'no_portrait', { shouldDirty: false })
    }

    if (!liveValues.optionalServices.deliveryVisa) {
      setValue('optionalServices.deliveryVisa', 'me_delivery', {
        shouldDirty: false,
      })
    }

    if (
      liveValues.optionalServices.deliveryVisa === 'home_delivery' &&
      !liveValues.optionalServices.deliveryContact.lastname &&
      primaryTraveller.lastname
    ) {
      setValue('optionalServices.deliveryContact.lastname', primaryTraveller.lastname)
    }

    if (
      liveValues.optionalServices.deliveryVisa === 'home_delivery' &&
      !liveValues.optionalServices.deliveryContact.firstname &&
      primaryTraveller.firstname
    ) {
      setValue('optionalServices.deliveryContact.firstname', primaryTraveller.firstname)
    }

    if (
      liveValues.optionalServices.deliveryVisa === 'home_delivery' &&
      !liveValues.optionalServices.deliveryContact.title &&
      primaryTraveller.title
    ) {
      setValue('optionalServices.deliveryContact.title', primaryTraveller.title)
    }

    if (
      liveValues.travellers.some((traveller) => traveller.followSms) &&
      !liveValues.optionalServices.followSms
    ) {
      setValue('optionalServices.followSms', true)
    }

    if (!liveValues.optionalServices.smsMobile && primaryTraveller.phone) {
      setValue('optionalServices.smsMobile', primaryTraveller.phone)
    }
  }, [liveValues, setValue])

  useEffect(() => {
    const currentUserEmail = currentUser?.email.trim()
    if (!currentUserEmail || liveValues.travellers.length === 0) {
      return
    }

    const primaryTraveller = liveValues.travellers[0]

    if (!primaryTraveller.email) {
      setValue('travellers.0.email', currentUserEmail, { shouldDirty: false })
    }

    if (!primaryTraveller.emailConfirm) {
      setValue('travellers.0.emailConfirm', currentUserEmail, {
        shouldDirty: false,
      })
    }
  }, [currentUser, liveValues.travellers, setValue])

  useEffect(() => {
    if (!availabilityQuery.data) {
      return
    }

    const currentAppointment = getValues('appointment')
    setAvailability(availabilityQuery.data)
    if (
      currentAppointment.chooseAppointmentDate !==
      availabilityQuery.data.chooseAppointmentDate
    ) {
      setValue(
        'appointment.chooseAppointmentDate',
        availabilityQuery.data.chooseAppointmentDate,
      )
    }

    if (
      JSON.stringify(currentAppointment.unavailableDayList) !==
      JSON.stringify(availabilityQuery.data.unavailableDayList)
    ) {
      setValue(
        'appointment.unavailableDayList',
        availabilityQuery.data.unavailableDayList,
      )
    }

    const nextQueueConditions = Object.fromEntries(
      availabilityQuery.data.queueConditionList.map((label) => {
        const key = createConditionKey(label)
        return [key, currentAppointment.queueConditions[key] ?? true]
      }),
    )

    if (
      JSON.stringify(currentAppointment.queueConditions) !==
      JSON.stringify(nextQueueConditions)
    ) {
      setValue('appointment.queueConditions', nextQueueConditions)
    }

    if (!availabilityQuery.data.chooseAppointmentDate) {
      if (currentAppointment.date !== QUEUE_LOADING_LABEL) {
        setValue('appointment.date', QUEUE_LOADING_LABEL)
      }
      if (currentAppointment.dateSubmit !== '') {
        setValue('appointment.dateSubmit', '')
      }
      if (currentAppointment.time !== '') {
        setValue('appointment.time', '')
      }
      if (currentAppointment.availableSlots.length > 0) {
        setValue('appointment.availableSlots', [])
      }
    } else if (currentAppointment.date === QUEUE_LOADING_LABEL) {
      setValue('appointment.date', '')
    }

    if (
      availabilityQuery.data.chooseAppointmentDate &&
      currentAppointment.dateSubmit &&
      !isSelectedDayStillAvailable(
        currentAppointment.dateSubmit,
        availabilityQuery.data,
      )
    ) {
      setValue('appointment.date', '')
      setValue('appointment.dateSubmit', '')
      setValue('appointment.time', '')
      setValue('appointment.availableSlots', [])
    }
  }, [availabilityQuery.data, getValues, setAvailability, setValue])

  useEffect(() => {
    if (!slotsQuery.data) {
      return
    }

    setValue('appointment.availableSlots', slotsQuery.data)

    const selectedByLabel = slotsQuery.data.find(
      (slot) => slot.label === liveValues.appointment.time,
    )
    if (selectedByLabel) {
      return
    }

    const selectedByLegacyValue = slotsQuery.data.find(
      (slot) => slot.value === liveValues.appointment.time,
    )

    if (selectedByLegacyValue) {
      setValue('appointment.time', selectedByLegacyValue.label)
      return
    }

    setValue('appointment.time', '')
  }, [liveValues.appointment.time, setValue, slotsQuery.data])

  const serializedDraft = JSON.stringify(liveValues)

  useEffect(() => {
    if (serializedDraft === lastPersistedDraftRef.current) {
      return
    }

    const handle = window.setTimeout(() => {
      lastPersistedDraftRef.current = serializedDraft
      hydrateDraft(liveValues)
      void bookingClient
        .saveDraft({
          version: RUNTIME_CONFIG.draftVersion,
          updatedAt: new Date().toISOString(),
          values: liveValues,
        })
        .then(() => setLastSavedAt(new Date().toLocaleTimeString('fr-FR')))
        .catch((error) => {
          console.error(error)
        })
    }, 750)

    return () => window.clearTimeout(handle)
  }, [hydrateDraft, liveValues, serializedDraft])

  const isBootstrapping =
    globalParamsQuery.isLoading ||
    socialTitlesQuery.isLoading ||
    visaFileVariationsQuery.isLoading ||
    servicesQuery.isLoading ||
    visaTypesQuery.isLoading

  async function handleNextStep() {
    const isValid = await trigger(
      getStepFieldPaths(currentStep, getValues(), services),
    )
    if (!isValid) {
      toast.error('Certains champs doivent etre corriges avant de continuer.')
      return
    }

    markStepCompleted(currentStep)
    setCurrentStep(Math.min(4, currentStep + 1) as 1 | 2 | 3 | 4)
    await recordAudit('step_completed', `Etape ${currentStep} validee`)
  }

  function handlePreviousStep() {
    setCurrentStep(Math.max(1, currentStep - 1) as 1 | 2 | 3 | 4)
  }

  async function handleExport() {
    await exportDraftJson({
      version: RUNTIME_CONFIG.draftVersion,
      updatedAt: new Date().toISOString(),
      values: getValues(),
    })
    toast.success('Brouillon exporte')
  }

  async function handleImport() {
    try {
      const imported = await importDraftJson()
      if (!imported) {
        return
      }

      const normalizedDraft = applyBookingDraftDefaults(imported.values)

      formSeedRef.current = normalizedDraft
      previousAreaRef.current = normalizedDraft.area || null
      lastPersistedDraftRef.current = JSON.stringify(imported.values)
      hydrateDraft(normalizedDraft)
      reset(normalizedDraft)
      toast.success('Brouillon importe')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Import du brouillon impossible.',
      )
    }
  }

  async function handleResetDraft() {
    const fresh = createEmptyBookingDraft()
    formSeedRef.current = fresh
    previousAreaRef.current = fresh.area || null
    lastPersistedDraftRef.current = JSON.stringify(fresh)
    resetDraft()
    reset(fresh)
    clearSubmission()
    toast.success('Brouillon reinitialise')
    await recordAudit('draft_reset', 'Brouillon remis a zero')
  }

  async function onSubmit(values: BookingFormValues) {
    if (submittingRef.current) return
    if (!currentUser) {
      toast.error("Renseignez d'abord l'utilisateur actif avant de soumettre.")
      await recordAudit(
        'submit_blocked',
        "Soumission bloquee: utilisateur actif non renseigne",
      )
      return
    }

    submittingRef.current = true
    try {
      clearSubmission()
      setSubmissionStatus('submitting')
      await recordAudit(
        'submit_attempt',
        `Soumission pour ${values.area} avec ${values.nbTravellers} voyageur(s)`,
      )

      if (automaticCaptcha && !values.appointment.captchaToken.trim()) {
        setSolvingCaptcha(true)
        try {
          const token = await solveCaptcha()
          values = { ...values, appointment: { ...values.appointment, captchaToken: token } }
        } catch (reason) {
          const message = String(reason)
          setError('appointment.captchaToken', { type: 'solver', message })
          setSubmissionFailure({ status: 0, fieldErrors: [], rawMessages: [message] })
          toast.error(message)
          return
        } finally { setSolvingCaptcha(false) }
      }

      const payload = buildBookingPayload(
        values,
        latestSessionIdRef.current || globalParams?.sessionId || '',
        services,
      )
      const result = await bookingClient.submitBooking(payload)

      if ('fieldErrors' in result) {
        setSubmissionFailure(result)
        groupFieldErrorsByPath(result.fieldErrors).forEach((error) => {
          setError(error.field as Path<BookingFormValues>, {
            type: 'server',
            message: error.message,
          })
        })
        toast.error('Le serveur a retourne des erreurs de validation.')
        return
      }

      setSubmissionSuccess(result)
      try {
        // Keep persistence uncapped: every accepted Capago appointment is saved
        // locally and synced to the database when DATABASE_URL is available.
        const savedRecord = await bookingClient.saveRequestRecord(
          buildStoredRequestRecord({
            values,
            payload,
            result,
            centerLabel: currentCenter?.label ?? values.area,
            submitter: currentUser,
          }),
        )

        await queryClient.invalidateQueries({
          queryKey: bookingQueryKeys.requestRecords,
        })

        if (savedRecord.databaseSyncStatus === 'database_failed') {
          toast.warning(
            "Soumission acceptee. Le dossier reste disponible dans l'historique.",
          )
        } else {
          toast.success("Soumission acceptee et ajoutee a l'historique.")
        }
      } catch (error) {
        console.error(error)
        toast.warning(
          "Soumission acceptee, mais le dossier n'a pas pu etre ajoute a l'historique.",
        )
      }

      await recordAudit('submit_success', `Statut ${result.status}`)
    } catch (reason) {
      const message = String(reason)
      setSubmissionFailure({ status: 0, fieldErrors: [], rawMessages: [message] })
      toast.error(message)
    } finally {
      // Tokens are single-use; never reuse one after an attempted submission.
      setValue('appointment.captchaToken', '', { shouldDirty: false })
      submittingRef.current = false
    }
  }

  async function onInvalidSubmit(submitErrors: FieldErrors<BookingFormValues>) {
    const firstInvalidPath = flattenErrorPaths(submitErrors)[0] ?? null
    const blockedStep = firstInvalidPath ? getStepFromErrorPath(firstInvalidPath) : 4

    setSubmissionStatus('idle')

    if (blockedStep !== currentStep) {
      setCurrentStep(blockedStep)
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
    toast.error(getInvalidSubmissionMessage(firstInvalidPath))
    await recordAudit(
      'submit_blocked',
      `Soumission bloquee par validation locale (${firstInvalidPath ?? 'unknown'})`,
    )
  }

  if (isBootstrapping && !globalParams) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-10 text-muted-foreground">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Initialisation des parametres, centres et listes dynamiques...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <Stepper currentStep={currentStep} completedSteps={completedSteps} />

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-white px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Brouillon local</p>
            <p className="text-sm text-muted-foreground">
              {lastSavedAt ? `Derniere sauvegarde a ${lastSavedAt}` : 'Autosauvegarde active'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exporter JSON
            </Button>
            <Button type="button" variant="secondary" onClick={handleImport}>
              <FileUp className="mr-2 h-4 w-4" />
              Importer JSON
            </Button>
            <Button type="button" variant="ghost" onClick={handleResetDraft}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Reinitialiser
            </Button>
          </div>
        </div>

        <ServerErrorPanel messages={[...bootstrapError, ...rawServerErrors]} />

        {submissionStatus === 'success' ? (
          <SubmissionSuccess
            location={lastSuccess?.location ?? null}
            onOpenLocation={() => {
              if (lastSuccess?.location) {
                void openExternalUrl(lastSuccess.location)
              }
            }}
          />
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}>
          {currentStep === 1 ? (
            <Step1Setup
              control={control}
              errors={errors}
              centers={globalParams?.centers ?? []}
              globalParams={globalParams}
              values={liveValues}
              setValue={setValue}
            />
          ) : null}

          {currentStep === 2 ? (
            <Step2Travellers
              control={control}
              errors={errors}
              values={liveValues}
              socialTitles={socialTitles}
              visaFileVariations={visaFileVariations}
              visaTypes={visaTypes}
              services={services}
              setValue={setValue}
              showSmsSelection={visibleServices.some(
                (service) => service.category === 'sms',
              )}
            />
          ) : null}

          {currentStep === 3 ? (
            <Step3Services
              control={control}
              errors={errors}
              values={liveValues}
              services={services}
              socialTitles={socialTitles}
              setValue={setValue}
            />
          ) : null}

          {currentStep === 4 ? (
            <Step4Appointment
              control={control}
              errors={errors}
              values={liveValues}
              availability={availabilityQuery.data ?? null}
              availabilityRequested={canLoadAvailability}
              availabilityError={availabilityErrorMessage}
              slotsError={slotsErrorMessage}
              slotsLoading={slotsQuery.isLoading || slotsQuery.isFetching}
              availabilityLoading={
                availabilityQuery.isLoading || availabilityQuery.isFetching
              }
              onOpenVerification={() => {
                setVerificationOpening(true)
                void bookingClient
                  .getGlobalParams()
                  .then((freshGlobalParams) => {
                    latestSessionIdRef.current =
                      freshGlobalParams.sessionId || latestSessionIdRef.current
                  })
                  .catch((error) => {
                    console.error(error)
                  })
                  .then(() =>
                    openEmbeddedRecaptchaWindow({
                      baseUrl: RUNTIME_CONFIG.bookingFrontendUrl,
                      locale: RUNTIME_CONFIG.defaultLocale,
                    }),
                  )
                  .then((openedInApp) => {
                    if (openedInApp) {
                      return
                    }

                    return openExternalUrl(RUNTIME_CONFIG.bookingFrontendUrl)
                  })
                  .catch((error) => {
                    console.error(error)
                    toast.error(
                      "Impossible d'ouvrir la verification integree. Reessayez.",
                    )
                  })
                  .finally(() => {
                    setVerificationOpening(false)
                  })
              }}
              setValue={setValue}
              verificationOpening={verificationOpening}
              automaticCaptcha={automaticCaptcha}
              solvingCaptcha={solvingCaptcha}
              submitting={isSubmitting || submissionStatus === 'submitting'}
            />
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handlePreviousStep}
              disabled={currentStep === 1 || isSubmitting}
            >
              Retour
            </Button>

            {currentStep < 4 ? (
              <Button type="button" onClick={() => void handleNextStep()}>
                Continuer
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting || submissionStatus === 'submitting'}
              >
                {isSubmitting || submissionStatus === 'submitting'
                  ? solvingCaptcha ? 'Resolution du CAPTCHA...' : 'Soumission...'
                  : 'Soumettre la demande'}
              </Button>
            )}
          </div>
        </form>
      </div>

      <SummaryPanel
        values={liveValues}
        currentCenter={currentCenter}
        currentStep={currentStep}
        completedSteps={completedSteps}
        socialTitles={socialTitles}
        visaFileVariations={visaFileVariations}
        visaTypes={visaTypes}
      />
    </div>
  )
}
