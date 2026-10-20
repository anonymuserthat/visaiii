import { useEffect, useRef, type ReactNode } from 'react'
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  UserRound,
  X,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type {
  BookingFormValues,
  SocialTitle,
  StoredRequestRecord,
  VisaFileVariation,
  VisaTypeItem,
} from '@/lib/api/types'
import {
  formatRequestAgeLabel,
  formatRequestAppointmentSummary,
  formatRequestSubmittedAt,
  getRequestPrimaryLabel,
  getRequestSubmitterLabel,
} from '@/lib/request-records'
import {
  selectProductLines,
  selectStayDurations,
  selectVisaTypes,
} from '@/lib/state/selectors'
import { applyBookingDraftDefaults } from '@/lib/state/defaults'
import { cn, formatAppointmentDateLabel, formatSlotLabel } from '@/lib/utils'

interface RequestRecordDetailsDialogProps {
  record: StoredRequestRecord | null
  open: boolean
  socialTitles?: SocialTitle[]
  visaFileVariations?: VisaFileVariation[]
  visaTypes?: VisaTypeItem[]
  onOpenChange: (open: boolean) => void
}

interface DetailItem {
  label: string
  value: string | null | undefined
  wide?: boolean
}

function valueOrFallback(
  value: string | null | undefined,
  fallback = 'Non renseigné',
) {
  const normalized = value?.trim()
  return normalized ? normalized : fallback
}

function formatFormulaLabel(formula: BookingFormValues['formula']) {
  if (formula === 'premium') {
    return 'Premium'
  }

  if (formula === 'standard') {
    return 'Standard'
  }

  return 'Non définie'
}

function formatDateParts(day: string, month: string, year: string) {
  const parts = [day, month, year].filter(Boolean)
  return parts.length > 0 ? parts.join('/') : ''
}

function formatBoolean(value: boolean) {
  return value ? 'Oui' : 'Non'
}

function formatTitleLabel(value: string, socialTitles: SocialTitle[]) {
  if (!value) {
    return ''
  }

  const matched = socialTitles.find((title) => title.id === value)
  return matched?.shortLabel ?? matched?.label ?? value
}

function formatContactName(
  input: {
    title?: string
    firstname?: string
    lastname?: string
  },
  socialTitles: SocialTitle[],
) {
  return [
    formatTitleLabel(input.title ?? '', socialTitles),
    input.firstname,
    input.lastname,
  ]
    .filter(Boolean)
    .join(' ')
    .trim()
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

function getOptionalServiceRows(values: BookingFormValues): DetailItem[] {
  const optional = values.optionalServices

  return [
    {
      label: 'Prime Time',
      value: optional.primeTimeAppointment ? 'Demande' : 'Non demande',
    },
    {
      label: 'Photos',
      value:
        optional.portrait === 'yes_portrait'
          ? 'Au centre'
          : optional.portrait === 'no_portrait'
            ? 'Photos personnelles'
            : 'Non renseigné',
    },
    {
      label: 'Assurance / relation',
      value:
        optional.relation === 'yes_relation'
          ? 'Rappel demande'
          : optional.relation === 'no_relation'
            ? 'Non souhaite'
            : 'Non renseigné',
    },
    {
      label: 'Passeport',
      value:
        optional.deliveryVisa === 'home_delivery'
          ? 'Livraison'
          : optional.deliveryVisa === 'me_delivery'
            ? 'Retrait au centre'
            : 'Non renseigné',
    },
    {
      label: 'Suivi SMS',
      value: optional.followSms ? 'Active' : 'Non active',
    },
    optional.followSms
      ? {
          label: 'Numéro SMS',
          value: optional.smsMobile,
        }
      : null,
    {
      label: 'Facture',
      value: optional.invoiceEmail ? 'Demandee' : 'Non demandee',
    },
  ].filter(Boolean) as DetailItem[]
}

function getAppointmentRows(
  values: BookingFormValues,
  record: StoredRequestRecord,
) {
  const appointment = values.appointment
  const selectedDate =
    appointment.dateSubmit || appointment.date || record.appointmentDate || ''
  const selectedTime =
    getSelectedAppointmentTimeLabel(values) || record.appointmentTime || ''
  const acceptedQueueConditions = Object.entries(appointment.queueConditions)
    .filter(([, accepted]) => accepted)
    .map(([key]) => key.replaceAll('_', ' '))
    .join(', ')

  return [
    {
      label: 'Mode',
      value: appointment.chooseAppointmentDate
        ? 'Date choisie'
        : "File d'attente",
    },
    {
      label: 'Date',
      value: selectedDate
        ? /^\d{4}-\d{2}-\d{2}/.test(selectedDate)
          ? formatAppointmentDateLabel(selectedDate)
          : selectedDate
        : '',
    },
    {
      label: 'Heure',
      value: selectedTime,
    },
    {
      label: 'Resume',
      value: formatRequestAppointmentSummary(record),
      wide: true,
    },
    {
      label: 'Conditions file',
      value: acceptedQueueConditions,
      wide: true,
    },
    {
      label: 'reCAPTCHA',
      value: appointment.captchaToken ? 'Jeton present' : 'Non enregistré',
    },
  ]
}

function DetailCell({ label, value, wide = false }: DetailItem) {
  return (
    <div
      className={cn(
        'min-w-0 border-b border-border/60 px-1 py-3',
        wide ? 'md:col-span-2' : '',
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-foreground">
        {valueOrFallback(value)}
      </p>
    </div>
  )
}

function DetailSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <section className="detail-section">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon}
        {title}
      </div>
      {children}
    </section>
  )
}

function DetailGrid({ items }: { items: DetailItem[] }) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {items.map((item) => (
        <DetailCell
          key={`${item.label}-${item.value ?? ''}`}
          label={item.label}
          value={item.value}
          wide={item.wide}
        />
      ))}
    </div>
  )
}

export function RequestRecordDetailsDialog({
  record,
  open,
  socialTitles = [],
  visaFileVariations = [],
  visaTypes = [],
  onOpenChange,
}: RequestRecordDetailsDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const previousFocus = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        const items = Array.from(
          panelRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]),a[href],input,select,[tabindex="0"]',
          ) ?? [],
        )
        const first = items[0],
          last = items[items.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
      if (event.key === 'Escape') {
        onOpenChange(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [onOpenChange, open])

  if (!open || !record) {
    return null
  }

  const values = applyBookingDraftDefaults(record.bookingSnapshot)
  const dossierRows: DetailItem[] = [
    { label: 'ID dossier', value: record.id },
    { label: 'Centre', value: record.centerLabel },
    { label: 'Formule', value: formatFormulaLabel(record.formula) },
    {
      label: 'Voyageurs',
      value: String(record.travellerCount || values.travellers.length || 1),
    },
    { label: 'Soumis le', value: formatRequestSubmittedAt(record) },
    { label: 'Age', value: formatRequestAgeLabel(record) },
    { label: 'Statut HTTP', value: String(record.statusCode) },
    {
      label: 'Confirmation',
      value: record.confirmationLocation,
      wide: true,
    },
  ]

  const submitterRows: DetailItem[] = [
    { label: 'Utilisateur', value: getRequestSubmitterLabel(record) },
    { label: 'Email utilisateur', value: record.submitterEmail },
    { label: 'Voyageur principal', value: getRequestPrimaryLabel(record) },
    { label: 'Email principal', value: record.primaryTravellerEmail },
    { label: 'Téléphone principal', value: record.primaryTravellerPhone },
  ]

  const deliveryContactName = formatContactName(
    values.optionalServices.deliveryContact,
    socialTitles,
  )
  const invoice = values.optionalServices.invoiceContact
  const deliveryRows: DetailItem[] =
    values.optionalServices.deliveryVisa === 'home_delivery'
      ? [
          { label: 'Contact livraison', value: deliveryContactName },
          {
            label: 'Adresse livraison',
            value: values.optionalServices.deliveryContact.address,
            wide: true,
          },
          {
            label: 'Code postal',
            value: values.optionalServices.deliveryContact.zip,
          },
          {
            label: 'Ville',
            value: values.optionalServices.deliveryContact.city,
          },
        ]
      : []
  const invoiceRows: DetailItem[] = values.optionalServices.invoiceEmail
    ? [
        { label: 'Societe', value: invoice.society },
        { label: 'TVA', value: invoice.tva },
        { label: 'Adresse facture', value: invoice.address, wide: true },
        { label: 'Code postal', value: invoice.zip },
        { label: 'Ville', value: invoice.city },
      ]
    : []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-3 py-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false)
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-record-details-title"
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-md bg-white shadow-sm"
      >
        <div className="flex flex-col gap-3 border-b border-border/70 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Détails</Badge>
              <Badge variant="secondary">
                {formatFormulaLabel(record.formula)}
              </Badge>
              <Badge variant="outline">{record.centerLabel}</Badge>
            </div>
            <div>
              <h2
                id="request-record-details-title"
                className="text-lg font-semibold text-foreground"
              >
                {getRequestPrimaryLabel(record)}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Soumis le {formatRequestSubmittedAt(record)} par{' '}
                {getRequestSubmitterLabel(record)}
              </p>
            </div>
          </div>
          <Button
            ref={closeButtonRef}
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Fermer les détails"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div
          role="region"
          tabIndex={0}
          aria-label="Contenu du dossier"
          className="space-y-3 overflow-y-auto px-4 py-4"
        >
          <DetailSection
            icon={<ClipboardList className="h-4 w-4 text-primary" />}
            title="Dossier"
          >
            <DetailGrid items={dossierRows} />
          </DetailSection>

          <DetailSection
            icon={<UserRound className="h-4 w-4 text-primary" />}
            title="Utilisateur et contact"
          >
            <DetailGrid items={submitterRows} />
          </DetailSection>

          <DetailSection
            icon={<UserRound className="h-4 w-4 text-primary" />}
            title="Voyageurs et visas"
          >
            <div className="space-y-3">
              {values.travellers.map((traveller, index) => {
                const travellerName =
                  formatContactName(traveller, socialTitles) ||
                  (index === 0
                    ? getRequestPrimaryLabel(record)
                    : `Voyageur ${index + 1}`)
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
                const travellerRows: DetailItem[] = [
                  { label: 'Nom', value: travellerName },
                  {
                    label: 'Naissance',
                    value: formatDateParts(
                      traveller.dayBirth,
                      traveller.monthBirth,
                      traveller.yearBirth,
                    ),
                  },
                  { label: 'Email', value: traveller.email },
                  { label: 'Telephone', value: traveller.phone },
                  { label: 'Passeport', value: traveller.passportNumber },
                  {
                    label: 'Depart',
                    value: formatDateParts(
                      traveller.dayDepartureDate,
                      traveller.monthDepartureDate,
                      traveller.yearDepartureDate,
                    ),
                  },
                  {
                    label: 'Duree visa',
                    value: stayDuration?.label ?? traveller.visaStayDuration,
                  },
                  {
                    label: 'Projet',
                    value: productLine?.label ?? traveller.travelPurpose,
                  },
                  {
                    label: 'Type visa',
                    value: visaType?.label ?? traveller.typeVisa,
                  },
                  {
                    label: 'Variation',
                    value: visaVariation?.label ?? traveller.precision1,
                  },
                  {
                    label: 'Situation',
                    value: checklist?.label ?? traveller.precision2,
                  },
                  {
                    label: 'Categorie',
                    value:
                      visaFileVariation?.label ?? traveller.visaFileVariation,
                  },
                  {
                    label: 'Renouvellement',
                    value: formatBoolean(traveller.renewal),
                  },
                  {
                    label: 'SMS voyageur',
                    value: formatBoolean(traveller.followSms),
                  },
                  {
                    label: 'France-Visas',
                    value: traveller.franceVisasAssistance
                      ? 'Assistance demandee'
                      : 'Non demandee',
                  },
                ]

                return (
                  <div
                    key={traveller.id}
                    className="space-y-2 rounded-lg border border-border/70 bg-white p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
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
                      {traveller.phone ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {traveller.phone}
                        </span>
                      ) : null}
                      {traveller.email ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          {traveller.email}
                        </span>
                      ) : null}
                    </div>
                    <DetailGrid items={travellerRows} />
                  </div>
                )
              })}
            </div>
          </DetailSection>

          <DetailSection
            icon={<MapPin className="h-4 w-4 text-primary" />}
            title="Services et contacts"
          >
            <div className="space-y-3">
              <DetailGrid items={getOptionalServiceRows(values)} />
              {deliveryRows.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Livraison
                  </p>
                  <DetailGrid items={deliveryRows} />
                </div>
              ) : null}
              {invoiceRows.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Facturation
                  </p>
                  <DetailGrid items={invoiceRows} />
                </div>
              ) : null}
            </div>
          </DetailSection>

          <DetailSection
            icon={<CalendarClock className="h-4 w-4 text-primary" />}
            title="Rendez-vous"
          >
            <DetailGrid items={getAppointmentRows(values, record)} />
          </DetailSection>

          <div className="flex flex-wrap items-center gap-2 border-t border-border/70 pt-3">
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Payload sauvegarde: {record.encodedPayload ? 'oui' : 'non'}
            </span>
            {record.confirmationLocation ? (
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <ExternalLink className="h-4 w-4" />
                Confirmation disponible
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
