import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RequestRecordList } from '@/features/dashboard/components/request-record-list'
import type {
  SocialTitle,
  StoredRequestRecord,
  VisaFileVariation,
  VisaTypeItem,
} from '@/lib/api/types'
import { openExternalUrl } from '@/lib/persistence/external'

interface ExpiredPageProps {
  records: StoredRequestRecord[]
  allRecords: StoredRequestRecord[]
  socialTitles?: SocialTitle[]
  visaFileVariations?: VisaFileVariation[]
  visaTypes?: VisaTypeItem[]
  onReuseRecord: (
    record: StoredRequestRecord,
    mode: 'history' | 'expired' | 'test',
  ) => void
  onDismissReminder: (record: StoredRequestRecord) => void
}

export function ExpiredPage({
  records,
  allRecords,
  socialTitles = [],
  visaFileVariations = [],
  visaTypes = [],
  onReuseRecord,
  onDismissReminder,
}: ExpiredPageProps) {
  const [testModeEnabled, setTestModeEnabled] = useState(false)
  const visibleRecords = testModeEnabled ? allRecords : records

  if (allRecords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aucune demande expiree</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="h-4 w-4" />
            Les dossiers vieux de 30 jours ou plus apparaitront ici.
          </div>
          <p>
            Quand un dossier devient ancien, vous pourrez recharger toutes les
            informations et refaire uniquement les etapes sensibles comme le
            reCAPTCHA et le choix du rendez-vous.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border-amber-200/80 bg-amber-50/45">
        <CardContent className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1 text-sm text-amber-950">
            <p className="font-semibold">
              {records.length} demande{records.length > 1 ? 's sont' : ' est'} a
              revoir
            </p>
            <p>
              Le bouton de relance recharge le dossier, puis vous laisse refaire
              uniquement le rendez-vous et le reCAPTCHA.
            </p>
            {testModeEnabled ? (
              <p className="text-amber-900/90">
                Mode test actif: les demandes recentes apparaissent aussi ici pour
                tester la re-demande sans attendre 30 jours.
              </p>
            ) : null}
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-amber-200/80 bg-white/80 px-3 py-2 text-sm text-foreground">
            <Checkbox
              checked={testModeEnabled}
              onCheckedChange={(checked) => setTestModeEnabled(Boolean(checked))}
            />
            Tester la re-demande sans attendre 30 jours
          </label>
        </CardContent>
      </Card>

      {visibleRecords.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Aucune demande expiree pour le moment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Les dossiers vieux de 30 jours ou plus apparaitront ici
              automatiquement.
            </p>
            <p>
              Activez le mode test ci-dessus pour voir comment fonctionne la
              re-demande sur un dossier recent.
            </p>
          </CardContent>
        </Card>
      ) : (
        <RequestRecordList
          records={visibleRecords}
          scope="expired"
          socialTitles={socialTitles}
          visaFileVariations={visaFileVariations}
          visaTypes={visaTypes}
          onReuseRecord={onReuseRecord}
          onDismissReminder={onDismissReminder}
          onOpenConfirmation={(currentRecord) => {
            if (currentRecord.confirmationLocation) {
              void openExternalUrl(currentRecord.confirmationLocation)
            }
          }}
        />
      )}
    </div>
  )
}
