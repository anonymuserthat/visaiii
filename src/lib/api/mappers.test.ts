import { describe, expect, it } from 'vitest'

import {
  mapAvailableSlots,
  mapAvailability,
  mapGlobalParams,
  mapServices,
  mapSubmissionErrors,
  mapVisaTypes,
} from '@/lib/api/mappers'

describe('mappers', () => {
  it('maps global params and centers dynamically', () => {
    const globalParams = mapGlobalParams({
      session_id: 'abc',
      currency_code: 'EUR',
      terms_and_conditions_url: 'https://example.test/terms',
      max_travellers_per_group: 6,
      phone_number_format: '^(0|\\+213)[0-9]{9}$',
      premium_includes_home_delivery: true,
      premium_includes_photo: true,
      premium_includes_sms: false,
      capago_center_list: [
        {
          capago_center_id: 'capago_ANB',
          capago_center_name: 'Capago Annaba',
          capago_center_city: 'Annaba',
          capago_center_selection_tip_html: '<p><b>Annaba</b></p>',
          capago_center_vip_formula_html:
            "<p>Optez pour l&#39;exp&eacute;rience Premium avec un accueil d&eacute;di&eacute;.</p>",
        },
        {
          capago_center_id: 'capago_CZL',
          capago_center_name: 'Capago Constantine',
          capago_center_city: 'Constantine',
        },
      ],
    })

    expect(globalParams.centers.map((center) => center.id)).toEqual([
      'capago_ANB',
      'capago_CZL',
    ])
    expect(globalParams.centers[0]).toMatchObject({
      label: 'Capago Annaba',
      city: 'Annaba',
      premiumHeadline: null,
      premiumDescription:
        "Optez pour l'experience Premium avec un accueil dedie.",
    })
    expect(globalParams.premiumIncludesHomeDelivery).toBe(true)
  })

  it('maps live service payloads and queue mode availability', () => {
    const services = mapServices(
      {
        service_list: [
          {
            service_reference: 'home_delivery',
            service_name: 'Livraison a domicile',
            service_price: '12',
          },
          {
            service_reference: 'PACK-PTA',
            service_name: 'Prime Time Appointment Package',
            service_price: '5300',
          },
          {
            service_reference: 'PACK-AFV',
            service_name: 'Assistance France-Visa Package',
            service_price: '1800',
          },
        ],
      },
      'EUR',
    )

    const availability = mapAvailability({
      choose_appointment_date: false,
      first_available_day: '2026-04-08T00:00:00',
      first_day: '2026-04-01T00:00:00',
      last_day: '2026-04-30T00:00:00',
      available_day_list: ['2026-04-08T00:00:00'],
      queue_condition_list: ['Condition A'],
      unavailable_day_list: ['2026-04-03T00:00:00'],
    })

    expect(services[0]?.category).toBe('delivery')
    expect(services[0]?.code).toBe('home_delivery')
    expect(services[0]?.price).toBe(12)
    expect(services[1]?.category).toBe('prime_time')
    expect(services[2]?.category).toBe('france_visas')
    expect(availability.chooseAppointmentDate).toBe(false)
    expect(availability.firstAvailableDay).toBe('2026-04-08')
    expect(availability.firstDay).toBe('2026-04-01')
    expect(availability.lastDay).toBe('2026-04-30')
    expect(availability.availableDayList).toEqual(['2026-04-08'])
    expect(availability.unavailableDayList).toEqual(['2026-04-03'])
    expect(availability.queueConditionList).toEqual(['Condition A'])
  })

  it('maps live visa type payloads using resource ids and product lines', () => {
    const visaTypes = mapVisaTypes({
      product_line_list: [
        {
          product_line_id: '013',
          product_line_list: [
            {
              product_line_id: '145',
              product_line: 'Affaires',
            },
          ],
        },
      ],
      visa_type_list: [
        {
          visa_stay_duration_id: '013',
          visa_stay_duration: 'Court sejour',
          visa_type_id: '145',
          resource_id: '013-145AB4',
          visa_type: 'Affaires urgent',
          visa_variation_list: [
            {
              visa_variation_id: '1',
              visa_variation_name: 'Entree unique',
              validation_checklist_list: [
                {
                  validation_checklist_id: 'ck1',
                  validation_checklist_name: 'Liste affaires',
                },
              ],
            },
          ],
        },
      ],
    })

    expect(visaTypes).toHaveLength(1)
    expect(visaTypes[0]).toMatchObject({
      id: '013-145AB4',
      label: 'Affaires urgent',
      visaStayDurationId: '013',
      visaStayDurationLabel: 'Court sejour',
      productLineId: '145',
      productLineLabel: 'Affaires',
    })
    expect(visaTypes[0]?.visaVariationList[0]?.label).toBe('Entree unique')
    expect(visaTypes[0]?.visaVariationList[0]?.validationChecklistList[0]?.label).toBe(
      'Liste affaires',
    )
  })

  it('maps Capago submission errors from field_validation_error_description', () => {
    const submissionErrors = mapSubmissionErrors({
      status: 400,
      form_validation_error_list: [
        {
          field_name: 'g-recaptcha-response',
          field_validation_error_description:
            'Merci de valider le reCAPTCHA avant de continuer.',
        },
      ],
    })

    expect(submissionErrors.fieldErrors).toEqual([
      {
        field: 'g-recaptcha-response',
        message: 'Merci de valider le reCAPTCHA avant de continuer.',
      },
    ])
    expect(submissionErrors.rawMessages).toContain(
      'Merci de valider le reCAPTCHA avant de continuer.',
    )
  })

  it('formats live slot timestamps like the official website', () => {
    const slots = mapAvailableSlots(['2026-05-12T08:00:00+00:00'])

    expect(slots).toEqual([
      {
        value: '2026-05-12T08:00:00+00:00',
        rawValue: '2026-05-12T08:00:00+00:00',
        label: '8:00 AM',
      },
    ])
  })

  it('formats slot object labels when the backend echoes raw ISO timestamps', () => {
    const slots = mapAvailableSlots([
      {
        value: '2026-05-12T08:20:00+00:00',
        label: '2026-05-12T08:20:00+00:00',
      },
    ])

    expect(slots).toEqual([
      {
        value: '2026-05-12T08:20:00+00:00',
        rawValue: '2026-05-12T08:20:00+00:00',
        label: '8:20 AM',
      },
    ])
  })

  it('does not duplicate raw JSON bodies when field errors are already present', () => {
    const submissionErrors = mapSubmissionErrors({
      status: 400,
      raw_body:
        '{"error_description":"Form validation error","form_validation_error_list":[{"field_validation_error_description":"Time is not valid","field_name":"time"}]}',
      form_validation_error_list: [
        {
          field_name: 'time',
          field_validation_error_description: 'Time is not valid',
        },
      ],
    })

    expect(submissionErrors.rawMessages).toEqual(['Time is not valid'])
  })

  it('falls back to a readable HTTP error when Capago returns no details', () => {
    const submissionErrors = mapSubmissionErrors({
      status: 400,
      raw_body: '',
    })

    expect(submissionErrors.rawMessages).toEqual([
      'Capago a rejete la requete (HTTP 400) sans fournir de details.',
    ])
  })
})
