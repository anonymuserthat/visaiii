import type { ReactNode } from 'react'
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormSetValue,
} from 'react-hook-form'
import {
  Clock3,
  Home,
  ImageIcon,
  MessageSquare,
  Receipt,
  Shield,
} from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select } from '@/components/ui/select'
import type {
  BookingFormValues,
  ServiceItem,
  SocialTitle,
} from '@/lib/api/types'
import { FormField } from '@/features/booking/components/form-field'
import { getServiceVisibility } from '@/lib/validation/bookingSchemas'

interface Step3ServicesProps {
  control: Control<BookingFormValues>
  errors: FieldErrors<BookingFormValues>
  values: BookingFormValues
  services: ServiceItem[]
  socialTitles: SocialTitle[]
  setValue: UseFormSetValue<BookingFormValues>
}

function optionalError(errors: FieldErrors<BookingFormValues>, path: string[]) {
  let cursor: unknown = errors.optionalServices
  for (const key of path) {
    if (!cursor || typeof cursor !== 'object') {
      return undefined
    }

    cursor = (cursor as Record<string, unknown>)[key]
  }

  if (cursor && typeof cursor === 'object' && 'message' in cursor) {
    return String((cursor as { message?: string }).message ?? '')
  }

  return undefined
}

function ServiceRadioCard({
  icon,
  title,
  description,
  included = false,
  children,
}: {
  icon: ReactNode
  title: string
  description?: string | null
  included?: boolean
  children: ReactNode
}) {
  return (
    <section className="service-section">
      <div className="service-heading">
        <div className="text-primary">{icon}</div>
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          {included ? (
            <span className="service-included">Inclus dans la formule</span>
          ) : null}
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="service-controls">{children}</div>
    </section>
  )
}

function getTravellerSmsLabel(
  traveller: BookingFormValues['travellers'][number],
  index: number,
  socialTitles: SocialTitle[],
) {
  const titleLabel =
    socialTitles.find((title) => title.id === traveller.title)?.shortLabel ??
    socialTitles.find((title) => title.id === traveller.title)?.label ??
    traveller.title

  const fullName = [traveller.firstname, traveller.lastname]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(' ')

  if (index === 0) {
    return `Voyageur ${index + 1} - Contact principal : ${
      [titleLabel, fullName].filter(Boolean).join(' ') ||
      'Coordonnées principales'
    }`
  }

  return `Voyageur ${index + 1} : ${
    [titleLabel, fullName].filter(Boolean).join(' ') || 'Voyageur a notifier'
  }`
}

export function Step3Services({
  control,
  errors,
  values,
  services,
  socialTitles,
  setValue,
}: Step3ServicesProps) {
  const visibility = getServiceVisibility(services, values.formula)
  const titleOptions = socialTitles.map((title) => ({
    value: title.id,
    label: title.label,
  }))
  const visibleServices = services.filter((service) =>
    values.formula ? service.formulas.includes(values.formula) : true,
  )
  const findService = (category: ServiceItem['category']) =>
    visibleServices.find((service) => service.category === category)

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Services du dossier</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sélectionnez les prestations proposées pour votre centre et votre
            formule.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4">
          {visibility.primeTime ? (
            <ServiceRadioCard
              icon={<Clock3 className="h-4 w-4" />}
              title="Créneau Prime Time"
              description={findService('prime_time')?.description}
              included={
                values.formula === 'premium' &&
                Boolean(findService('prime_time')?.isIncludedInPremium)
              }
            >
              <Controller
                control={control}
                name="optionalServices.primeTimeAppointment"
                render={({ field }) => (
                  <label className="flex items-start gap-3 rounded-md border border-border/70 bg-slate-50 px-4 py-3 text-sm font-medium text-foreground">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(Boolean(checked))
                      }
                    />
                    Deposer le dossier sur un créneau Prime Time si disponible.
                  </label>
                )}
              />
            </ServiceRadioCard>
          ) : null}

          {visibility.portrait ? (
            <ServiceRadioCard
              icon={<ImageIcon className="h-4 w-4" />}
              title="Photos d'identite"
              description={findService('portrait')?.description}
              included={
                values.formula === 'premium' &&
                Boolean(findService('portrait')?.isIncludedInPremium)
              }
            >
              <FormField
                label="Souhaitez-vous realiser les photos d'identite au centre ?"
                error={optionalError(errors, ['portrait'])}
              >
                <Controller
                  control={control}
                  name="optionalServices.portrait"
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid gap-3 md:grid-cols-2"
                    >
                      <label className="flex items-start gap-3 rounded-md border border-border bg-slate-50 px-4 py-3">
                        <RadioGroupItem value="yes_portrait" />
                        <span>
                          Oui, je souhaite realiser mes photos directement au
                          centre.
                        </span>
                      </label>
                      <label className="flex items-start gap-3 rounded-md border border-border bg-white px-4 py-3">
                        <RadioGroupItem value="no_portrait" />
                        <span>Non, je fournirai mes propres photos.</span>
                      </label>
                    </RadioGroup>
                  )}
                />
              </FormField>
            </ServiceRadioCard>
          ) : null}

          {visibility.insurance ? (
            <ServiceRadioCard
              icon={<Shield className="h-4 w-4" />}
              title="Mise en relation assurance"
              description={findService('insurance')?.description}
              included={
                values.formula === 'premium' &&
                Boolean(findService('insurance')?.isIncludedInPremium)
              }
            >
              <FormField
                label="Souhaitez-vous être rappele par un assureur ?"
                error={optionalError(errors, ['relation'])}
              >
                <Controller
                  control={control}
                  name="optionalServices.relation"
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid gap-3 md:grid-cols-2"
                    >
                      <label className="flex items-center gap-3 rounded-md border border-border bg-slate-50 px-4 py-3">
                        <RadioGroupItem value="yes_relation" />
                        Oui, être rappele
                      </label>
                      <label className="flex items-center gap-3 rounded-md border border-border bg-white px-4 py-3">
                        <RadioGroupItem value="no_relation" />
                        Non merci
                      </label>
                    </RadioGroup>
                  )}
                />
              </FormField>
            </ServiceRadioCard>
          ) : null}

          {visibility.delivery ? (
            <ServiceRadioCard
              icon={<Home className="h-4 w-4" />}
              title="Service de collecte et de livraison des passeports"
              description={findService('delivery')?.description}
              included={
                values.formula === 'premium' &&
                Boolean(findService('delivery')?.isIncludedInPremium)
              }
            >
              <FormField
                label="Mode de livraison du passeport"
                error={optionalError(errors, ['deliveryVisa'])}
              >
                <Controller
                  control={control}
                  name="optionalServices.deliveryVisa"
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid gap-3 md:grid-cols-2"
                    >
                      <label className="flex items-start gap-3 rounded-md border border-border bg-slate-50 px-4 py-3">
                        <RadioGroupItem value="home_delivery" />
                        <span>Livraison a domicile ou au travail</span>
                      </label>
                      <label className="flex items-start gap-3 rounded-md border border-border bg-white px-4 py-3">
                        <RadioGroupItem value="me_delivery" />
                        <span>Retrait au centre</span>
                      </label>
                    </RadioGroup>
                  )}
                />
              </FormField>
              {values.optionalServices.deliveryVisa === 'home_delivery' ? (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <FormField
                    label="Titre du contact"
                    error={optionalError(errors, ['deliveryContact', 'title'])}
                  >
                    <Controller
                      control={control}
                      name="optionalServices.deliveryContact.title"
                      render={({ field }) => (
                        <Select
                          aria-label="Titre du contact"
                          value={field.value}
                          options={titleOptions}
                          placeholder="- -"
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </FormField>
                  <FormField
                    label="Nom du contact"
                    error={optionalError(errors, [
                      'deliveryContact',
                      'lastname',
                    ])}
                  >
                    <Controller
                      control={control}
                      name="optionalServices.deliveryContact.lastname"
                      render={({ field }) => (
                        <Input aria-label="Nom du contact" {...field} />
                      )}
                    />
                  </FormField>
                  <FormField
                    label="Prénom du contact"
                    error={optionalError(errors, [
                      'deliveryContact',
                      'firstname',
                    ])}
                  >
                    <Controller
                      control={control}
                      name="optionalServices.deliveryContact.firstname"
                      render={({ field }) => (
                        <Input aria-label="Prénom du contact" {...field} />
                      )}
                    />
                  </FormField>
                  <FormField
                    label="Adresse"
                    error={optionalError(errors, [
                      'deliveryContact',
                      'address',
                    ])}
                  >
                    <Controller
                      control={control}
                      name="optionalServices.deliveryContact.address"
                      render={({ field }) => (
                        <Input aria-label="Adresse" {...field} />
                      )}
                    />
                  </FormField>
                  <FormField
                    label="Code postal"
                    error={optionalError(errors, ['deliveryContact', 'zip'])}
                  >
                    <Controller
                      control={control}
                      name="optionalServices.deliveryContact.zip"
                      render={({ field }) => (
                        <Input aria-label="Code postal" {...field} />
                      )}
                    />
                  </FormField>
                  <FormField
                    label="Ville"
                    error={optionalError(errors, ['deliveryContact', 'city'])}
                  >
                    <Controller
                      control={control}
                      name="optionalServices.deliveryContact.city"
                      render={({ field }) => (
                        <Input aria-label="Ville" {...field} />
                      )}
                    />
                  </FormField>
                </div>
              ) : null}
            </ServiceRadioCard>
          ) : null}

          {visibility.sms ? (
            <ServiceRadioCard
              icon={<MessageSquare className="h-4 w-4" />}
              title="Service de suivi de demande"
              description={findService('sms')?.description}
              included={
                values.formula === 'premium' &&
                Boolean(findService('sms')?.isIncludedInPremium)
              }
            >
              <Controller
                control={control}
                name="optionalServices.followSms"
                render={({ field }) => (
                  <label className="flex items-center gap-3 rounded-md border border-border/70 bg-slate-50 px-4 py-3 text-sm font-medium text-foreground">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        const nextChecked = Boolean(checked)
                        field.onChange(nextChecked)
                        if (!nextChecked) {
                          values.travellers.forEach((_, index) => {
                            setValue(`travellers.${index}.followSms`, false, {
                              shouldDirty: true,
                            })
                          })
                          return
                        }

                        if (
                          !values.travellers.some(
                            (traveller) => traveller.followSms,
                          )
                        ) {
                          setValue('travellers.0.followSms', true, {
                            shouldDirty: true,
                          })
                        }
                      }}
                    />
                    Recevoir des notifications sur mon téléphone
                  </label>
                )}
              />
              {values.optionalServices.followSms ? (
                <div className="mt-4 grid gap-4">
                  <FormField
                    label="Numéro mobile SMS"
                    error={optionalError(errors, ['smsMobile'])}
                  >
                    <Controller
                      control={control}
                      name="optionalServices.smsMobile"
                      render={({ field }) => (
                        <Input
                          aria-label="Numéro mobile SMS"
                          inputMode="tel"
                          {...field}
                        />
                      )}
                    />
                  </FormField>
                  <div className="grid gap-3">
                    <p className="text-sm font-semibold text-foreground">
                      Voyageurs a notifier
                    </p>
                    {values.travellers.map((traveller, index) => (
                      <Controller
                        key={traveller.id}
                        control={control}
                        name={`travellers.${index}.followSms`}
                        render={({ field }) => (
                          <label className="flex items-center gap-3 rounded-md border border-border bg-white px-4 py-3 text-sm text-foreground">
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) =>
                                field.onChange(Boolean(checked))
                              }
                            />
                            {getTravellerSmsLabel(
                              traveller,
                              index,
                              socialTitles,
                            )}
                          </label>
                        )}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </ServiceRadioCard>
          ) : null}

          {visibility.invoice ? (
            <ServiceRadioCard
              icon={<Receipt className="h-4 w-4" />}
              title="Facture"
              description={findService('invoice')?.description}
              included={
                values.formula === 'premium' &&
                Boolean(findService('invoice')?.isIncludedInPremium)
              }
            >
              <Controller
                control={control}
                name="optionalServices.invoiceEmail"
                render={({ field }) => (
                  <label className="flex items-center gap-3 rounded-md border border-border/70 bg-slate-50 px-4 py-3 text-sm font-medium text-foreground">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(Boolean(checked))
                      }
                    />
                    Recevoir par email une facture au nom de mon entreprise
                  </label>
                )}
              />
              {values.optionalServices.invoiceEmail ? (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <FormField
                    label="Societe"
                    error={optionalError(errors, ['invoiceContact', 'society'])}
                  >
                    <Controller
                      control={control}
                      name="optionalServices.invoiceContact.society"
                      render={({ field }) => (
                        <Input aria-label="Societe" {...field} />
                      )}
                    />
                  </FormField>
                  <FormField
                    label="TVA"
                    error={optionalError(errors, ['invoiceContact', 'tva'])}
                  >
                    <Controller
                      control={control}
                      name="optionalServices.invoiceContact.tva"
                      render={({ field }) => (
                        <Input aria-label="TVA" {...field} />
                      )}
                    />
                  </FormField>
                  <FormField
                    label="Adresse"
                    error={optionalError(errors, ['invoiceContact', 'address'])}
                  >
                    <Controller
                      control={control}
                      name="optionalServices.invoiceContact.address"
                      render={({ field }) => (
                        <Input aria-label="Adresse" {...field} />
                      )}
                    />
                  </FormField>
                  <FormField
                    label="Code postal"
                    error={optionalError(errors, ['invoiceContact', 'zip'])}
                  >
                    <Controller
                      control={control}
                      name="optionalServices.invoiceContact.zip"
                      render={({ field }) => (
                        <Input aria-label="Code postal" {...field} />
                      )}
                    />
                  </FormField>
                  <FormField
                    label="Ville"
                    error={optionalError(errors, ['invoiceContact', 'city'])}
                  >
                    <Controller
                      control={control}
                      name="optionalServices.invoiceContact.city"
                      render={({ field }) => (
                        <Input aria-label="Ville" {...field} />
                      )}
                    />
                  </FormField>
                </div>
              ) : null}
            </ServiceRadioCard>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
