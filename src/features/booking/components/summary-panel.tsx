import type { ReactNode } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type {
  BookingFormValues,
  CapagoCenter,
  SocialTitle,
  VisaFileVariation,
  VisaTypeItem,
} from '@/lib/api/types'
import { cn, formatAppointmentDateLabel, formatSlotLabel } from '@/lib/utils'
import {
  selectProductLines,
  selectStayDurations,
  selectVisaTypes,
} from '@/lib/state/selectors'

interface SummaryPanelProps {
  values: BookingFormValues
  currentCenter: CapagoCenter | null
  currentStep: 1 | 2 | 3 | 4
  completedSteps: Array<1 | 2 | 3 | 4>
  socialTitles: SocialTitle[]
  visaFileVariations: VisaFileVariation[]
  visaTypes: VisaTypeItem[]
}

function formatFormulaLabel(formula: BookingFormValues['formula']) {
  if (formula === 'premium') {
    return 'Premium'
  }

  if (formula === 'standard') {
    return 'Standard'
  }

  return 'A definir'
}

function formatCompactDate(day: string, month: string, year: string) {
  const parts = [day, month, year].filter(Boolean)
  return parts.length > 0 ? parts.join('/') : ''
}

function findTitleLabel(value: string, socialTitles: SocialTitle[]) {
  if (!value) {
    return ''
  }

  const matched = socialTitles.find((title) => title.id === value)
  return matched?.shortLabel ?? matched?.label ?? value
}

function formatStoredSlotValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)
    ? formatSlotLabel(value)
    : value
}

function getSelectedAppointmentTimeLabel(values: BookingFormValues) {
  if (!values.appointment.time) {
    return ''
  }

  const matchedSlot =
    values.appointment.availableSlots.find(
      (slot) => slot.value === values.appointment.time,
    ) ??
    values.appointment.availableSlots.find(
      (slot) => slot.label === values.appointment.time,
    )

  return matchedSlot?.label ?? formatStoredSlotValue(values.appointment.time)
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[104px_minmax(0,1fr)] sm:gap-3">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  )
}

function ReviewSection({
  badge,
  title,
  children,
}: {
  badge: string
  title: string
  children: ReactNode
}) {
  return (
    <section className="review-section">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="px-2 py-0 text-[11px]">
          {badge}
        </Badge>
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  )
}

export function SummaryPanel({
  values,
  currentCenter,
  currentStep,
  completedSteps,
  socialTitles,
  visaFileVariations,
  visaTypes,
}: SummaryPanelProps) {
  const reachedStep1 = completedSteps.includes(1) || currentStep > 1
  const reachedStep2 = completedSteps.includes(2) || currentStep > 2
  const reachedStep3 = completedSteps.includes(3) || currentStep > 3
  const showAppointmentReview =
    currentStep === 4 &&
    Boolean(
      values.appointment.date ||
      values.appointment.dateSubmit ||
      values.appointment.time ||
      values.appointment.captchaToken,
    )

  const serviceReviewRows = [
    values.optionalServices.portrait === 'yes_portrait'
      ? { label: 'Photos', value: 'Realisees au centre' }
      : values.optionalServices.portrait === 'no_portrait'
        ? { label: 'Photos', value: 'Photos personnelles' }
        : null,
    values.optionalServices.relation === 'yes_relation'
      ? { label: 'Assurance', value: 'Rappel demande' }
      : values.optionalServices.relation === 'no_relation'
        ? { label: 'Assurance', value: 'Non souhaite' }
        : null,
    values.optionalServices.deliveryVisa === 'home_delivery'
      ? { label: 'Passeport', value: 'Livraison a domicile ou au travail' }
      : values.optionalServices.deliveryVisa === 'me_delivery'
        ? { label: 'Passeport', value: 'Retrait au centre' }
        : null,
    {
      label: 'Suivi SMS',
      value: values.optionalServices.followSms ? 'Active' : 'Non active',
    },
    values.optionalServices.primeTimeAppointment
      ? { label: 'Prime Time', value: 'Demande' }
      : null,
    {
      label: 'Facture',
      value: values.optionalServices.invoiceEmail ? 'Demandee' : 'Non demandee',
    },
  ].filter(Boolean) as Array<{ label: string; value: string }>

  return (
    <Card className="sticky top-3 overflow-hidden border-border/60 bg-white">
      <CardHeader className="pb-1">
        <CardTitle>Vérification du dossier</CardTitle>
        <CardDescription>
          Les informations déjà validées s'ajoutent ici au fil des étapes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {reachedStep1 ? (
          <ReviewSection badge="Étape 1" title="Centre et formule">
            <div className="grid gap-2">
              <div className="flex items-start gap-2.5 text-sm text-foreground">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">
                    {currentCenter?.label || 'Centre non sélectionné'}
                  </p>
                  <p className="text-muted-foreground">
                    {values.nbTravellers} voyageur
                    {values.nbTravellers > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <ReviewRow
                label="Formule"
                value={formatFormulaLabel(values.formula)}
              />
              <ReviewRow
                label="Conditions"
                value={values.cgv ? 'Acceptees' : 'En attente'}
              />
            </div>
          </ReviewSection>
        ) : null}

        {reachedStep2 ? (
          <ReviewSection badge="Étape 2" title="Demandeur et visa">
            <div className="space-y-3">
              {values.travellers.map((traveller, index) => {
                const stayDuration = selectStayDurations(visaTypes).find(
                  (item) => item.id === traveller.visaStayDuration,
                )
                const productLine = selectProductLines(
                  visaTypes,
                  traveller.visaStayDuration,
                ).find((item) => item.id === traveller.travelPurpose)
                const visaType = selectVisaTypes(
                  visaTypes,
                  traveller.visaStayDuration,
                  traveller.travelPurpose,
                ).find((item) => item.id === traveller.typeVisa)
                const visaVariation = visaType?.visaVariationList.find(
                  (variation) => variation.id === traveller.precision1,
                )
                const checklist = visaVariation?.validationChecklistList.find(
                  (item) => item.id === traveller.precision2,
                )
                const visaFileVariation = visaFileVariations.find(
                  (item) => item.id === traveller.visaFileVariation,
                )
                const travellerName = [
                  findTitleLabel(traveller.title, socialTitles),
                  traveller.firstname,
                  traveller.lastname,
                ]
                  .filter(Boolean)
                  .join(' ')
                const reviewRows = [
                  travellerName
                    ? { label: 'Identite', value: travellerName }
                    : null,
                  formatCompactDate(
                    traveller.dayBirth,
                    traveller.monthBirth,
                    traveller.yearBirth,
                  )
                    ? {
                        label: 'Naissance',
                        value: formatCompactDate(
                          traveller.dayBirth,
                          traveller.monthBirth,
                          traveller.yearBirth,
                        ),
                      }
                    : null,
                  traveller.passportNumber
                    ? { label: 'Passeport', value: traveller.passportNumber }
                    : null,
                  formatCompactDate(
                    traveller.dayDepartureDate,
                    traveller.monthDepartureDate,
                    traveller.yearDepartureDate,
                  )
                    ? {
                        label: 'Depart',
                        value: formatCompactDate(
                          traveller.dayDepartureDate,
                          traveller.monthDepartureDate,
                          traveller.yearDepartureDate,
                        ),
                      }
                    : null,
                  stayDuration?.label
                    ? { label: 'Duree', value: stayDuration.label }
                    : null,
                  productLine?.label
                    ? { label: 'Projet', value: productLine.label }
                    : null,
                  visaType?.label
                    ? { label: 'Motif', value: visaType.label }
                    : null,
                  visaVariation?.label
                    ? { label: 'Variation', value: visaVariation.label }
                    : null,
                  checklist?.label
                    ? { label: 'Situation', value: checklist.label }
                    : null,
                  visaFileVariation?.label
                    ? { label: 'Categorie', value: visaFileVariation.label }
                    : null,
                  traveller.franceVisasAssistance
                    ? { label: 'France-Visas', value: 'Assistance demandee' }
                    : null,
                ].filter(Boolean) as Array<{ label: string; value: string }>

                return (
                  <div
                    key={traveller.id}
                    className={cn(
                      'space-y-2 rounded-lg border border-border/50 bg-white px-3 py-3',
                      index > 0 ? 'mt-1' : '',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        Voyageur {index + 1}
                      </p>
                      {index === 0 ? (
                        <Badge
                          variant="secondary"
                          className="px-2 py-0 text-[11px]"
                        >
                          Principal
                        </Badge>
                      ) : null}
                    </div>

                    {reviewRows.length > 0 ? (
                      <div className="space-y-2">
                        {reviewRows.map((row) => (
                          <ReviewRow
                            key={`${traveller.id}-${row.label}`}
                            label={row.label}
                            value={row.value}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Les informations du voyageur apparaitront ici apres
                        validation.
                      </p>
                    )}

                    {index === 0 && (traveller.email || traveller.phone) ? (
                      <div className="flex flex-wrap gap-3 border-t border-border/60 pt-2 text-sm text-muted-foreground">
                        {traveller.email ? (
                          <span className="inline-flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {traveller.email}
                          </span>
                        ) : null}
                        {traveller.phone ? (
                          <span className="inline-flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {traveller.phone}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </ReviewSection>
        ) : null}

        {reachedStep3 ? (
          <ReviewSection badge="Étape 3" title="Services choisis">
            {serviceReviewRows.length > 0 ? (
              <div className="space-y-2">
                {serviceReviewRows.map((row) => (
                  <ReviewRow
                    key={row.label}
                    label={row.label}
                    value={row.value}
                  />
                ))}
                {values.optionalServices.followSms &&
                values.optionalServices.smsMobile ? (
                  <ReviewRow
                    label="Numéro SMS"
                    value={values.optionalServices.smsMobile}
                  />
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Les choix de service apparaitront ici apres cette étape.
              </p>
            )}
          </ReviewSection>
        ) : null}

        {showAppointmentReview ? (
          <ReviewSection badge="Étape 4" title="Rendez-vous">
            <div className="space-y-2">
              <div className="flex items-start gap-2.5 text-sm text-foreground">
                <CalendarDays className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">
                    {values.appointment.chooseAppointmentDate
                      ? values.appointment.dateSubmit
                        ? formatAppointmentDateLabel(
                            values.appointment.dateSubmit,
                          )
                        : values.appointment.date || 'Date non sélectionnée'
                      : "Mode file d'attente"}
                  </p>
                  <p className="text-muted-foreground">
                    {values.appointment.chooseAppointmentDate
                      ? getSelectedAppointmentTimeLabel(values) ||
                        'Heure non sélectionnée'
                      : 'Soumission sans choix de date'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-foreground">
                <CheckCircle2
                  className={cn(
                    'mt-0.5 h-4 w-4',
                    values.appointment.captchaToken
                      ? 'text-emerald-600'
                      : 'text-slate-400',
                  )}
                />
                <div>
                  <p className="font-medium">
                    {values.appointment.captchaToken
                      ? 'Vérification complétée'
                      : 'Vérification en attente'}
                  </p>
                  <p className="text-muted-foreground">
                    {values.appointment.captchaToken
                      ? 'Le jeton manuel est prêt pour la soumission.'
                      : 'Passez la vérification avant la soumission finale.'}
                  </p>
                </div>
              </div>
            </div>
          </ReviewSection>
        ) : null}

        {!reachedStep1 ? (
          <div className="rounded-md bg-slate-50/70 px-3 py-4 text-sm text-muted-foreground">
            Le resume commencera a se remplir apres validation de la premiere
            étape.
          </div>
        ) : null}

        <div className="rounded-md border border-dashed border-border/70 px-3 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <ClipboardList className="h-4 w-4 text-primary" />
            Relecture rapide
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Vérifiez les informations avant chaque envoi. Les disponibilités et
            la vérification doivent être renouvelées pour une nouvelle demande.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
