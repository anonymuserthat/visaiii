import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { RequestRecordList } from '@/features/dashboard/components/request-record-list'
import type { StoredRequestRecord, VisaTypeItem } from '@/lib/api/types'
import { createEmptyBookingDraft } from '@/lib/state/defaults'

function createRecord(overrides: Partial<StoredRequestRecord>): StoredRequestRecord {
  return {
    id: overrides.id ?? 'req_1',
    submittedAt: overrides.submittedAt ?? '2026-03-27T10:00:00.000Z',
    submitterName: overrides.submitterName ?? 'Agent Test',
    submitterEmail: overrides.submitterEmail ?? 'agent@test.dev',
    centerId: overrides.centerId ?? 'capago_CZL',
    centerLabel: overrides.centerLabel ?? 'Capago Constantine',
    formula: overrides.formula ?? 'standard',
    travellerCount: overrides.travellerCount ?? 1,
    primaryTravellerName: overrides.primaryTravellerName ?? 'Voyageur Test',
    primaryTravellerEmail: overrides.primaryTravellerEmail ?? 'voyageur@test.dev',
    primaryTravellerPhone: overrides.primaryTravellerPhone ?? '0660000000',
    appointmentDate: overrides.appointmentDate ?? '12 Mai 2026',
    appointmentTime: overrides.appointmentTime ?? '9:00 AM',
    statusCode: overrides.statusCode ?? 201,
    confirmationLocation: overrides.confirmationLocation ?? null,
    encodedPayload: overrides.encodedPayload ?? 'payload=test',
    bookingSnapshot: overrides.bookingSnapshot ?? createEmptyBookingDraft(),
    dismissedReminderAt: overrides.dismissedReminderAt ?? null,
    databaseSyncStatus: overrides.databaseSyncStatus ?? 'database_synced',
    databaseSyncMessage: overrides.databaseSyncMessage ?? null,
  }
}

describe('RequestRecordList', () => {
  it('paginates long histories', async () => {
    const user = userEvent.setup()
    const records = Array.from({ length: 12 }, (_, index) =>
      createRecord({
        id: `req_${index + 1}`,
        primaryTravellerName: `Voyageur ${index + 1}`,
        primaryTravellerEmail: `voyageur${index + 1}@test.dev`,
      }),
    )

    render(
      <RequestRecordList
        records={records}
        scope="history"
        onReuseRecord={vi.fn()}
      />,
    )

    expect(screen.getByText('Voyageur 1')).toBeInTheDocument()
    expect(screen.getByText('Voyageur 10')).toBeInTheDocument()
    expect(screen.queryByText('Voyageur 11')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /suivant/i }))

    expect(screen.getByText('Voyageur 11')).toBeInTheDocument()
    expect(screen.getByText('Voyageur 12')).toBeInTheDocument()
    expect(screen.queryByText('Voyageur 1')).not.toBeInTheDocument()
  })

  it('filters by user and submission date', async () => {
    const user = userEvent.setup()
    const records = [
      createRecord({
        id: 'req_a',
        primaryTravellerName: 'Alpha',
        submitterName: 'Agent A',
        submitterEmail: 'agent-a@test.dev',
        submittedAt: '2026-03-20T09:00:00.000Z',
      }),
      createRecord({
        id: 'req_b',
        primaryTravellerName: 'Beta',
        submitterName: 'Agent B',
        submitterEmail: 'agent-b@test.dev',
        submittedAt: '2026-03-21T09:00:00.000Z',
      }),
      createRecord({
        id: 'req_c',
        primaryTravellerName: 'Gamma',
        submitterName: 'Agent A',
        submitterEmail: 'agent-a@test.dev',
        submittedAt: '2026-03-25T09:00:00.000Z',
      }),
    ]

    render(
      <RequestRecordList
        records={records}
        scope="history"
        onReuseRecord={vi.fn()}
      />,
    )

    await user.selectOptions(
      screen.getByLabelText(/filtrer par utilisateur/i),
      'agent-b@test.dev',
    )

    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
    expect(screen.queryByText('Gamma')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /reinitialiser les filtres/i }))
    fireEvent.change(screen.getByLabelText(/date de soumission a partir de/i), {
      target: { value: '2026-03-21' },
    })
    fireEvent.change(screen.getByLabelText(/date de soumission jusqu'a/i), {
      target: { value: '2026-03-24' },
    })

    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
    expect(screen.queryByText('Gamma')).not.toBeInTheDocument()
  })

  it('shows the current user requests by default when a submitter filter is provided', async () => {
    const user = userEvent.setup()
    const records = [
      createRecord({
        id: 'req_a',
        primaryTravellerName: 'Alpha',
        submitterName: 'Agent A',
        submitterEmail: 'agent-a@test.dev',
      }),
      createRecord({
        id: 'req_b',
        primaryTravellerName: 'Beta',
        submitterName: 'Agent B',
        submitterEmail: 'agent-b@test.dev',
      }),
    ]

    render(
      <RequestRecordList
        records={records}
        scope="history"
        defaultSubmitterFilter="agent-a@test.dev"
        onReuseRecord={vi.fn()}
      />,
    )

    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.queryByText('Beta')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /reinitialiser les filtres/i }))

    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('treats the same submitter email as one user even with different casing or spaces', () => {
    const records = [
      createRecord({
        id: 'req_same_a',
        primaryTravellerName: 'Alpha',
        submitterName: 'Agent Test',
        submitterEmail: 'Agent@Test.dev',
      }),
      createRecord({
        id: 'req_same_b',
        primaryTravellerName: 'Beta',
        submitterName: ' Agent   Test ',
        submitterEmail: '  agent@test.dev  ',
      }),
    ]

    render(
      <RequestRecordList
        records={records}
        scope="history"
        defaultSubmitterFilter="agent@test.dev"
        onReuseRecord={vi.fn()}
      />,
    )

    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('shows all voyageurs for a multi-traveller request', () => {
    const draft = createEmptyBookingDraft()
    draft.travellers = [
      {
        ...draft.travellers[0],
        id: 'traveller_1',
        firstname: 'Ayoub',
        lastname: 'Belhisset',
        email: 'ayoub@example.com',
        phone: '0746758591',
      },
      {
        ...draft.travellers[0],
        id: 'traveller_2',
        firstname: 'Ishak',
        lastname: 'Belhisset',
        email: '',
        phone: '',
      },
    ]

    render(
      <RequestRecordList
        records={[
          createRecord({
            id: 'req_multi',
            travellerCount: 2,
            primaryTravellerName: 'Ayoub Belhisset',
            primaryTravellerEmail: 'ayoub@example.com',
            primaryTravellerPhone: '0746758591',
            bookingSnapshot: draft,
          }),
        ]}
        scope="history"
        onReuseRecord={vi.fn()}
      />,
    )

    expect(screen.getByText(/Tous les voyageurs/i)).toBeInTheDocument()
    expect(screen.getByText(/Voyageur 1: Ayoub Belhisset/i)).toBeInTheDocument()
    expect(screen.getByText(/Voyageur 2: Ishak Belhisset/i)).toBeInTheDocument()
  })

  it('searches across secondary voyageurs in the request snapshot', async () => {
    const user = userEvent.setup()
    const draft = createEmptyBookingDraft()
    draft.travellers = [
      {
        ...draft.travellers[0],
        id: 'traveller_1',
        firstname: 'Ayoub',
        lastname: 'Belhisset',
      },
      {
        ...draft.travellers[0],
        id: 'traveller_2',
        firstname: 'Ishak',
        lastname: 'Belhisset',
      },
    ]

    render(
      <RequestRecordList
        records={[
          createRecord({
            id: 'req_multi_search',
            travellerCount: 2,
            primaryTravellerName: 'Ayoub Belhisset',
            bookingSnapshot: draft,
          }),
        ]}
        scope="history"
        onReuseRecord={vi.fn()}
      />,
    )

    await user.type(
      screen.getByLabelText(/recherche dans les demandes/i),
      'Ishak',
    )

    expect(screen.getByText(/Voyageur 2: Ishak Belhisset/i)).toBeInTheDocument()
  })

  it('opens a details dialog with visa and contact information', async () => {
    const user = userEvent.setup()
    const draft = createEmptyBookingDraft()
    draft.travellers[0] = {
      ...draft.travellers[0],
      firstname: 'Nadia',
      lastname: 'Dossier',
      phone: '0555000111',
      email: 'nadia@example.com',
      passportNumber: 'AB123456',
      visaStayDuration: 'short_stay',
      travelPurpose: 'tourism',
      typeVisa: 'tourism_short',
      precision1: 'single_entry',
      precision2: 'employee',
      visaFileVariation: 'primo_demand',
      franceVisasAssistance: true,
    }
    draft.optionalServices.primeTimeAppointment = true

    const visaTypes = [
      {
        id: 'tourism_short',
        label: 'Visa tourisme',
        visaStayDurationId: 'short_stay',
        visaStayDurationLabel: 'Court sejour',
        productLineId: 'tourism',
        productLineLabel: 'Tourisme / visite',
        travelProjectRelativeUrl: '/tourism',
        legacyRenewalSupported: false,
        visaVariationList: [
          {
            id: 'single_entry',
            label: 'Entree unique',
            validationChecklistList: [
              {
                id: 'employee',
                label: 'Salarie',
                description: null,
              },
            ],
          },
        ],
        visaFileVariationRequired: true,
      },
    ] satisfies VisaTypeItem[]

    render(
      <RequestRecordList
        records={[
          createRecord({
            id: 'req_details',
            primaryTravellerName: 'Nadia Dossier',
            primaryTravellerEmail: 'nadia@example.com',
            primaryTravellerPhone: '0555000111',
            bookingSnapshot: draft,
          }),
        ]}
        scope="history"
        visaTypes={visaTypes}
        visaFileVariations={[
          {
            id: 'primo_demand',
            label: 'Premiere demande',
            description: null,
          },
        ]}
        onReuseRecord={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /details/i }))

    const dialog = screen.getByRole('dialog', { name: /nadia dossier/i })
    expect(within(dialog).getByText('Visa tourisme')).toBeInTheDocument()
    expect(within(dialog).getAllByText('0555000111')).not.toHaveLength(0)
    expect(within(dialog).getByText('AB123456')).toBeInTheDocument()
    expect(within(dialog).getByText('Assistance demandee')).toBeInTheDocument()
    expect(within(dialog).getByText('Premiere demande')).toBeInTheDocument()
  })
})
