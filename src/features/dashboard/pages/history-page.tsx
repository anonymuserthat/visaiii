import { FolderClock } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
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
      <div className="empty-state">
        <FolderClock size={28} aria-hidden="true" />
        <h2>Aucune demande enregistrée</h2>
        <p>
          Les demandes transmises avec succès apparaîtront ici. Vous pourrez
          consulter leur détail ou reprendre un dossier.
        </p>
      </div>
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
