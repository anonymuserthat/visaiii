import type { RuntimeConfig } from '@/lib/config'

export type Locale = RuntimeConfig['defaultLocale']

const messages = {
  fr: {
    appTitle: 'Assistant de rendez-vous visa',
    appSubtitle:
      'Un espace clair pour préparer votre dossier Capago et effectuer la vérification humaine requise.',
    centers: 'Centres disponibles',
    setup: 'Configuration',
    travellers: 'Voyageurs',
    services: 'Services',
    appointment: 'Rendez-vous',
    summary: 'Récapitulatif en direct',
    draftSaved: 'Brouillon enregistré localement',
    networkError: 'Une erreur réseau est survenue.',
    serverErrors: 'Messages serveur',
    terms: "J'accepte les conditions générales",
    premium: 'Premium',
    standard: 'Standard',
    next: 'Continuer',
    previous: 'Retour',
    submit: 'Soumettre la demande',
    queueMode: "Mise en file d'attente",
    manualCaptcha: 'Vérification reCAPTCHA manuelle',
    success: 'Demande envoyée',
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
