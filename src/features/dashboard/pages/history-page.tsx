import { FolderClock } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RequestRecordList } from '@/features/dashboard/components/request-record-list'
import type {
  CurrentUserProfile,
  SocialTitle,
  StoredRequestRecord,
  VisaFileVariation,
  VisaTypeItem,
} from '@/lib/api/types'
import { openExternalUrl } from '@/lib/persistence/external'

interface HistoryPageProps {
  records: StoredRequestRecord[]
  isLoading: boolean
  currentUser?: CurrentUserProfile | null
  socialTitles?: SocialTitle[]
  visaFileVariations?: VisaFileVariation[]
  visaTypes?: VisaTypeItem[]
  onReuseRecord: (
    record: StoredRequestRecord,
    mode: 'history' | 'expired' | 'test',
  ) => void
}

export function HistoryPage({
  records,
  isLoading,
  currentUser,
  socialTitles = [],
  visaFileVariations = [],
  visaTypes = [],
  onReuseRecord,
}: HistoryPageProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-sm text-muted-foreground">
          Chargement de l&apos;historique des demandes...
        </CardContent>
      </Card>
    )
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aucune demande enregistree</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 text-foreground">
            <FolderClock className="h-4 w-4" />
            Les soumissions reussies apparaitront ici automatiquement.
          </div>
          <p>
            Chaque entree conserve le dossier complet pour le retrouver ou le
            reutiliser plus tard.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <RequestRecordList
      records={records}
      scope="history"
      defaultSubmitterFilter={currentUser?.email ?? ''}
      socialTitles={socialTitles}
      visaFileVariations={visaFileVariations}
      visaTypes={visaTypes}
      onReuseRecord={onReuseRecord}
      onOpenConfirmation={(currentRecord) => {
        if (currentRecord.confirmationLocation) {
          void openExternalUrl(currentRecord.confirmationLocation)
        }
      }}
    />
  )
}
