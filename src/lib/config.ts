import { z } from 'zod'

export const runtimeConfigSchema = z.object({
  bookingBaseUrl: z.string().url(),
  bookingFrontendUrl: z.string().url(),
  mockMode: z.boolean(),
  defaultLocale: z.enum(['fr', 'en']),
  draftVersion: z.number().int().positive(),
})

export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>

export const DEFAULT_BOOKING_BASE_URL =
  'https://visa-fr-dz.capago.eu/rendezvous_annaba'
export const DEFAULT_BOOKING_FRONTEND_URL = 'https://appointment-anb.capago.eu'

export const DEFAULT_QUEUE_CONDITIONS = [
  'Je confirme que les donnees du demandeur sont exactes.',
  "Je comprends que l'affectation en file d'attente ne garantit pas une date immediate.",
  'Je confirme la verification reCAPTCHA avant la soumission finale.',
]

export const RUNTIME_CONFIG = runtimeConfigSchema.parse({
  bookingBaseUrl:
    import.meta.env.VITE_BOOKING_BASE_URL ?? DEFAULT_BOOKING_BASE_URL,
  bookingFrontendUrl:
    import.meta.env.VITE_BOOKING_FRONTEND_URL ?? DEFAULT_BOOKING_FRONTEND_URL,
  mockMode: import.meta.env.VITE_MOCK_MODE === 'true',
  defaultLocale: import.meta.env.VITE_DEFAULT_LOCALE === 'en' ? 'en' : 'fr',
  draftVersion: 1,
})
