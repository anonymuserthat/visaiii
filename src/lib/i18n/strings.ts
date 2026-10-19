import type { RuntimeConfig } from '@/lib/config'

export type Locale = RuntimeConfig['defaultLocale']

const messages = {
  fr: {
    appTitle: 'Assistant de rendez-vous visa',
    appSubtitle:
      'Une experience plus lisible pour preparer votre dossier Capago sans contourner la verification humaine.',
    centers: 'Centres disponibles',
    setup: 'Configuration',
    travellers: 'Voyageurs',
    services: 'Services',
    appointment: 'Rendez-vous',
    summary: 'Recapitulatif en direct',
    draftSaved: 'Brouillon enregistre localement',
    networkError: 'Une erreur reseau est survenue.',
    serverErrors: 'Messages serveur',
    terms: "J'accepte les conditions generales",
    premium: 'Premium',
    standard: 'Standard',
    next: 'Continuer',
    previous: 'Retour',
    submit: 'Soumettre la demande',
    queueMode: "Mise en file d'attente",
    manualCaptcha: 'Verification reCAPTCHA manuelle',
    success: 'Demande envoyee',
  },
  en: {
    appTitle: 'Visa appointment assistant',
    appSubtitle:
      'A clearer Capago booking experience that preserves the required human verification step.',
    centers: 'Available centers',
    setup: 'Setup',
    travellers: 'Travellers',
    services: 'Services',
    appointment: 'Appointment',
    summary: 'Live summary',
    draftSaved: 'Draft saved locally',
    networkError: 'A network error occurred.',
    serverErrors: 'Server messages',
    terms: 'I accept the terms and conditions',
    premium: 'Premium',
    standard: 'Standard',
    next: 'Continue',
    previous: 'Back',
    submit: 'Submit booking',
    queueMode: 'Queue mode',
    manualCaptcha: 'Manual reCAPTCHA verification',
    success: 'Booking sent',
  },
} as const

export function getMessages(locale: Locale) {
  return messages[locale]
}
