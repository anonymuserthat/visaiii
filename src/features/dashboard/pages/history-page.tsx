import { FolderClock } from 'lucide-react'

import { EmptyState } from '@/components/workspace/empty-state'
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
  visaTypesByCenter?: Record<string, VisaTypeItem[]>
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
  visaTypesByCenter = {},
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
        <EmptyState
          icon={<FolderClock size={28} strokeWidth={1.5} />}
          title="Votre historique commence ici"
        >
          <p>
            Vos demandes soumises apparaîtront ici. Vous pourrez consulter
            chaque dossier, retrouver une confirmation et réutiliser les
            informations des voyageurs.
          </p>
        </EmptyState>
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
      visaTypesByCenter={visaTypesByCenter}
      onReuseRecord={onReuseRecord}
      onOpenConfirmation={(currentRecord) => {
        if (currentRecord.confirmationLocation) {
          void openExternalUrl(currentRecord.confirmationLocation)
        }
      }}
    />
  )
}
