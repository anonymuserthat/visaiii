import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormSetValue,
} from 'react-hook-form'
import { Check, Crown, FileText } from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type {
  BookingFormValues,
  CapagoCenter,
  GlobalParams,
} from '@/lib/api/types'
import { openExternalUrl } from '@/lib/persistence/external'
import { CenterCard } from '@/features/booking/components/center-card'
import { FormField } from '@/features/booking/components/form-field'
import { cn } from '@/lib/utils'

interface Step1SetupProps {
  control: Control<BookingFormValues>
  errors: FieldErrors<BookingFormValues>
  centers: CapagoCenter[]
  globalParams: GlobalParams | null
  values: BookingFormValues
  setValue: UseFormSetValue<BookingFormValues>
}

export function Step1Setup({
  control,
  errors,
  centers,
  globalParams,
  values,
  setValue,
}: Step1SetupProps) {
  const travellerOptions = Array.from(
    { length: globalParams?.maxTravellersPerGroup ?? 6 },
    (_, index) => ({
      value: String(index + 1),
      label: `${index + 1} voyageur${index === 0 ? '' : 's'}`,
    }),
  )

  const includedPremiumItems = [
    globalParams?.premiumIncludesPhoto ? 'Photo premium' : null,
    globalParams?.premiumIncludesHomeDelivery ? 'Livraison incluse' : null,
    globalParams?.premiumIncludesSms ? 'SMS inclus' : null,
  ].filter(Boolean)

  return (
    <div className="setup-layout">
      <Card>
        <CardHeader>
          <CardTitle>Centre de dépôt</CardTitle>
          <p className="text-sm text-muted-foreground">
            Les catégories de visa et les services dépendent du centre choisi.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {centers.map((center) => (
              <CenterCard
                key={center.id}
                center={center}
                selected={values.area === center.id}
                onSelect={() => {
                  setValue('area', center.id, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }}
              />
            ))}
          </div>
          {errors.area?.message ? (
            <p className="text-sm text-red-600">{errors.area.message}</p>
          ) : null}
          <h3 className="form-section-title">Formule de rendez-vous</h3>
          <div className="formula-options">
            {[
              {
                value: 'standard',
                title: 'Standard',
                description:
                  'Parcours classique. Services supplémentaires au choix.',
                icon: FileText,
              },
              {
                value: 'premium',
                title: 'Premium',
                description:
                  'Services inclus selon les informations du centre.',
                icon: Crown,
              },
            ].map((formula) => {
              const Icon = formula.icon
              const isSelected = values.formula === formula.value
              return (
                <button
                  key={formula.value}
                  type="button"
                  aria-pressed={isSelected}
                  className={cn(
                    'formula-option',
                    isSelected
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border/80 bg-white hover:border-primary/20',
                  )}
                  onClick={() =>
                    setValue(
                      'formula',
                      formula.value as BookingFormValues['formula'],
                      {
                        shouldDirty: true,
                        shouldValidate: true,
                      },
                    )
                  }
                >
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  <div>
                    <strong>{formula.title}</strong>
                    <p>{formula.description}</p>
                  </div>
                  {formula.value === 'premium' ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {includedPremiumItems.map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </button>
              )
            })}
          </div>
          {errors.formula?.message ? (
            <p className="text-sm text-red-600">{errors.formula.message}</p>
          ) : null}
          <div className="grid gap-6 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <FormField
              label="Nombre de voyageurs"
              hint={`Maximum ${globalParams?.maxTravellersPerGroup ?? 6}`}
              error={errors.nbTravellers?.message?.toString()}
            >
              <Controller
                control={control}
                name="nbTravellers"
                render={({ field }) => (
                  <Select
                    aria-label="Nombre de voyageurs"
                    value={String(field.value)}
                    options={travellerOptions}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
                  />
                )}
              />
            </FormField>
            <p className="self-center text-xs text-muted-foreground">
              Chaque voyageur dispose de sa propre fiche. Les informations
              restent modifiables avant l’envoi.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conditions générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Controller
            control={control}
            name="cgv"
            render={({ field }) => (
              <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-slate-50 px-3 py-3">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(Boolean(checked))
                  }
                  id="cgv"
                />
                <div className="space-y-1">
                  <Label htmlFor="cgv" className="text-sm">
                    J&apos;accepte les conditions générales
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Ouvrez le document officiel si vous souhaitez le relire
                    avant de continuer.
                  </p>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
                    disabled={!globalParams?.termsAndConditionsUrl}
                    onClick={() => {
                      if (globalParams?.termsAndConditionsUrl) {
                        void openExternalUrl(globalParams.termsAndConditionsUrl)
                      }
                    }}
                  >
                    <Check className="h-4 w-4" />
                    Ouvrir les conditions
                  </button>
                </div>
              </div>
            )}
          />
          {errors.cgv?.message ? (
            <p className="text-sm text-red-600">{errors.cgv.message}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
