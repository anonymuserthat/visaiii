import { Controller, type Control, type FieldErrors, type UseFormSetValue } from 'react-hook-form'
import { Check, Crown, FileText, ShieldCheck, Sparkles } from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { BookingFormValues, CapagoCenter, GlobalParams } from '@/lib/api/types'
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Choisissez le centre et la formule</CardTitle>
          <p className="text-sm text-muted-foreground">
            Le centre pilote automatiquement les services et les visas charges.
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
                  setValue('area', center.id, { shouldDirty: true, shouldValidate: true })
                }}
              />
            ))}
          </div>
          {errors.area?.message ? (
            <p className="text-sm text-red-600">{errors.area.message}</p>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                value: 'standard',
                title: 'Standard',
                description:
                  'Parcours classique avec options supplementaires au besoin.',
                icon: FileText,
              },
              {
                value: 'premium',
                title: 'Premium',
                description:
                  'Met en avant les services inclus selon les parametres distants.',
                icon: Crown,
              },
            ].map((formula) => {
              const Icon = formula.icon
              const isSelected = values.formula === formula.value
              return (
                <button
                  key={formula.value}
                  type="button"
                  className={cn(
                    'rounded-xl border px-3 py-3 text-left transition-colors',
                    isSelected
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border/80 bg-white hover:border-primary/20',
                  )}
                  onClick={() =>
                    setValue('formula', formula.value as BookingFormValues['formula'], {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {formula.title}
                    </span>
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-display text-xl font-semibold text-foreground">
                    {formula.title}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formula.description}
                  </p>
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
                    onChange={(event) => field.onChange(Number(event.target.value))}
                  />
                )}
              />
            </FormField>
            <div className="rounded-xl border border-border/60 bg-slate-50 px-3 py-3 text-foreground">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs uppercase tracking-[0.18em]">
                  Rappel produit
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                La formule premium suit les options incluses annoncees par les
                parametres globaux. Le centre reste selectionnable a tout moment
                et recharge les dependances en direct.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conditions et informations utiles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border/60 bg-slate-50 px-3 py-3 text-sm text-foreground">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              Verification humaine preservee
            </div>
            <p className="mt-1 text-muted-foreground">
              L&apos;application prepare les etapes 1 a 4, mais ne contourne
              jamais le reCAPTCHA.
            </p>
          </div>
          <Controller
            control={control}
            name="cgv"
            render={({ field }) => (
              <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-slate-50 px-3 py-3">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                  id="cgv"
                />
                <div className="space-y-1">
                  <Label htmlFor="cgv" className="text-base">
                    J&apos;accepte les conditions generales
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Ouvrez le document officiel si vous souhaitez le relire avant
                    de continuer.
                  </p>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
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
