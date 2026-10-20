import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormSetValue,
} from 'react-hook-form'
import {
  AlertTriangle,
  FileCheck2,
  Mail,
  Phone,
  PlaneTakeoff,
} from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type {
  BookingFormValues,
  SocialTitle,
  ServiceItem,
  VisaFileVariation,
  VisaTypeItem,
} from '@/lib/api/types'
import { FormField } from '@/features/booking/components/form-field'
import {
  selectProductLines,
  selectStayDurations,
  selectVisaTypes,
} from '@/lib/state/selectors'

const CURRENT_YEAR = new Date().getFullYear()

function buildNumericOptions(
  start: number,
  end: number,
  padLength = 2,
): Array<{ value: string; label: string }> {
  const values: Array<{ value: string; label: string }> = []
  const step = start <= end ? 1 : -1

  for (
    let current = start;
    step > 0 ? current <= end : current >= end;
    current += step
  ) {
    const value = String(current).padStart(padLength, '0')
    values.push({ value, label: value })
  }

  return values
}

function normalizeSelectValue(value: string, padLength: number) {
  if (!value.trim() || !/^\d+$/.test(value.trim())) {
    return value
  }

  return value.trim().padStart(padLength, '0')
}

const DAY_OPTIONS = buildNumericOptions(1, 31)
const MONTH_OPTIONS = buildNumericOptions(1, 12)
const BIRTH_YEAR_OPTIONS = buildNumericOptions(
  CURRENT_YEAR,
  CURRENT_YEAR - 100,
  4,
)
const DEPARTURE_YEAR_OPTIONS = buildNumericOptions(
  CURRENT_YEAR,
  CURRENT_YEAR + 2,
  4,
)

interface Step2TravellersProps {
  activeTraveller: number
  onTravellerSelect: (index: number) => void
  control: Control<BookingFormValues>
  errors: FieldErrors<BookingFormValues>
  values: BookingFormValues
  socialTitles: SocialTitle[]
  visaFileVariations: VisaFileVariation[]
  visaTypes: VisaTypeItem[]
  services: ServiceItem[]
  setValue: UseFormSetValue<BookingFormValues>
  showSmsSelection: boolean
}

function messageFor(
  errors: FieldErrors<BookingFormValues>,
  index: number,
  field: keyof BookingFormValues['travellers'][number],
) {
  return errors.travellers?.[index]?.[field]?.message?.toString()
}

export function Step2Travellers({
  activeTraveller,
  onTravellerSelect,
  control,
  errors,
  values,
  socialTitles,
  visaFileVariations,
  visaTypes,
  services,
  setValue,
  showSmsSelection,
}: Step2TravellersProps) {
  const selectedTraveller = Math.min(
    activeTraveller,
    values.travellers.length - 1,
  )
  const titleOptions = socialTitles.map((title) => ({
    value: title.id,
    label: title.label,
  }))
  const stayDurationOptions = selectStayDurations(visaTypes).map(
    (duration) => ({
      value: duration.id,
      label: duration.label,
    }),
  )
  const fileVariationOptions = visaFileVariations.map((variation) => ({
    value: variation.id,
    label: variation.label,
  }))
  const franceVisasService = services.find(
    (service) => service.category === 'france_visas',
  )

  return (
    <div className="traveller-workspace">
      <div
        className="traveller-tabs"
        role="tablist"
        aria-label="Voyageurs du dossier"
      >
        {values.travellers.map((traveller, index) => (
          <button
            key={traveller.id}
            type="button"
            role="tab"
            id={`traveller-tab-${index}`}
            aria-selected={selectedTraveller === index}
            aria-controls={`traveller-panel-${index}`}
            tabIndex={selectedTraveller === index ? 0 : -1}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                event.preventDefault()
                const next =
                  (index +
                    (event.key === 'ArrowRight' ? 1 : -1) +
                    values.travellers.length) %
                  values.travellers.length
                onTravellerSelect(next)
                document.getElementById(`traveller-tab-${next}`)?.focus()
              }
            }}
            onClick={() => onTravellerSelect(index)}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            {traveller.firstname || `Voyageur ${index + 1}`}
            {index === 0 ? <small>Principal</small> : null}
            {errors.travellers?.[index] ? (
              <small className="text-destructive">À corriger</small>
            ) : null}
          </button>
        ))}
      </div>
      {values.travellers.map((traveller, index) => {
        const productLineOptions = selectProductLines(
          visaTypes,
          traveller.visaStayDuration,
        ).map((item) => ({
          value: item.id,
          label: item.label,
        }))
        const visaTypeOptions = selectVisaTypes(
          visaTypes,
          traveller.visaStayDuration,
          traveller.travelPurpose,
        )
        const selectedVisaType = visaTypeOptions.find(
          (item) => item.id === traveller.typeVisa,
        )
        const variationOptions =
          selectedVisaType?.visaVariationList.map((variation) => ({
            value: variation.id,
            label: variation.label,
          })) ?? []
        const selectedVariation = selectedVisaType?.visaVariationList.find(
          (variation) => variation.id === traveller.precision1,
        )
        const checklistOptions =
          selectedVariation?.validationChecklistList.map((checklist) => ({
            value: checklist.id,
            label: checklist.label,
          })) ?? []
        const selectedVisaFileVariation = visaFileVariations.find(
          (variation) => variation.id === traveller.visaFileVariation,
        )

        return (
          <Card
            key={traveller.id}
            role="tabpanel"
            id={`traveller-panel-${index}`}
            aria-labelledby={`traveller-tab-${index}`}
            hidden={selectedTraveller !== index}
            className="traveller-panel"
          >
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Voyageur {index + 1}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {index === 0
                      ? 'Contact principal pour le téléphone mobile et les emails.'
                      : 'Renseignez les informations exactement comme sur le passeport.'}
                  </p>
                </div>
                {showSmsSelection ? (
                  <Controller
                    control={control}
                    name={`travellers.${index}.followSms`}
                    render={({ field }) => (
                      <label className="flex items-center gap-2 text-xs text-foreground">
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) =>
                            field.onChange(Boolean(checked))
                          }
                        />
                        Suivi SMS pour ce voyageur
                      </label>
                    )}
                  />
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  label="Titre"
                  error={messageFor(errors, index, 'title')}
                >
                  <Controller
                    control={control}
                    name={`travellers.${index}.title`}
                    render={({ field }) => (
                      <Select
                        aria-label="Titre"
                        value={field.value}
                        options={titleOptions}
                        placeholder="- -"
                        onChange={field.onChange}
                      />
                    )}
                  />
                </FormField>
                <FormField
                  label="Nom de famille"
                  error={messageFor(errors, index, 'lastname')}
                >
                  <Controller
                    control={control}
                    name={`travellers.${index}.lastname`}
                    render={({ field }) => (
                      <Input aria-label="Nom" {...field} />
                    )}
                  />
                </FormField>
                <FormField
                  label="Prénom(s)"
                  error={messageFor(errors, index, 'firstname')}
                >
                  <Controller
                    control={control}
                    name={`travellers.${index}.firstname`}
                    render={({ field }) => (
                      <Input aria-label="Prénom" {...field} />
                    )}
                  />
                </FormField>
              </div>

              {index === 0 ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    label="Numéro de téléphone mobile"
                    hint="Requis"
                    error={messageFor(errors, index, 'phone')}
                  >
                    <Controller
                      control={control}
                      name={`travellers.${index}.phone`}
                      render={({ field }) => (
                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            aria-label="Numéro de téléphone mobile"
                            className="pl-10"
                            inputMode="tel"
                            {...field}
                          />
                        </div>
                      )}
                    />
                  </FormField>
                  <FormField
                    label="Email"
                    hint="Requis"
                    error={messageFor(errors, index, 'email')}
                  >
                    <Controller
                      control={control}
                      name={`travellers.${index}.email`}
                      render={({ field }) => (
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            aria-label="Email"
                            className="pl-10"
                            type="email"
                            {...field}
                          />
                        </div>
                      )}
                    />
                  </FormField>
                  <FormField
                    label="Confirmation de l'email"
                    hint="Requis"
                    error={messageFor(errors, index, 'emailConfirm')}
                  >
                    <Controller
                      control={control}
                      name={`travellers.${index}.emailConfirm`}
                      render={({ field }) => (
                        <Input
                          aria-label="Confirmation de l'email"
                          type="email"
                          {...field}
                        />
                      )}
                    />
                  </FormField>
                </div>
              ) : null}

              <div className="traveller-document-fields">
                <div className="traveller-field-section">
                  <div className="mb-2">
                    <p className="font-semibold text-foreground">
                      Date de naissance
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Jour, mois et année de naissance.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      label="Jour"
                      error={messageFor(errors, index, 'dayBirth')}
                    >
                      <Controller
                        control={control}
                        name={`travellers.${index}.dayBirth`}
                        render={({ field }) => (
                          <Select
                            aria-label="Jour de naissance"
                            value={normalizeSelectValue(field.value, 2)}
                            options={DAY_OPTIONS}
                            placeholder="- -"
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </FormField>
                    <FormField
                      label="Mois"
                      error={messageFor(errors, index, 'monthBirth')}
                    >
                      <Controller
                        control={control}
                        name={`travellers.${index}.monthBirth`}
                        render={({ field }) => (
                          <Select
                            aria-label="Mois de naissance"
                            value={normalizeSelectValue(field.value, 2)}
                            options={MONTH_OPTIONS}
                            placeholder="- -"
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </FormField>
                    <FormField
                      label="Année"
                      error={messageFor(errors, index, 'yearBirth')}
                    >
                      <Controller
                        control={control}
                        name={`travellers.${index}.yearBirth`}
                        render={({ field }) => (
                          <Select
                            aria-label="Année de naissance"
                            value={normalizeSelectValue(field.value, 4)}
                            options={BIRTH_YEAR_OPTIONS}
                            placeholder="- -"
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </FormField>
                  </div>
                </div>

                <div className="space-y-4">
                  <FormField
                    label="Numéro du passeport"
                    error={messageFor(errors, index, 'passportNumber')}
                  >
                    <Controller
                      control={control}
                      name={`travellers.${index}.passportNumber`}
                      render={({ field }) => (
                        <Input aria-label="Numéro du passeport" {...field} />
                      )}
                    />
                  </FormField>

                  {franceVisasService ? (
                    <Controller
                      control={control}
                      name={`travellers.${index}.franceVisasAssistance`}
                      render={({ field }) => (
                        <label className="flex items-start gap-3 rounded-md border border-border/70 bg-white px-4 py-3 text-sm text-foreground">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) =>
                              field.onChange(Boolean(checked))
                            }
                          />
                          <span>
                            <span className="flex items-center gap-2 font-semibold">
                              <FileCheck2 className="h-4 w-4 text-primary" />
                              Assistance France-Visas
                            </span>
                            <span className="mt-1 block text-muted-foreground">
                              Accompagnement Capago pour le formulaire
                              France-Visas.
                            </span>
                          </span>
                        </label>
                      )}
                    />
                  ) : null}
                </div>

                <div className="traveller-field-section">
                  <div className="mb-2">
                    <p className="font-semibold text-foreground">
                      Date de départ
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Indiquez la date estimee de départ.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      label="Jour"
                      error={messageFor(errors, index, 'dayDepartureDate')}
                    >
                      <Controller
                        control={control}
                        name={`travellers.${index}.dayDepartureDate`}
                        render={({ field }) => (
                          <Select
                            aria-label="Jour de départ"
                            value={normalizeSelectValue(field.value, 2)}
                            options={DAY_OPTIONS}
                            placeholder="- -"
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </FormField>
                    <FormField
                      label="Mois"
                      error={messageFor(errors, index, 'monthDepartureDate')}
                    >
                      <Controller
                        control={control}
                        name={`travellers.${index}.monthDepartureDate`}
                        render={({ field }) => (
                          <Select
                            aria-label="Mois de départ"
                            value={normalizeSelectValue(field.value, 2)}
                            options={MONTH_OPTIONS}
                            placeholder="- -"
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </FormField>
                    <FormField
                      label="Année"
                      error={messageFor(errors, index, 'yearDepartureDate')}
                    >
                      <Controller
                        control={control}
                        name={`travellers.${index}.yearDepartureDate`}
                        render={({ field }) => (
                          <Select
                            aria-label="Année de départ"
                            value={normalizeSelectValue(field.value, 4)}
                            options={DEPARTURE_YEAR_OPTIONS}
                            placeholder="- -"
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </FormField>
                  </div>
                </div>
              </div>

              <div className="traveller-visa-section">
                <div className="mb-3 flex items-center gap-2">
                  <PlaneTakeoff className="h-4 w-4 text-primary" />
                  <p className="font-semibold text-foreground">
                    Sélection dynamique du visa
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    label="Type de visa demandé"
                    hint="Sélectionnez la duree de séjour."
                    error={messageFor(errors, index, 'visaStayDuration')}
                  >
                    <Controller
                      control={control}
                      name={`travellers.${index}.visaStayDuration`}
                      render={({ field }) => (
                        <Select
                          aria-label="Type de visa demandé"
                          value={field.value}
                          options={stayDurationOptions}
                          placeholder="- -"
                          onChange={(event) => {
                            field.onChange(event)
                            setValue(`travellers.${index}.travelPurpose`, '')
                            setValue(`travellers.${index}.typeVisa`, '')
                            setValue(`travellers.${index}.precision1`, '')
                            setValue(`travellers.${index}.precision2`, '')
                            setValue(
                              `travellers.${index}.visaFileVariation`,
                              '',
                            )
                            setValue(`travellers.${index}.renewal`, false)
                          }}
                        />
                      )}
                    />
                  </FormField>
                  <FormField
                    label="Votre projet"
                    hint="Précisez les raisons qui motivent votre voyage."
                    error={messageFor(errors, index, 'travelPurpose')}
                  >
                    <Controller
                      control={control}
                      name={`travellers.${index}.travelPurpose`}
                      render={({ field }) => (
                        <Select
                          aria-label="Votre projet"
                          value={field.value}
                          options={productLineOptions}
                          placeholder="- -"
                          onChange={(event) => {
                            field.onChange(event)
                            setValue(`travellers.${index}.typeVisa`, '')
                            setValue(`travellers.${index}.precision1`, '')
                            setValue(`travellers.${index}.precision2`, '')
                            setValue(
                              `travellers.${index}.visaFileVariation`,
                              '',
                            )
                            setValue(`travellers.${index}.renewal`, false)
                          }}
                        />
                      )}
                    />
                  </FormField>
                  <FormField
                    label="Motif principal du séjour"
                    hint="Sélectionnez le motif principal de votre voyage."
                    error={messageFor(errors, index, 'typeVisa')}
                  >
                    <Controller
                      control={control}
                      name={`travellers.${index}.typeVisa`}
                      render={({ field }) => (
                        <Select
                          aria-label="Motif principal du séjour"
                          value={field.value}
                          options={visaTypeOptions.map((item) => ({
                            value: item.id,
                            label: item.label,
                          }))}
                          placeholder="- -"
                          onChange={(event) => {
                            field.onChange(event)
                            setValue(`travellers.${index}.precision1`, '')
                            setValue(`travellers.${index}.precision2`, '')
                            setValue(
                              `travellers.${index}.visaFileVariation`,
                              '',
                            )
                            setValue(`travellers.${index}.renewal`, false)
                          }}
                        />
                      )}
                    />
                  </FormField>
                  <FormField
                    label="Variation de visa"
                    hint="Choisissez la categorie qui vous correspond."
                    error={messageFor(errors, index, 'precision1')}
                  >
                    <Controller
                      control={control}
                      name={`travellers.${index}.precision1`}
                      render={({ field }) => (
                        <Select
                          aria-label="Variation de visa"
                          value={field.value}
                          options={variationOptions}
                          placeholder="- -"
                          onChange={(event) => {
                            field.onChange(event)
                            setValue(`travellers.${index}.precision2`, '')
                          }}
                        />
                      )}
                    />
                  </FormField>
                  <FormField
                    label="Situation du demandeur"
                    hint="Sélectionnez votre situation."
                    error={messageFor(errors, index, 'precision2')}
                  >
                    <Controller
                      control={control}
                      name={`travellers.${index}.precision2`}
                      render={({ field }) => (
                        <Select
                          aria-label="Situation du demandeur"
                          value={field.value}
                          options={checklistOptions}
                          placeholder="- -"
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </FormField>
                  {selectedVisaType?.visaFileVariationRequired ? (
                    <div className="md:col-span-2 rounded-md border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-amber-900">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <div className="space-y-1">
                          <p className="font-medium">Veuillez noter :</p>
                          <p>
                            Si vous ne remplissez pas les conditions requises
                            pour la categorie sélectionnée, votre rendez-vous
                            pourra être annule sans remboursement.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  <FormField
                    label="Categorie du demandeur"
                    hint="Laissez vide si aucune catégorie spécifique ne s’applique."
                    error={messageFor(errors, index, 'visaFileVariation')}
                  >
                    <Controller
                      control={control}
                      name={`travellers.${index}.visaFileVariation`}
                      render={({ field }) => (
                        <Select
                          aria-label="Categorie du demandeur"
                          value={field.value}
                          options={fileVariationOptions}
                          placeholder="- -"
                          onChange={(event) => {
                            field.onChange(event)
                            if (event.currentTarget.value) {
                              setValue(`travellers.${index}.renewal`, false)
                            }
                          }}
                        />
                      )}
                    />
                  </FormField>
                  {selectedVisaFileVariation?.description ? (
                    <div className="md:col-span-2 rounded-md border border-border/70 bg-white px-4 py-3 text-sm text-muted-foreground">
                      {selectedVisaFileVariation.description}
                    </div>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
