import type { FieldPath } from 'react-hook-form'
import { z } from 'zod'

import type {
  BookingFormValues,
  Formula,
  GlobalParams,
  ServiceItem,
} from '@/lib/api/types'

export interface ServiceVisibility {
  portrait: boolean
  insurance: boolean
  delivery: boolean
  sms: boolean
  invoice: boolean
  franceVisas: boolean
  primeTime: boolean
}

export interface BookingSchemaContext {
  globalParams: GlobalParams | null
  services: ServiceItem[]
  formula: Formula | ''
  captchaRequired?: boolean
}

const travellerSchema = z.object({
  id: z.string(),
  title: z.string(),
  lastname: z.string(),
  firstname: z.string(),
  dayBirth: z.string(),
  monthBirth: z.string(),
  yearBirth: z.string(),
  phone: z.string(),
  email: z.string(),
  emailConfirm: z.string(),
  passportNumber: z.string(),
  dayDepartureDate: z.string(),
  monthDepartureDate: z.string(),
  yearDepartureDate: z.string(),
  visaStayDuration: z.string(),
  travelPurpose: z.string(),
  typeVisa: z.string(),
  precision1: z.string(),
  precision2: z.string(),
  visaFileVariation: z.string(),
  renewal: z.boolean(),
  followSms: z.boolean(),
  franceVisasAssistance: z.boolean(),
})

const bookingSchemaBase = z.object({
  nbTravellers: z.number().int(),
  cgv: z.boolean(),
  area: z.string(),
  formula: z.union([z.literal('standard'), z.literal('premium'), z.literal('')]),
  travellers: z.array(travellerSchema),
  optionalServices: z.object({
    portrait: z.union([
      z.literal(''),
      z.literal('yes_portrait'),
      z.literal('no_portrait'),
    ]),
    relation: z.union([
      z.literal(''),
      z.literal('yes_relation'),
      z.literal('no_relation'),
    ]),
    deliveryVisa: z.union([
      z.literal(''),
      z.literal('home_delivery'),
      z.literal('me_delivery'),
    ]),
    deliveryContact: z.object({
      title: z.string(),
      lastname: z.string(),
      firstname: z.string(),
      address: z.string(),
      zip: z.string(),
      city: z.string(),
    }),
    followSms: z.boolean(),
    smsMobile: z.string(),
    invoiceEmail: z.boolean(),
    invoiceContact: z.object({
      society: z.string(),
      tva: z.string(),
      address: z.string(),
      zip: z.string(),
      city: z.string(),
    }),
    primeTimeAppointment: z.boolean(),
  }),
  appointment: z.object({
    date: z.string(),
    dateSubmit: z.string(),
    time: z.string(),
    captchaToken: z.string(),
    chooseAppointmentDate: z.boolean(),
    queueConditions: z.record(z.string(), z.boolean()),
    availableSlots: z.array(
      z.object({
        value: z.string(),
        label: z.string(),
        rawValue: z.string(),
      }),
    ),
    unavailableDayList: z.array(z.string()),
  }),
})

function addIssue(
  ctx: z.RefinementCtx,
  path: (string | number)[],
  message: string,
) {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message,
    path,
  })
}

function validateRequired(
  ctx: z.RefinementCtx,
  value: string,
  path: (string | number)[],
  message: string,
) {
  if (!value.trim()) {
    addIssue(ctx, path, message)
  }
}

function isValidCalendarDate(day: string, month: string, year: string) {
  const parsedDay = Number.parseInt(day, 10)
  const parsedMonth = Number.parseInt(month, 10)
  const parsedYear = Number.parseInt(year, 10)

  if (
    !Number.isInteger(parsedDay) ||
    !Number.isInteger(parsedMonth) ||
    !Number.isInteger(parsedYear)
  ) {
    return false
  }

  const date = new Date(Date.UTC(parsedYear, parsedMonth - 1, parsedDay))

  return (
    date.getUTCFullYear() === parsedYear &&
    date.getUTCMonth() === parsedMonth - 1 &&
    date.getUTCDate() === parsedDay
  )
}

export function getServiceVisibility(
  services: ServiceItem[],
  formula: Formula | '',
): ServiceVisibility {
  const visibleServices = services.filter((service) =>
    formula ? service.formulas.includes(formula) : true,
  )

  const hasCategory = (category: ServiceItem['category']) =>
    visibleServices.some((service) => service.category === category)

  return {
    portrait: hasCategory('portrait'),
    insurance: hasCategory('insurance'),
    delivery: hasCategory('delivery'),
    sms: hasCategory('sms'),
    invoice: hasCategory('invoice'),
    franceVisas: hasCategory('france_visas'),
    primeTime: hasCategory('prime_time'),
  }
}

export function createBookingSchema(context: BookingSchemaContext) {
  const visibility = getServiceVisibility(context.services, context.formula)
  const maxTravellers = context.globalParams?.maxTravellersPerGroup ?? 6
  const phoneRegexSource =
    context.globalParams?.phoneNumberRegex || '^(0|\\+213)[0-9]{9}$'
  const phoneRegex = new RegExp(phoneRegexSource)

  return bookingSchemaBase.superRefine((values, ctx) => {
    if (!Number.isFinite(values.nbTravellers)) {
      addIssue(ctx, ['nbTravellers'], 'Le nombre de voyageurs est requis.')
    }

    if (values.nbTravellers < 1 || values.nbTravellers > maxTravellers) {
      addIssue(
        ctx,
        ['nbTravellers'],
        `Le nombre de voyageurs doit etre compris entre 1 et ${maxTravellers}.`,
      )
    }

    if (!values.cgv) {
      addIssue(ctx, ['cgv'], 'Les conditions generales doivent etre acceptees.')
    }

    validateRequired(ctx, values.area, ['area'], 'Selectionnez un centre.')
    validateRequired(ctx, values.formula, ['formula'], 'Selectionnez une formule.')

    if (values.travellers.length !== values.nbTravellers) {
      addIssue(
        ctx,
        ['travellers'],
        'Le nombre de fiches voyageurs doit correspondre au total selectionne.',
      )
    }

    values.travellers.forEach((traveller, index) => {
      const prefix = ['travellers', index] as const
      const requiredFields: Array<
        [
          | 'title'
          | 'lastname'
          | 'firstname'
          | 'dayBirth'
          | 'monthBirth'
          | 'yearBirth'
          | 'passportNumber'
          | 'dayDepartureDate'
          | 'monthDepartureDate'
          | 'yearDepartureDate'
          | 'visaStayDuration'
          | 'travelPurpose'
          | 'typeVisa'
          | 'precision1'
          | 'precision2',
          string,
        ]
      > = [
        ['title', 'Le titre est requis.'],
        ['lastname', 'Le nom est requis.'],
        ['firstname', 'Le prenom est requis.'],
        ['dayBirth', 'Le jour de naissance est requis.'],
        ['monthBirth', 'Le mois de naissance est requis.'],
        ['yearBirth', "L'annee de naissance est requise."],
        ['passportNumber', 'Le numero de passeport est requis.'],
        ['dayDepartureDate', 'Le jour de depart est requis.'],
        ['monthDepartureDate', 'Le mois de depart est requis.'],
        ['yearDepartureDate', "L'annee de depart est requise."],
        ['visaStayDuration', 'Le type de visa demande est requis.'],
        ['travelPurpose', 'Le projet de voyage est requis.'],
        ['typeVisa', 'Le motif principal du sejour est requis.'],
        ['precision1', 'La variation de visa est requise.'],
        ['precision2', 'La situation du demandeur est requise.'],
      ]

      requiredFields.forEach(([field, message]) =>
        validateRequired(ctx, traveller[field], [...prefix, field], message),
      )

      if (index === 0) {
        validateRequired(
          ctx,
          traveller.phone,
          [...prefix, 'phone'],
          'Le telephone est requis pour le voyageur principal.',
        )
        validateRequired(
          ctx,
          traveller.email,
          [...prefix, 'email'],
          "L'email est requis pour le voyageur principal.",
        )
        validateRequired(
          ctx,
          traveller.emailConfirm,
          [...prefix, 'emailConfirm'],
          "La confirmation d'email est requise.",
        )
      }

      if (traveller.phone && !phoneRegex.test(traveller.phone)) {
        addIssue(
          ctx,
          [...prefix, 'phone'],
          'Le format du telephone ne correspond pas au format attendu.',
        )
      }

      if (
        traveller.email &&
        !z.string().email().safeParse(traveller.email).success
      ) {
        addIssue(ctx, [...prefix, 'email'], "L'email n'est pas valide.")
      }

      if (
        traveller.emailConfirm &&
        !z.string().email().safeParse(traveller.emailConfirm).success
      ) {
        addIssue(
          ctx,
          [...prefix, 'emailConfirm'],
          "L'email de confirmation n'est pas valide.",
        )
      }

      if (traveller.email !== traveller.emailConfirm) {
        addIssue(
          ctx,
          [...prefix, 'emailConfirm'],
          'Les adresses email doivent correspondre.',
        )
      }

      if (
        traveller.passportNumber &&
        !/^[a-zA-Z0-9]+$/.test(traveller.passportNumber)
      ) {
        addIssue(
          ctx,
          [...prefix, 'passportNumber'],
          'Le passeport doit etre alphanumerique.',
        )
      }

      if (
        traveller.dayBirth &&
        traveller.monthBirth &&
        traveller.yearBirth &&
        !isValidCalendarDate(
          traveller.dayBirth,
          traveller.monthBirth,
          traveller.yearBirth,
        )
      ) {
        addIssue(
          ctx,
          [...prefix, 'dayBirth'],
          'La date de naissance est invalide.',
        )
      }

      if (
        traveller.dayDepartureDate &&
        traveller.monthDepartureDate &&
        traveller.yearDepartureDate &&
        !isValidCalendarDate(
          traveller.dayDepartureDate,
          traveller.monthDepartureDate,
          traveller.yearDepartureDate,
        )
      ) {
        addIssue(
          ctx,
          [...prefix, 'dayDepartureDate'],
          'La date de depart est invalide.',
        )
      }
    })

    if (visibility.portrait && !values.optionalServices.portrait) {
      addIssue(
        ctx,
        ['optionalServices', 'portrait'],
        'Selectionnez une option photo.',
      )
    }

    if (visibility.insurance && !values.optionalServices.relation) {
      addIssue(
        ctx,
        ['optionalServices', 'relation'],
        "Selectionnez l'option d'assurance.",
      )
    }

    if (visibility.delivery && !values.optionalServices.deliveryVisa) {
      addIssue(
        ctx,
        ['optionalServices', 'deliveryVisa'],
        'Selectionnez le mode de livraison.',
      )
    }

    if (values.optionalServices.deliveryVisa === 'home_delivery') {
      ;(
        [
          ['title', 'Le titre du contact de livraison est requis.'],
          ['lastname', 'Le nom du contact de livraison est requis.'],
          ['firstname', 'Le prenom du contact de livraison est requis.'],
          ['address', "L'adresse de livraison est requise."],
          ['zip', 'Le code postal de livraison est requis.'],
          ['city', 'La ville de livraison est requise.'],
        ] as const
      ).forEach(([field, message]) =>
        validateRequired(
          ctx,
          values.optionalServices.deliveryContact[field],
          ['optionalServices', 'deliveryContact', field],
          message,
        ),
      )
    }

    if (values.optionalServices.followSms && !values.optionalServices.smsMobile) {
      addIssue(
        ctx,
        ['optionalServices', 'smsMobile'],
        'Le numero SMS est requis.',
      )
    }

    if (values.optionalServices.invoiceEmail) {
      ;(
        [
          ['society', 'La societe de facturation est requise.'],
          ['tva', 'Le numero de TVA est requis.'],
          ['address', "L'adresse de facturation est requise."],
          ['zip', 'Le code postal de facturation est requis.'],
          ['city', 'La ville de facturation est requise.'],
        ] as const
      ).forEach(([field, message]) =>
        validateRequired(
          ctx,
          values.optionalServices.invoiceContact[field],
          ['optionalServices', 'invoiceContact', field],
          message,
        ),
      )
    }

    if (values.appointment.chooseAppointmentDate) {
      validateRequired(
        ctx,
        values.appointment.date,
        ['appointment', 'date'],
        'Selectionnez une date.',
      )
      validateRequired(
        ctx,
        values.appointment.time,
        ['appointment', 'time'],
        'Selectionnez un horaire.',
      )
    } else {
      Object.entries(values.appointment.queueConditions).forEach(
        ([condition, accepted]) => {
          if (!accepted) {
            addIssue(
              ctx,
              ['appointment', 'queueConditions', condition],
              'Toutes les conditions de file doivent etre acceptees.',
            )
          }
        },
      )
    }

    if (context.captchaRequired !== false) validateRequired(
      ctx,
      values.appointment.captchaToken,
      ['appointment', 'captchaToken'],
      'La verification reCAPTCHA est requise.',
    )
  })
}

export function getStepFieldPaths(
  step: 1 | 2 | 3 | 4,
  values: BookingFormValues,
  services: ServiceItem[],
): FieldPath<BookingFormValues>[] {
  const visibility = getServiceVisibility(services, values.formula)

  const step1: FieldPath<BookingFormValues>[] = [
    'nbTravellers',
    'cgv',
    'area',
    'formula',
  ]

  const step2 = values.travellers.flatMap((_, index) => {
    const base = `travellers.${index}` as const
    const fields: FieldPath<BookingFormValues>[] = [
      `${base}.title`,
      `${base}.lastname`,
      `${base}.firstname`,
      `${base}.dayBirth`,
      `${base}.monthBirth`,
      `${base}.yearBirth`,
      `${base}.passportNumber`,
      `${base}.dayDepartureDate`,
      `${base}.monthDepartureDate`,
      `${base}.yearDepartureDate`,
      `${base}.visaStayDuration`,
      `${base}.travelPurpose`,
      `${base}.typeVisa`,
      `${base}.precision1`,
      `${base}.precision2`,
      `${base}.visaFileVariation`,
    ]

    if (index === 0) {
      fields.push(`${base}.phone`, `${base}.email`, `${base}.emailConfirm`)
    }

    return fields
  })

  const step3: FieldPath<BookingFormValues>[] = []
  if (visibility.portrait) step3.push('optionalServices.portrait')
  if (visibility.insurance) step3.push('optionalServices.relation')
  if (visibility.delivery) step3.push('optionalServices.deliveryVisa')
  if (values.optionalServices.deliveryVisa === 'home_delivery') {
    step3.push(
      'optionalServices.deliveryContact.title',
      'optionalServices.deliveryContact.lastname',
      'optionalServices.deliveryContact.firstname',
      'optionalServices.deliveryContact.address',
      'optionalServices.deliveryContact.zip',
      'optionalServices.deliveryContact.city',
    )
  }
  if (values.optionalServices.followSms) {
    step3.push('optionalServices.smsMobile')
  }
  if (values.optionalServices.invoiceEmail) {
    step3.push(
      'optionalServices.invoiceContact.society',
      'optionalServices.invoiceContact.tva',
      'optionalServices.invoiceContact.address',
      'optionalServices.invoiceContact.zip',
      'optionalServices.invoiceContact.city',
    )
  }

  const step4: FieldPath<BookingFormValues>[] = ['appointment.captchaToken']
  if (values.appointment.chooseAppointmentDate) {
    step4.push('appointment.date', 'appointment.time')
  } else {
    Object.keys(values.appointment.queueConditions).forEach((condition) => {
      step4.push(`appointment.queueConditions.${condition}`)
    })
  }

  switch (step) {
    case 1:
      return step1
    case 2:
      return step2
    case 3:
      return step3
    case 4:
      return step4
    default:
      return step1
  }
}
