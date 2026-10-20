import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormSetValue,
} from 'react-hook-form'
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  LoaderCircle,
  ShieldAlert,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import type { AvailabilityResponse, BookingFormValues } from '@/lib/api/types'
import { CalendarGrid } from '@/features/booking/components/calendar-grid'
import { FormField } from '@/features/booking/components/form-field'
import { createConditionKey, formatAppointmentDateLabel } from '@/lib/utils'

interface Step4AppointmentProps {
  control: Control<BookingFormValues>
  errors: FieldErrors<BookingFormValues>
  values: BookingFormValues
  availability: AvailabilityResponse | null
  availabilityRequested: boolean
  availabilityError: string | null
  slotsError: string | null
  slotsLoading: boolean
  availabilityLoading: boolean
  onOpenVerification: () => void
  setValue: UseFormSetValue<BookingFormValues>
  verificationOpening: boolean
  automaticCaptcha: boolean
  solvingCaptcha: boolean
  submitting: boolean
}

function appointmentError(
  errors: FieldErrors<BookingFormValues>,
  field: keyof BookingFormValues['appointment'],
) {
  return errors.appointment?.[field]?.message?.toString()
}

export function Step4Appointment({
  control,
  errors,
  values,
  availability,
  availabilityRequested,
  availabilityError,
  slotsError,
  slotsLoading,
  availabilityLoading,
  onOpenVerification,
  setValue,
  verificationOpening,
  automaticCaptcha,
  solvingCaptcha,
  submitting,
}: Step4AppointmentProps) {
  const queueConditionErrors = errors.appointment?.queueConditions
  const queueConditionBlocked = Boolean(
    queueConditionErrors && Object.keys(queueConditionErrors).length > 0,
  )
  const captchaReady = Boolean(values.appointment.captchaToken.trim())
  const captchaError = appointmentError(errors, 'captchaToken')
  const verificationButtonLabel = verificationOpening
    ? 'Ouverture...'
    : captchaReady
      ? 'Repasser la vérification'
      : "Ouvrir la vérification dans l'app"
  const showChooseAppointmentBranch = Boolean(
    availability && values.appointment.chooseAppointmentDate,
  )
  const showQueueBranch = Boolean(
    availability && !values.appointment.chooseAppointmentDate,
  )
  const showTimePanel = Boolean(
    values.appointment.dateSubmit ||
    slotsLoading ||
    slotsError ||
    values.appointment.availableSlots.length > 0,
  )
  const slotStatusMessage = (() => {
    if (!values.appointment.dateSubmit) {
      return ''
    }

    if (slotsError) {
      return slotsError
    }

    return 'Aucun créneau horaire disponible a cette date.'
  })()
  const selectedSlot =
    values.appointment.availableSlots.find(
      (slot) => slot.label === values.appointment.time,
    ) ??
    values.appointment.availableSlots.find(
      (slot) => slot.value === values.appointment.time,
    ) ??
    null
  const slotOptions = values.appointment.availableSlots.map((slot) => ({
    value: slot.label,
    label: slot.label,
  }))
  const slotCountLabel = `${values.appointment.availableSlots.length} creneau${
    values.appointment.availableSlots.length > 1 ? 'x' : ''
  } disponible${values.appointment.availableSlots.length > 1 ? 's' : ''}`

  return (
    <div className="appointment-workspace">
      <Card>
        <CardHeader>
          <CardTitle>Rendez-vous et vérification</CardTitle>
          <p className="text-sm text-muted-foreground">
            Vérifiez le mode de rendez-vous, puis terminez la vérification avant
            l’envoi.
          </p>
        </CardHeader>
        <CardContent className="appointment-content">
          <ol className="submission-checklist" aria-label="État de préparation">
            <li>
              <span>{availability ? '✓' : '1'}</span>
              <div>
                <strong>Mode de rendez-vous</strong>
                <p>
                  {!availability
                    ? 'En attente des disponibilités'
                    : values.appointment.chooseAppointmentDate
                      ? 'Choix d’une date et d’un créneau requis'
                      : 'File d’attente · aucun calendrier requis'}
                </p>
              </div>
            </li>
            <li>
              <span>{captchaReady ? '✓' : '2'}</span>
              <div>
                <strong>Vérification reCAPTCHA</strong>
                <p>
                  {captchaReady
                    ? 'Jeton reçu pour cet envoi'
                    : 'Vérification à terminer'}
                </p>
              </div>
            </li>
          </ol>
          <div className="appointment-choices">
            <h3 className="form-section-title">Disponibilités du centre</h3>
            {availabilityLoading ? (
              <div className="flex items-center gap-3 rounded-md bg-slate-50 px-4 py-3 text-sm text-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Chargement des disponibilités en fonction du centre, de la
                formule et du dossier visa...
              </div>
            ) : null}

            {!availabilityRequested ? (
              <div className="rounded-md bg-slate-50 px-4 py-4 text-sm text-muted-foreground">
                Complétez le type de visa, la variation et la categorie du
                demandeur pour charger les vraies disponibilités Capago.
              </div>
            ) : availabilityLoading ? (
              <div className="rounded-md bg-slate-50 px-4 py-4 text-sm text-muted-foreground">
                Attendez le retour officiel de Capago avant de choisir une date.
              </div>
            ) : availabilityError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                {availabilityError}
              </div>
            ) : showChooseAppointmentBranch ? (
              <div
                className={`grid gap-3 ${
                  showTimePanel
                    ? 'lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]'
                    : ''
                }`}
              >
                <div className="space-y-2">
                  <FormField
                    label="Date de rendez-vous"
                    error={appointmentError(errors, 'date')}
                  >
                    <Controller
                      control={control}
                      name="appointment.date"
                      render={({ field }) => (
                        <CalendarGrid
                          availableDays={availability?.availableDayList ?? []}
                          unavailableDays={
                            availability?.unavailableDayList ?? []
                          }
                          selectedDay={values.appointment.dateSubmit}
                          firstAvailableDay={availability?.firstAvailableDay}
                          minDay={availability?.firstDay}
                          maxDay={availability?.lastDay}
                          onSelect={(day) => {
                            field.onChange(formatAppointmentDateLabel(day))
                            setValue('appointment.dateSubmit', day)
                            setValue('appointment.time', '')
                            setValue('appointment.availableSlots', [])
                          }}
                        />
                      )}
                    />
                  </FormField>
                </div>
                {showTimePanel ? (
                  <div className="space-y-3 rounded-md border border-border/60 bg-slate-50/90 px-4 py-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-semibold text-foreground">
                          Créneaux
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Horaires renvoyés par le centre pour cette date.
                        </p>
                      </div>
                    </div>
                    {slotsLoading ? (
                      <div className="flex items-center gap-2 rounded-md bg-white px-3.5 py-3 text-sm text-muted-foreground">
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Chargement des horaires...
                      </div>
                    ) : values.appointment.availableSlots.length > 0 ? (
                      <Controller
                        control={control}
                        name="appointment.time"
                        render={({ field }) => (
                          <div className="space-y-3">
                            <div className="rounded-md border border-border/60 bg-white px-4 py-3">
                              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                Créneaux disponibles
                              </p>
                              <div className="mt-2 flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-base font-semibold text-foreground">
                                    {selectedSlot?.label ?? 'Choisir une heure'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {slotCountLabel}
                                  </p>
                                </div>
                                <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                  {formatAppointmentDateLabel(
                                    values.appointment.dateSubmit,
                                  )}
                                </div>
                              </div>
                            </div>
                            <Select
                              aria-label="Heure de rendez-vous"
                              className="border-border bg-white"
                              value={selectedSlot?.label ?? field.value}
                              placeholder="Choisir un créneau"
                              options={slotOptions}
                              onChange={field.onChange}
                            />
                            {appointmentError(errors, 'time') ? (
                              <p className="text-sm text-red-600">
                                {appointmentError(errors, 'time')}
                              </p>
                            ) : null}
                          </div>
                        )}
                      />
                    ) : (
                      <p
                        className={`rounded-md bg-white px-3.5 py-3 text-sm ${
                          slotsError ? 'text-red-600' : 'text-muted-foreground'
                        }`}
                      >
                        {slotStatusMessage}
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            ) : showQueueBranch ? (
              <div className="rounded-md bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                  <ShieldAlert className="h-4 w-4" />
                  Inscription en file d’attente
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  Aucun calendrier n&apos;est requis. Toutes les conditions
                  ci-dessous doivent être acceptees avant la soumission.
                </p>
                <div className="space-y-3">
                  {(availability?.queueConditionList ?? []).map((condition) => {
                    const key = createConditionKey(condition)

                    return (
                      <Controller
                        key={key}
                        control={control}
                        name={`appointment.queueConditions.${key}`}
                        render={({ field }) => (
                          <label
                            className={`flex items-start gap-3 rounded-md px-4 py-3 text-sm text-foreground transition-colors ${
                              queueConditionErrors?.[key]?.message
                                ? 'border border-red-200 bg-red-50/65'
                                : 'bg-white'
                            }`}
                          >
                            <Checkbox
                              checked={Boolean(field.value)}
                              onCheckedChange={(checked) =>
                                field.onChange(Boolean(checked))
                              }
                            />
                            <span>{condition}</span>
                          </label>
                        )}
                      />
                    )
                  })}
                </div>
                {queueConditionBlocked ? (
                  <p className="mt-3 text-sm text-red-600">
                    Acceptez toutes les conditions de file avant de soumettre la
                    demande.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="rounded-md bg-slate-50 px-4 py-4 text-sm text-muted-foreground">
                Attendez le retour officiel de Capago pour afficher la branche
                calendrier ou la branche file d&apos;attente.
              </div>
            )}
          </div>
          {automaticCaptcha ? (
            <p
              role="status"
              aria-live="polite"
              className={`rounded-md p-3 text-sm ${
                solvingCaptcha
                  ? 'bg-blue-50 text-blue-800'
                  : captchaReady
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-amber-50 text-amber-800'
              }`}
            >
              {solvingCaptcha ? (
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-blue-700 border-t-transparent"
                    aria-hidden="true"
                  />
                  2Captcha resout automatiquement le CAPTCHA...
                </span>
              ) : captchaReady ? (
                'CAPTCHA resolu automatiquement par 2Captcha. Prêt a envoyer.'
              ) : (
                'Résolution automatique 2Captcha en attente.'
              )}
            </p>
          ) : null}
          <section className="verification-section">
            <div className="verification-heading">
              <div>
                <p className="font-semibold text-foreground">
                  Vérification reCAPTCHA
                </p>
                <p className="text-sm text-muted-foreground">
                  {captchaReady
                    ? 'La vérification est terminée et le jeton est prêt pour la soumission.'
                    : 'Ouvrez la fenetre intégrée pour finaliser le test. Si le serveur refuse le jeton ou expire, vous pourrez relancer la vérification.'}
                </p>
              </div>
              {!captchaReady ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onOpenVerification}
                  disabled={verificationOpening || submitting}
                >
                  {verificationOpening ? (
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  {verificationButtonLabel}
                </Button>
              ) : null}
            </div>
            <div
              className={`rounded-md px-4 py-4 ${
                captchaReady ? 'bg-emerald-50/75' : 'bg-amber-50/70'
              }`}
            >
              <div className="flex items-start gap-3">
                {captchaReady ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                ) : (
                  <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-600" />
                )}
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">
                    {captchaReady
                      ? 'Vérification complétée'
                      : 'Vérification requise'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {captchaReady
                      ? "Le jeton reCAPTCHA a ete capture par l'app. Si un probleme survient, cliquez simplement sur 'Repasser la vérification'."
                      : automaticCaptcha
                        ? 'La vérification sera effectuee par 2Captcha avant l’envoi.'
                        : 'Terminez la vérification dans la fenêtre officielle avant de soumettre la demande.'}
                  </p>
                  {captchaError ? (
                    <p className="text-sm text-red-600">{captchaError}</p>
                  ) : null}
                </div>
              </div>
            </div>
            <Controller
              control={control}
              name="appointment.captchaToken"
              render={({ field }) => <input type="hidden" {...field} />}
            />
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
