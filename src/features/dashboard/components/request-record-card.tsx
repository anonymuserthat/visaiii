import {
  BellOff,
  CalendarClock,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { StoredRequestRecord } from '@/lib/api/types'
import {
  formatRequestAgeLabel,
  formatRequestSubmittedAt,
  getRequestAgeInDays,
  getRequestPrimaryLabel,
  getRequestSubmitterLabel,
} from '@/lib/request-records'

interface RequestRecordCardProps {
  record: StoredRequestRecord
  onReuseRecord: (record: StoredRequestRecord) => void
  onOpenConfirmation?: (record: StoredRequestRecord) => void
  onDismissReminder?: (record: StoredRequestRecord) => void
}

export function RequestRecordCard({
  record,
  onReuseRecord,
  onOpenConfirmation,
  onDismissReminder,
}: RequestRecordCardProps) {
  const ageInDays = getRequestAgeInDays(record)
  const isExpired = ageInDays >= 30

  return (
    <Card className={isExpired ? 'border-amber-200/80 bg-amber-50/40' : ''}>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>{record.centerLabel}</Badge>
              <Badge variant="secondary">
                {record.formula === 'premium' ? 'Premium' : 'Standard'}
              </Badge>
              <Badge variant="outline">{isExpired ? 'Expiree' : 'Historique'}</Badge>
            </div>
            <div>
              <CardTitle>{getRequestPrimaryLabel(record)}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Envoyee le {formatRequestSubmittedAt(record)} avec {record.travellerCount}{' '}
                voyageur{record.travellerCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-border/80 bg-white/80 px-4 py-3 text-right text-sm">
            <p className="font-semibold text-foreground">Soumission</p>
            <p className="text-muted-foreground">{formatRequestAgeLabel(record)}</p>
            <p className="mt-1 text-muted-foreground">
              Creee par {getRequestSubmitterLabel(record)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm">
            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Centre
            </div>
            <p className="font-medium text-foreground">{record.centerLabel}</p>
          </div>
          <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm">
            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              Rendez-vous
            </div>
            <p className="font-medium text-foreground">
              {record.appointmentDate
                ? `${record.appointmentDate}${record.appointmentTime ? `, ${record.appointmentTime}` : ''}`
                : "File d'attente ou a recharger"}
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm">
            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              Email
            </div>
            <p className="font-medium text-foreground">
              {record.primaryTravellerEmail || 'Non renseigne'}
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm">
            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              Telephone
            </div>
            <p className="font-medium text-foreground">
              {record.primaryTravellerPhone || 'Non renseigne'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => onReuseRecord(record)}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reutiliser les infos
          </Button>
          {record.confirmationLocation && onOpenConfirmation ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenConfirmation(record)}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Ouvrir la confirmation
            </Button>
          ) : null}
          {isExpired && !record.dismissedReminderAt && onDismissReminder ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => onDismissReminder(record)}
            >
              <BellOff className="mr-2 h-4 w-4" />
              Masquer le rappel
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
