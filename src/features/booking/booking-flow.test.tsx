import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BookingShell } from '@/features/booking/booking-shell'
import { bookingClient } from '@/lib/api/bookingClient'
import type { AvailabilityResponse } from '@/lib/api/types'
import { canSolveAutomatically, solveCaptcha } from '@/lib/recaptcha/solver'
import { createEmptyBookingDraft } from '@/lib/state/defaults'
import { useBookingStore } from '@/lib/state/store'
import { createConditionKey } from '@/lib/utils'

function createMockAvailability(): AvailabilityResponse {
  return {
    chooseAppointmentDate: true,
    availableDayList: ['2026-04-06'],
    firstAvailableDay: '2026-04-06',
    firstDay: '2026-04-01',
    lastDay: '2026-04-30',
    expectedWeekCountBeforeAppointment: null,
    unavailableDayList: ['2026-04-03'],
    queueConditionList: [],
  }
}

let mockAvailability = createMockAvailability()

const mockSlots = [
  {
    value: '2026-04-06T08:00:00',
    rawValue: '2026-04-06T08:00:00',
    label: '8:00 AM',
  },
]

function renderBookingShell(props?: ComponentProps<typeof BookingShell>) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <BookingShell
        currentUser={{ name: 'Agent Test', email: 'agent@example.com' }}
        {...props}
      />
    </QueryClientProvider>,
  )
}

vi.mock('@/features/booking/hooks/use-booking-bootstrap', () => ({
  useBookingBootstrap: () => ({
    globalParamsQuery: { isLoading: false, error: null, isFetching: false },
    socialTitlesQuery: { isLoading: false, error: null, isFetching: false },
    visaFileVariationsQuery: {
      isLoading: false,
      error: null,
      isFetching: false,
    },
    servicesQuery: { isLoading: false, error: null, isFetching: false },
    visaTypesQuery: { isLoading: false, error: null, isFetching: false },
  }),
}))

vi.mock('@/lib/api/hooks', () => ({
  useUnavailableDaysQuery: (
    _centerId: string,
    _formula: string,
    _visaFileList: string,
    enabled = true,
  ) => ({
    data: enabled ? mockAvailability : undefined,
    isLoading: false,
    isFetching: false,
    error: null,
  }),
  useAvailableSlotsQuery: (
    _centerId: string,
    _formula: string,
    day: string,
    enabled = true,
  ) => ({
    data: enabled && day ? mockSlots : undefined,
    isLoading: false,
    isFetching: false,
    error: null,
  }),
}))

vi.mock('@/lib/api/bookingClient', () => ({
  bookingClient: {
    loadDraft: vi.fn().mockResolvedValue(null),
    saveDraft: vi.fn().mockResolvedValue(undefined),
    submitBooking: vi.fn(),
    saveRequestRecord: vi
      .fn()
      .mockResolvedValue({ databaseSyncStatus: 'local_only' }),
    appendAuditEntry: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@/lib/persistence/drafts', () => ({
  exportDraftJson: vi.fn().mockResolvedValue(undefined),
  importDraftJson: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/persistence/external', () => ({
  openExternalUrl: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/audit/logger', () => ({
  recordAudit: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/recaptcha/solver', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/recaptcha/solver')>()),
  canSolveAutomatically: vi.fn().mockReturnValue(false),
  solveCaptcha: vi.fn(),
}))

describe('BookingShell flow', () => {
  function seedStore(currentStep = 1) {
    localStorage.clear()
    const draft = createEmptyBookingDraft()
    draft.area = 'capago_ANB'
    draft.formula = 'premium'
    draft.cgv = true

    if (currentStep >= 2) {
      draft.travellers[0] = {
        ...draft.travellers[0],
        title: 'mr',
        lastname: 'Doe',
        firstname: 'John',
        dayBirth: '01',
        monthBirth: '01',
        yearBirth: '1990',
        phone: '0555123456',
        email: 'john@example.com',
        emailConfirm: 'john@example.com',
        passportNumber: 'AB123456',
        dayDepartureDate: '02',
        monthDepartureDate: '04',
        yearDepartureDate: '2026',
        visaStayDuration: 'short_stay',
        travelPurpose: 'tourism',
        typeVisa: 'tourism_short',
        precision1: 'single_entry',
        precision2: 'checklist_1',
        visaFileVariation: 'primo_demand',
        renewal: false,
        followSms: false,
      }
    }

    useBookingStore.setState({
      locale: 'fr',
      runtimeConfig: useBookingStore.getState().runtimeConfig,
      globalParams: {
        sessionId: 'fixture',
        currencyCode: 'EUR',
        termsAndConditionsUrl: 'https://example.test',
        maxTravellersPerGroup: 6,
        phoneNumberFormat: '^(0|\\+213)[0-9]{9}$',
        phoneNumberRegex: '^(0|\\+213)[0-9]{9}$',
        premiumIncludesHomeDelivery: true,
        premiumIncludesPhoto: true,
        premiumIncludesSms: true,
        centers: [
          {
            id: 'capago_ANB',
            code: 'capago_ANB',
            label: 'Annaba',
            city: 'Annaba',
            country: 'Algerie',
            imageUrl: null,
            premiumHeadline: null,
            premiumDescription: null,
          },
          {
            id: 'capago_CZL',
            code: 'capago_CZL',
            label: 'Constantine',
            city: 'Constantine',
            country: 'Algerie',
            imageUrl: null,
            premiumHeadline: null,
            premiumDescription: null,
          },
        ],
      },
      socialTitles: [
        { id: 'mr', label: 'Monsieur', shortLabel: 'M.' },
        { id: 'mrs', label: 'Madame', shortLabel: 'Mme' },
      ],
      visaFileVariations: [
        { id: 'primo_demand', label: 'Premiere demande', description: null },
      ],
      services: [
        {
          id: 'portrait',
          code: 'portrait',
          name: 'Photo',
          description: null,
          price: 8,
          currencyCode: 'EUR',
          category: 'portrait',
          isMandatory: false,
          isIncludedInPremium: true,
          formulas: ['standard', 'premium'],
          travellerScoped: false,
        },
        {
          id: 'delivery',
          code: 'home_delivery',
          name: 'Livraison',
          description: null,
          price: 12,
          currencyCode: 'EUR',
          category: 'delivery',
          isMandatory: false,
          isIncludedInPremium: true,
          formulas: ['standard', 'premium'],
          travellerScoped: false,
        },
        {
          id: 'sms',
          code: 'follow_sms',
          name: 'SMS',
          description: null,
          price: 3,
          currencyCode: 'EUR',
          category: 'sms',
          isMandatory: false,
          isIncludedInPremium: true,
          formulas: ['standard', 'premium'],
          travellerScoped: false,
        },
      ],
      visaTypes: [
        {
          id: 'tourism_short',
          label: 'Court sejour tourisme',
          visaStayDurationId: 'short_stay',
          visaStayDurationLabel: 'Court sejour',
          productLineId: 'tourism',
          productLineLabel: 'Tourisme',
          travelProjectRelativeUrl: '/tourism-short-stay',
          legacyRenewalSupported: true,
          visaVariationList: [
            {
              id: 'single_entry',
              label: 'Entree unique',
              validationChecklistList: [
                {
                  id: 'checklist_1',
                  label: 'Check-list tourisme',
                  description: null,
                },
              ],
            },
          ],
          visaFileVariationRequired: true,
        },
      ],
      selectedCenterId: 'capago_ANB',
      centers: [
        {
          id: 'capago_ANB',
          code: 'capago_ANB',
          label: 'Annaba',
          city: 'Annaba',
          country: 'Algerie',
          imageUrl: null,
          premiumHeadline: null,
          premiumDescription: null,
        },
        {
          id: 'capago_CZL',
          code: 'capago_CZL',
          label: 'Constantine',
          city: 'Constantine',
          country: 'Algerie',
          imageUrl: null,
          premiumHeadline: null,
          premiumDescription: null,
        },
      ],
      isBootstrapped: true,
      currentStep: currentStep as 1 | 2 | 3 | 4,
      completedSteps: currentStep > 1 ? [1] : [],
      draft,
      availability: null,
      submissionStatus: 'idle',
      lastSuccess: null,
      lastFailure: null,
      rawServerErrors: [],
      auditTrail: [],
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(canSolveAutomatically).mockReturnValue(false)
    vi.mocked(solveCaptcha).mockReset()
    vi.mocked(bookingClient.submitBooking).mockReset()
    vi.stubGlobal('scrollTo', vi.fn())
    mockAvailability = createMockAvailability()
    seedStore()
  })

  function seedAutomaticSubmission() {
    seedStore(4)
    mockAvailability = {
      ...createMockAvailability(),
      chooseAppointmentDate: false,
    }
    useBookingStore.setState((state) => ({
      draft: {
        ...state.draft,
        appointment: {
          ...state.draft.appointment,
          chooseAppointmentDate: false,
        },
      },
    }))
    vi.mocked(canSolveAutomatically).mockReturnValue(true)
  }

  it('solves automatically before posting and keeps the token out of the draft', async () => {
    seedAutomaticSubmission()
    vi.mocked(solveCaptcha).mockResolvedValue('fresh-solver-token')
    vi.mocked(bookingClient.submitBooking).mockResolvedValue({
      status: 200,
      location: null,
    })
    const user = userEvent.setup()
    renderBookingShell()
    await user.click(
      await screen.findByRole('button', { name: /Soumettre la demande/i }),
    )
    await waitFor(() =>
      expect(bookingClient.submitBooking).toHaveBeenCalledOnce(),
    )
    expect(solveCaptcha).toHaveBeenCalledOnce()
    expect(vi.mocked(solveCaptcha).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(bookingClient.submitBooking).mock.invocationCallOrder[0],
    )
    expect(
      vi.mocked(bookingClient.submitBooking).mock.calls[0][0].fields[
        'g-recaptcha-response'
      ],
    ).toBe('fresh-solver-token')
    expect(useBookingStore.getState().draft.appointment.captchaToken).toBe('')
  })

  it('reuses a CAPTCHA token solved on step 4 instead of solving again on submit', async () => {
    seedAutomaticSubmission()
    useBookingStore.setState((state) => ({
      draft: {
        ...state.draft,
        appointment: {
          ...state.draft.appointment,
          captchaToken: 'step-four-solver-token',
        },
      },
    }))
    vi.mocked(bookingClient.submitBooking).mockResolvedValue({
      status: 200,
      location: null,
    })
    const user = userEvent.setup()
    renderBookingShell()
    await user.click(
      await screen.findByRole('button', { name: /Soumettre la demande/i }),
    )
    await waitFor(() =>
      expect(bookingClient.submitBooking).toHaveBeenCalledOnce(),
    )
    expect(solveCaptcha).not.toHaveBeenCalled()
    expect(
      vi.mocked(bookingClient.submitBooking).mock.calls[0][0].fields[
        'g-recaptcha-response'
      ],
    ).toBe('step-four-solver-token')
  })

  it('blocks the booking post when automatic solving fails and allows retry', async () => {
    seedAutomaticSubmission()
    vi.mocked(solveCaptcha).mockRejectedValue(new Error('ERROR_ZERO_BALANCE'))
    const user = userEvent.setup()
    renderBookingShell()
    await user.click(
      await screen.findByRole('button', { name: /Soumettre la demande/i }),
    )
    await waitFor(() =>
      expect(
        useBookingStore.getState().lastFailure?.rawMessages.join(' '),
      ).toContain('ERROR_ZERO_BALANCE'),
    )
    expect(bookingClient.submitBooking).not.toHaveBeenCalled()
    expect(
      screen.getByRole('button', { name: /Soumettre la demande/i }),
    ).toBeEnabled()
  })

  it('does not create a paid CAPTCHA task when the booking form is invalid', async () => {
    seedAutomaticSubmission()
    useBookingStore.setState((state) => ({
      draft: { ...state.draft, cgv: false },
    }))
    const user = userEvent.setup()
    renderBookingShell()
    await user.click(
      await screen.findByRole('button', { name: /Soumettre la demande/i }),
    )
    await waitFor(() => expect(useBookingStore.getState().currentStep).toBe(1))
    expect(solveCaptcha).not.toHaveBeenCalled()
    expect(bookingClient.submitBooking).not.toHaveBeenCalled()
  })

  it('moves from setup to travellers when the setup step is valid', async () => {
    const user = userEvent.setup()

    renderBookingShell()

    await user.click(screen.getByRole('button', { name: /continuer/i }))

    await screen.findByRole('heading', { name: /Voyageur 1/i })
  })

  it('creates one traveller block per selected voyageur in step 1', async () => {
    seedStore()
    const user = userEvent.setup()

    renderBookingShell()

    await user.selectOptions(screen.getByLabelText(/Nombre de voyageurs/i), '2')
    await user.click(screen.getByRole('button', { name: /continuer/i }))

    await screen.findByRole('heading', { name: /Voyageur 1/i })
    expect(screen.getByRole('tab', { name: /Voyageur 2/i })).toBeInTheDocument()
  })

  it('moves from travellers to services when traveller details are already valid', async () => {
    seedStore(2)
    const user = userEvent.setup()

    renderBookingShell()

    await user.click(screen.getByRole('button', { name: /continuer/i }))

    await waitFor(() => {
      expect(screen.getByText(/Services du dossier/i)).toBeInTheDocument()
    })
  })

  it('switches to Constantine without keeping stale visa selections', async () => {
    seedStore()
    const staleDraft = useBookingStore.getState().draft
    staleDraft.travellers[0] = {
      ...staleDraft.travellers[0],
      visaStayDuration: 'short_stay',
      travelPurpose: 'tourism',
      typeVisa: 'tourism_short',
      precision1: 'single_entry',
      precision2: 'checklist_1',
      visaFileVariation: 'primo_demand',
    }
    useBookingStore.setState({ draft: staleDraft })

    const user = userEvent.setup()
    renderBookingShell()

    await user.click(screen.getByRole('button', { name: /constantine/i }))
    await user.click(screen.getByRole('button', { name: /continuer/i }))

    await screen.findByRole('heading', { name: /Voyageur 1/i })
    await waitFor(() => {
      expect(screen.getByLabelText(/Durée du séjour/i)).toHaveValue('')
      expect(screen.getByLabelText(/Projet de voyage/i)).toHaveValue('')
      expect(screen.getByLabelText(/Motif principal du séjour/i)).toHaveValue(
        '',
      )
    })
  })

  it('shows delivery title as a select and syncs traveller sms choices with step 3', async () => {
    seedStore(3)
    useBookingStore.setState((state) => ({
      draft: {
        ...state.draft,
        optionalServices: {
          ...state.draft.optionalServices,
          deliveryVisa: 'home_delivery',
        },
        travellers: state.draft.travellers.map((traveller, index) =>
          index === 0 ? { ...traveller, followSms: true } : traveller,
        ),
      },
    }))

    renderBookingShell()

    await screen.findByText(/Services du dossier/i)

    expect(screen.getByLabelText(/Titre du contact/i)).toHaveValue('mr')
    expect(screen.getByLabelText(/Numéro mobile SMS/i)).toHaveValue(
      '0555123456',
    )

    expect(
      screen.getByLabelText(/Recevoir des notifications/i),
    ).toHaveAttribute('data-state', 'checked')
    expect(
      screen.getByLabelText(/Voyageur 1 - Contact principal/i),
    ).toHaveAttribute('data-state', 'checked')
  })

  it('uses personal photos and centre pickup as the default step 3 choices', async () => {
    seedStore(3)

    renderBookingShell()

    await screen.findByText(/Services du dossier/i)

    expect(
      screen.getByRole('radio', {
        name: /Non, je fournirai mes propres photos/i,
      }),
    ).toHaveAttribute('data-state', 'checked')
    expect(
      screen.getByRole('radio', { name: /Retrait au centre/i }),
    ).toHaveAttribute('data-state', 'checked')
  })

  it('removes the renewal option from step 2', async () => {
    seedStore(2)

    renderBookingShell()

    await screen.findByRole('heading', { name: /Voyageur 1/i })
    expect(
      screen.queryByText(/Dossier renouvellement/i),
    ).not.toBeInTheDocument()
  })

  it('prefills the primary traveller email from the current user when empty', async () => {
    seedStore(2)
    useBookingStore.setState((state) => ({
      draft: {
        ...state.draft,
        travellers: state.draft.travellers.map((traveller, index) =>
          index === 0
            ? {
                ...traveller,
                email: '',
                emailConfirm: '',
              }
            : traveller,
        ),
      },
    }))

    renderBookingShell({
      currentUser: { name: 'Equipe Annaba', email: 'team.annaba@example.com' },
    })

    await screen.findByRole('heading', { name: /Voyageur 1/i })
    await waitFor(() => {
      expect(screen.getByLabelText(/^Email$/i)).toHaveValue(
        'team.annaba@example.com',
      )
      expect(screen.getByLabelText(/Confirmation de l'email/i)).toHaveValue(
        'team.annaba@example.com',
      )
    })
  })

  it('keeps the captcha token hidden while showing a verification-ready state', async () => {
    seedStore(4)
    const conditionLabel =
      'Je confirme que les donnees du demandeur sont exactes.'

    mockAvailability = {
      ...createMockAvailability(),
      availableDayList: [],
      chooseAppointmentDate: false,
      queueConditionList: [conditionLabel],
    }

    useBookingStore.setState((state) => ({
      draft: {
        ...state.draft,
        appointment: {
          ...state.draft.appointment,
          chooseAppointmentDate: false,
          captchaToken: 'token-from-recaptcha',
          queueConditions: {
            [createConditionKey(conditionLabel)]: true,
          },
        },
      },
      currentStep: 4,
    }))

    renderBookingShell()

    await waitFor(() => {
      expect(
        screen.getAllByText(/Vérification complétée/i).length,
      ).toBeGreaterThan(0)
    })
    expect(
      screen.queryByLabelText(/Jeton g-recaptcha-response/i),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(/choisissez « Repasser la vérification »/i),
    ).toBeInTheDocument()
  })

  it('shows the hour picker only after a valid day selection in appointment mode', async () => {
    seedStore(4)
    const user = userEvent.setup()

    useBookingStore.setState((state) => ({
      draft: {
        ...state.draft,
        appointment: {
          ...state.draft.appointment,
          chooseAppointmentDate: true,
        },
      },
      currentStep: 4,
    }))

    renderBookingShell()

    await screen.findByText(/Date de rendez-vous/i)
    expect(
      screen.queryByLabelText(/Heure de rendez-vous/i),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '6' }))

    await waitFor(() => {
      expect(screen.getByLabelText(/Heure de rendez-vous/i)).toBeInTheDocument()
    })
  })

  it('keeps the readable appointment slot label selected for submission', async () => {
    seedStore(4)
    const user = userEvent.setup()

    useBookingStore.setState((state) => ({
      draft: {
        ...state.draft,
        appointment: {
          ...state.draft.appointment,
          chooseAppointmentDate: true,
        },
      },
      currentStep: 4,
    }))

    renderBookingShell()

    await screen.findByText(/Date de rendez-vous/i)
    await user.click(screen.getByRole('button', { name: '6' }))

    const hourSelect = await screen.findByLabelText(/Heure de rendez-vous/i)
    await user.selectOptions(hourSelect, '8:00 AM')

    expect(hourSelect).toHaveValue('8:00 AM')
    expect(screen.getAllByText('8:00 AM').length).toBeGreaterThan(0)
  })
  it('opens the invalid traveller tab when continuation is blocked', async () => {
    seedStore(2)
    useBookingStore.setState((state) => ({
      draft: {
        ...state.draft,
        nbTravellers: 2,
        travellers: [
          ...state.draft.travellers,
          {
            ...createEmptyBookingDraft().travellers[0],
            id: 'second-traveller',
          },
        ],
      },
    }))
    const user = userEvent.setup()
    renderBookingShell()
    await user.click(screen.getByRole('button', { name: /continuer/i }))
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: /Voyageur 2/i })).toHaveAttribute(
        'aria-selected',
        'true',
      ),
    )
    expect(useBookingStore.getState().currentStep).toBe(2)
    expect(bookingClient.submitBooking).not.toHaveBeenCalled()
  })
  it('preserves edits when leaving the wizard before the autosave delay', async () => {
    seedStore(2)
    const user = userEvent.setup()
    const view = renderBookingShell()
    await user.clear(screen.getByRole('textbox', { name: 'Nom' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Nom' }),
      'Nouveau nom',
    )
    view.unmount()
    expect(useBookingStore.getState().draft.travellers[0].lastname).toBe(
      'Nouveau nom',
    )
    await waitFor(() =>
      expect(bookingClient.saveDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          values: expect.objectContaining({
            travellers: expect.arrayContaining([
              expect.objectContaining({ lastname: 'Nouveau nom' }),
            ]),
          }),
        }),
      ),
    )
  })
})
