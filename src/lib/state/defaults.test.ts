import { describe, expect, it } from 'vitest'

import {
  applyBookingDraftDefaults,
  applyDefaultDepartureDates,
  createDefaultDepartureDateParts,
  createEmptyBookingDraft,
} from '@/lib/state/defaults'

describe('departure date defaults', () => {
  it('sets the departure date to one month after today', () => {
    expect(createDefaultDepartureDateParts(new Date(2026, 2, 27))).toEqual({
      dayDepartureDate: '27',
      monthDepartureDate: '04',
      yearDepartureDate: '2026',
    })
  })

  it('clamps month-end dates when the next month is shorter', () => {
    expect(createDefaultDepartureDateParts(new Date(2026, 0, 31))).toEqual({
      dayDepartureDate: '28',
      monthDepartureDate: '02',
      yearDepartureDate: '2026',
    })
  })

  it('fills older blank drafts without overwriting existing departure dates', () => {
    const draft = createEmptyBookingDraft()
    draft.travellers[0] = {
      ...draft.travellers[0],
      dayDepartureDate: '',
      monthDepartureDate: '',
      yearDepartureDate: '',
    }

    const normalized = applyDefaultDepartureDates(draft, new Date(2026, 2, 27))

    expect(normalized.travellers[0]).toMatchObject({
      dayDepartureDate: '27',
      monthDepartureDate: '04',
      yearDepartureDate: '2026',
    })

    const withManualDate = applyDefaultDepartureDates(
      {
        ...draft,
        travellers: [
          {
            ...draft.travellers[0],
            dayDepartureDate: '03',
            monthDepartureDate: '05',
            yearDepartureDate: '2026',
          },
        ],
      },
      new Date(2026, 2, 27),
    )

    expect(withManualDate.travellers[0]).toMatchObject({
      dayDepartureDate: '03',
      monthDepartureDate: '05',
      yearDepartureDate: '2026',
    })
  })

  it('defaults the formula to standard for new and legacy blank drafts', () => {
    expect(createEmptyBookingDraft().formula).toBe('standard')

    const legacyDraft = createEmptyBookingDraft()
    legacyDraft.formula = ''

    expect(applyBookingDraftDefaults(legacyDraft).formula).toBe('standard')
  })

  it('marks the pre-captcha queue conditions by default', () => {
    const draft = createEmptyBookingDraft()

    expect(Object.values(draft.appointment.queueConditions)).toEqual(
      expect.arrayContaining([true]),
    )
    expect(Object.values(draft.appointment.queueConditions)).not.toContain(false)
  })

  it('hydrates legacy drafts that predate the package service fields', () => {
    const legacyDraft = createEmptyBookingDraft()
    const legacyTraveller = { ...legacyDraft.travellers[0] }
    const legacyOptionalServices = { ...legacyDraft.optionalServices }

    delete (legacyTraveller as Partial<typeof legacyTraveller>).franceVisasAssistance
    delete (legacyOptionalServices as Partial<typeof legacyOptionalServices>)
      .primeTimeAppointment

    const normalized = applyBookingDraftDefaults({
      ...legacyDraft,
      travellers: [legacyTraveller],
      optionalServices: legacyOptionalServices,
    })

    expect(normalized.travellers[0].franceVisasAssistance).toBe(false)
    expect(normalized.optionalServices.primeTimeAppointment).toBe(false)
  })
})
