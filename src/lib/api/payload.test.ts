import { describe, expect, it } from 'vitest'

import {
  buildBookingPayload,
  buildVisaFileList,
  findTravelProjectRelativeUrl,
} from '@/lib/api/payload'
import { createEmptyBookingDraft } from '@/lib/state/defaults'

describe('buildBookingPayload', () => {
  it('serializes queue mode and traveller defaults with captured field names', () => {
    const values = createEmptyBookingDraft()
    values.area = 'capago_CZL'
    values.formula = 'premium'
    values.cgv = true
    values.travellers[0] = {
      ...values.travellers[0],
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
      travelPurpose: 'business',
      typeVisa: 'czl_short_business',
      precision1: 'business_express',
      precision2: 'business_letter',
      visaFileVariation: '',
      renewal: false,
      followSms: false,
    }
    values.optionalServices.followSms = true
    values.optionalServices.smsMobile = '0555123456'
    values.appointment.chooseAppointmentDate = false
    values.appointment.captchaToken = 'manual-token'

    const payload = buildBookingPayload(values, 'session-123')

    expect(payload.fields.session_id).toBe('session-123')
    expect(payload.fields.area).toBe('capago_CZL')
    expect(payload.fields.date).toBe('Chargement...')
    expect(payload.fields.date_submit).toBe('')
    expect(payload.fields['g-recaptcha-response']).toBe('manual-token')
    expect(payload.fields.captcha).toBe('manual-token')
    expect(payload.fields.visa_file_variation_traveller_1).toBe('primo_demand')
    expect(payload.fields.renewal_traveller_1).toBe('off')
    expect(payload.fields.follow_sms).toBe('follow_sms')
    expect(payload.encoded).toContain('area=capago_CZL')
    expect(payload.encoded).toContain('g-recaptcha-response=manual-token')
  })

  it('builds the live calendar visa_file_list payload shape', () => {
    const values = createEmptyBookingDraft()
    values.travellers[0] = {
      ...values.travellers[0],
      typeVisa: '013-145AB4',
      precision1: '1',
      visaFileVariation: '',
      renewal: false,
    }

    expect(JSON.parse(buildVisaFileList(values))).toEqual([
      {
        resource_id: '013-145AB4',
        variation_id: '1',
        visa_file_variation: 'primo_demand',
      },
    ])
  })

  it('submits the selected appointment time using the displayed slot label', () => {
    const values = createEmptyBookingDraft()
    values.area = 'capago_ANB'
    values.formula = 'standard'
    values.cgv = true
    values.appointment.chooseAppointmentDate = true
    values.appointment.date = '06 Mai 2026'
    values.appointment.dateSubmit = '2026-05-06'
    values.appointment.time = '9:00 AM'
    values.appointment.captchaToken = 'manual-token'

    const payload = buildBookingPayload(values, 'session-123')

    expect(payload.fields.date).toBe('06 Mai 2026')
    expect(payload.fields.date_submit).toBe('2026-05-06')
    expect(payload.fields.time).toBe('9:00 AM')
    expect(payload.encoded).toContain('time=9%3A00+AM')
  })

  it('serializes the updated package-list fields for selected paid services', () => {
    const values = createEmptyBookingDraft()
    values.nbTravellers = 1
    values.optionalServices.primeTimeAppointment = true
    values.optionalServices.deliveryVisa = 'home_delivery'
    values.optionalServices.portrait = 'yes_portrait'
    values.travellers[0] = {
      ...values.travellers[0],
      franceVisasAssistance: true,
    }

    const payload = buildBookingPayload(values, 'session-123', [
      {
        id: 'prime',
        code: 'PACK-PTA',
        name: 'Prime Time Appointment Package',
        description: null,
        price: 5300,
        currencyCode: 'DZD',
        category: 'prime_time',
        isMandatory: false,
        isIncludedInPremium: false,
        formulas: ['standard', 'premium'],
        travellerScoped: false,
      },
      {
        id: 'delivery',
        code: 'PACK-DEL-DZ',
        name: 'Service de liaison Capago',
        description: null,
        price: 0,
        currencyCode: 'DZD',
        category: 'delivery',
        isMandatory: false,
        isIncludedInPremium: false,
        formulas: ['standard', 'premium'],
        travellerScoped: false,
      },
      {
        id: 'assistance',
        code: 'PACK-AFV',
        name: 'Assistance France-Visa Package',
        description: null,
        price: 1800,
        currencyCode: 'DZD',
        category: 'france_visas',
        isMandatory: false,
        isIncludedInPremium: false,
        formulas: ['standard', 'premium'],
        travellerScoped: true,
      },
      {
        id: 'photo',
        code: 'PACK-ID-PHOTO',
        name: 'ID-Photo Package',
        description: null,
        price: 750,
        currencyCode: 'DZD',
        category: 'portrait',
        isMandatory: false,
        isIncludedInPremium: false,
        formulas: ['standard', 'premium'],
        travellerScoped: true,
      },
    ])

    expect(JSON.parse(payload.fields.tp_package_list)).toEqual([
      { quantity: 1, service: 'PACK-PTA' },
      { quantity: 1, service: 'PACK-DEL-DZ' },
    ])
    expect(JSON.parse(payload.fields.vf_package_list_traveller_1)).toEqual([
      { quantity: 1, service: 'PACK-AFV' },
      { quantity: 1, service: 'PACK-ID-PHOTO' },
    ])
  })

  it('resolves the selected travel project relative url from the primary traveller', () => {
    const values = createEmptyBookingDraft()
    values.travellers[0] = {
      ...values.travellers[0],
      visaStayDuration: 'short_stay',
      travelPurpose: 'tourism',
      typeVisa: 'tourism_short',
    }

    expect(
      findTravelProjectRelativeUrl(values, [
        {
          id: 'tourism_short',
          label: 'Court sejour tourisme',
          visaStayDurationId: 'short_stay',
          visaStayDurationLabel: 'Court sejour',
          productLineId: 'tourism',
          productLineLabel: 'Tourisme',
          travelProjectRelativeUrl: '/tourism-short-stay',
          legacyRenewalSupported: true,
          visaVariationList: [],
          visaFileVariationRequired: true,
        },
      ]),
    ).toBe('/tourism-short-stay')
  })
})
