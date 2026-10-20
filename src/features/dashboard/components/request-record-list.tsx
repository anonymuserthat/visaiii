import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  BellOff,
  CalendarClock,
  ExternalLink,
  Info,
  Mail,
  Phone,
  RefreshCcw,
  Search,
  UserRound,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { RequestRecordDetailsDialog } from '@/features/dashboard/components/request-record-details-dialog'
import type {
  SocialTitle,
  StoredRequestRecord,
  VisaFileVariation,
  VisaTypeItem,
} from '@/lib/api/types'
import {
  formatRequestAgeLabel,
  formatRequestAppointmentSummary,
  getSubmitterIdentityKey,
  formatRequestSubmittedAt,
  getRequestPrimaryLabel,
  getRequestSubmitterLabel,
  isRequestExpired,
  normalizeSubmitterEmail,
} from '@/lib/request-records'

type RequestListScope = 'history' | 'expired'
type ReuseMode = 'history' | 'expired' | 'test'

interface RequestRecordListProps {
  records: StoredRequestRecord[]
  scope: RequestListScope
  defaultSubmitterFilter?: string
  socialTitles?: SocialTitle[]
  visaFileVariations?: VisaFileVariation[]
  visaTypes?: VisaTypeItem[]
  onReuseRecord: (record: StoredRequestRecord, mode: ReuseMode) => void
  onOpenConfirmation?: (record: StoredRequestRecord) => void
  onDismissReminder?: (record: StoredRequestRecord) => void
}

function getRequestTravellerSummaries(record: StoredRequestRecord) {
  const snapshotTravellers = record.bookingSnapshot?.travellers ?? []
  const populatedTravellers = snapshotTravellers.filter((traveller) =>
    [
      traveller.firstname,
      traveller.lastname,
      traveller.email,
      traveller.phone,
      traveller.passportNumber,
    ].some((value) => value.trim() !== ''),
  )

  if (populatedTravellers.length === 0) {
    return [
      {
        key: 'primary',
        label: 'Voyageur 1',
        name: getRequestPrimaryLabel(record),
        email: record.primaryTravellerEmail,
        phone: record.primaryTravellerPhone,
      },
    ]
  }

  return populatedTravellers.map((traveller, index) => {
    const fullName = [traveller.firstname, traveller.lastname]
      .filter(Boolean)
      .join(' ')
      .trim()

    return {
      key: traveller.id || `${record.id}-${index}`,
      label: `Voyageur ${index + 1}`,
      name:
        fullName ||
        (index === 0
          ? getRequestPrimaryLabel(record)
          : `Voyageur ${index + 1}`),
      email: traveller.email,
      phone: traveller.phone,
    }
  })
}

function getFormulaLabel(record: StoredRequestRecord) {
  if (record.formula === 'premium') {
    return 'Premium'
  }

  if (record.formula === 'standard') {
    return 'Standard'
  }

  return 'Non definie'
}

function matchesSearch(record: StoredRequestRecord, query: string) {
  if (!query) {
    return true
  }

  const travellerSummaries = getRequestTravellerSummaries(record)
  const haystack = [
    record.primaryTravellerName,
    record.primaryTravellerEmail,
    record.primaryTravellerPhone,
    record.submitterName,
    record.submitterEmail,
    record.centerLabel,
    record.appointmentDate,
    record.appointmentTime,
    getFormulaLabel(record),
    ...travellerSummaries.flatMap((traveller) => [
      traveller.label,
      traveller.name,
      traveller.email,
      traveller.phone,
    ]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(query)
}

function getSubmittedDay(record: StoredRequestRecord) {
  return record.submittedAt.slice(0, 10)
}

export function RequestRecordList({
  records,
  scope,
  defaultSubmitterFilter = '',
  socialTitles = [],
  visaFileVariations = [],
  visaTypes = [],
  onReuseRecord,
  onOpenConfirmation,
  onDismissReminder,
}: RequestRecordListProps) {
  const normalizedDefaultSubmitterFilter = normalizeSubmitterEmail(
    defaultSubmitterFilter,
  )
  const [sortOrder, setSortOrder] = useState('newest')
  const [search, setSearch] = useState('')
  const [centerFilter, setCenterFilter] = useState('')
  const [formulaFilter, setFormulaFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [submitterFilterState, setSubmitterFilterState] = useState(() => ({
    defaultValue: normalizedDefaultSubmitterFilter,
    value: normalizedDefaultSubmitterFilter,
  }))
  const [submittedFrom, setSubmittedFrom] = useState('')
  const [submittedTo, setSubmittedTo] = useState('')
  const [pageSize, setPageSize] = useState('10')
  const [page, setPage] = useState(1)
  const [detailsRecord, setDetailsRecord] =
    useState<StoredRequestRecord | null>(null)
  const submitterFilter =
    submitterFilterState.defaultValue === normalizedDefaultSubmitterFilter
      ? submitterFilterState.value
      : normalizedDefaultSubmitterFilter

  const updateSubmitterFilter = (value: string) => {
    setSubmitterFilterState({
      defaultValue: normalizedDefaultSubmitterFilter,
      value,
    })
  }

  const normalizedSearch = search.trim().toLowerCase()
  const centerOptions = Array.from(
    new Set(records.map((record) => record.centerLabel).filter(Boolean)),
  )
    .sort((left, right) => left.localeCompare(right, 'fr'))
    .map((centerLabel) => ({
      value: centerLabel,
      label: centerLabel,
    }))
  const submitterOptions = Array.from(
    new Map(
      records.map((record) => [
        getSubmitterIdentityKey({
          submitterEmail: record.submitterEmail,
          submitterName: record.submitterName,
          fallbackId: record.id,
        }),
        {
          value: getSubmitterIdentityKey({
            submitterEmail: record.submitterEmail,
            submitterName: record.submitterName,
            fallbackId: record.id,
          }),
          label: getRequestSubmitterLabel(record),
        },
      ]),
    ).values(),
  ).sort((left, right) => left.label.localeCompare(right.label, 'fr'))

  const filteredRecords = useMemo(
    () =>
      records
        .filter((record) => {
          const expired = isRequestExpired(record)
          const submittedDay = getSubmittedDay(record)
          const submitterValue = getSubmitterIdentityKey({
            submitterEmail: record.submitterEmail,
            submitterName: record.submitterName,
            fallbackId: record.id,
          })

          if (!matchesSearch(record, normalizedSearch)) {
            return false
          }

          if (centerFilter && record.centerLabel !== centerFilter) {
            return false
          }

          if (formulaFilter && record.formula !== formulaFilter) {
            return false
          }

          if (statusFilter === 'expired' && !expired) {
            return false
          }

          if (statusFilter === 'recent' && expired) {
            return false
          }

          if (submitterFilter && submitterValue !== submitterFilter) {
            return false
          }

          if (submittedFrom && submittedDay < submittedFrom) {
            return false
          }

          if (submittedTo && submittedDay > submittedTo) {
            return false
          }

          return true
        })
        .sort((left, right) =>
          sortOrder === 'name'
            ? getRequestPrimaryLabel(left).localeCompare(
                getRequestPrimaryLabel(right),
                'fr',
              )
            : sortOrder === 'oldest'
              ? left.submittedAt.localeCompare(right.submittedAt)
              : right.submittedAt.localeCompare(left.submittedAt),
        ),
    [
      sortOrder,
      centerFilter,
      formulaFilter,
      normalizedSearch,
      records,
      statusFilter,
      submittedFrom,
      submittedTo,
      submitterFilter,
    ],
  )

  const currentPageSize = Number.parseInt(pageSize, 10) || 10
  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / currentPageSize),
  )
  const currentPage = Math.min(page, totalPages)
  const pagedRecords = filteredRecords.slice(
    (currentPage - 1) * currentPageSize,
    currentPage * currentPageSize,
  )
  const rangeStart =
    filteredRecords.length === 0 ? 0 : (currentPage - 1) * currentPageSize + 1
  const rangeEnd = Math.min(
    filteredRecords.length,
    currentPage * currentPageSize,
  )

  const hasActiveFilters = Boolean(
    search.trim() ||
    centerFilter ||
    formulaFilter ||
    statusFilter ||
    submitterFilter ||
    submittedFrom ||
    submittedTo,
  )

  return (
    <>
      <Card className="records-workspace">
        <CardContent className="space-y-3 px-3 pb-3 pt-3">
          <div className="flex flex-col gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                aria-label="Recherche dans les demandes"
                className="pl-9"
                placeholder="Rechercher voyageur, utilisateur, email, téléphone, centre..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
              />
            </div>
            <details className="record-filters">
              <summary>Affiner la recherche</summary>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                <Select
                  aria-label="Filtrer par centre"
                  value={centerFilter}
                  placeholder="Tous les centres"
                  options={centerOptions}
                  onChange={(event) => {
                    setCenterFilter(event.target.value)
                    setPage(1)
                  }}
                />
                <Select
                  aria-label="Filtrer par formule"
                  value={formulaFilter}
                  placeholder="Toutes les formules"
                  options={[
                    { value: 'standard', label: 'Standard' },
                    { value: 'premium', label: 'Premium' },
                  ]}
                  onChange={(event) => {
                    setFormulaFilter(event.target.value)
                    setPage(1)
                  }}
                />
                <Select
                  aria-label="Filtrer par statut"
                  value={statusFilter}
                  placeholder={
                    scope === 'expired'
                      ? 'Toutes les lignes'
                      : 'Tous les statuts'
                  }
                  options={[
                    { value: 'expired', label: 'Expirées' },
                    { value: 'recent', label: 'Récentes' },
                  ]}
                  onChange={(event) => {
                    setStatusFilter(event.target.value)
                    setPage(1)
                  }}
                />
                <Select
                  aria-label="Filtrer par utilisateur"
                  value={submitterFilter}
                  placeholder="Tous les utilisateurs"
                  options={submitterOptions}
                  onChange={(event) => {
                    updateSubmitterFilter(event.target.value)
                    setPage(1)
                  }}
                />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Soumis à partir du
                  </p>
                  <Input
                    aria-label="Date de soumission a partir de"
                    type="date"
                    value={submittedFrom}
                    onChange={(event) => {
                      setSubmittedFrom(event.target.value)
                      setPage(1)
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Soumis jusqu'au
                  </p>
                  <Input
                    aria-label="Date de soumission jusqu'a"
                    type="date"
                    value={submittedTo}
                    min={submittedFrom || undefined}
                    onChange={(event) => {
                      setSubmittedTo(event.target.value)
                      setPage(1)
                    }}
                  />
                </div>
              </div>
            </details>
          </div>

          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span>
                {filteredRecords.length} résultat
                {filteredRecords.length > 1 ? 's' : ''}
              </span>
              {filteredRecords.length > 0 ? (
                <span>
                  Affichage {rangeStart}-{rangeEnd}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                aria-label="Trier les demandes"
                value={sortOrder}
                options={[
                  { value: 'newest', label: 'Plus récentes' },
                  { value: 'oldest', label: 'Plus anciennes' },
                  { value: 'name', label: 'Nom du demandeur' },
                ]}
                onChange={(event) => {
                  setSortOrder(event.target.value)
                  setPage(1)
                }}
              />
              <Select
                aria-label="Nombre de lignes par page"
                className="min-w-[120px]"
                value={pageSize}
                options={[
                  { value: '10', label: '10 / page' },
                  { value: '25', label: '25 / page' },
                  { value: '50', label: '50 / page' },
                ]}
                onChange={(event) => {
                  setPageSize(event.target.value)
                  setPage(1)
                }}
              />
              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch('')
                    setCenterFilter('')
                    setFormulaFilter('')
                    setStatusFilter('')
                    updateSubmitterFilter('')
                    setSubmittedFrom('')
                    setSubmittedTo('')
                    setPage(1)
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              ) : null}
            </div>
          </div>

          <div className="record-table-heading">
            <span>Demandeur</span>
            <span>Centre</span>
            <span>Rendez-vous</span>
            <span>Soumission</span>
            <span>Actions</span>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="rounded-md border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
              Aucune demande ne correspond a la recherche ou aux filtres actifs.
            </div>
          ) : (
            <div className="divide-y divide-border/70">
              {pagedRecords.map((record) => {
                const expired = isRequestExpired(record)
                const travellerSummaries = getRequestTravellerSummaries(record)
                const reuseMode: ReuseMode =
                  scope === 'expired'
                    ? expired
                      ? 'expired'
                      : 'test'
                    : 'history'

                return (
                  <div key={record.id} className="record-row">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-semibold text-foreground">
                          {getRequestPrimaryLabel(record)}
                        </p>
                        <Badge variant="secondary">
                          {getFormulaLabel(record)}
                        </Badge>
                        {expired ? (
                          <Badge variant="outline">Expirée</Badge>
                        ) : null}
                        {scope === 'expired' && !expired ? (
                          <Badge variant="outline">Mode test</Badge>
                        ) : null}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {record.primaryTravellerEmail ||
                            'Email non renseigne'}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {record.primaryTravellerPhone ||
                            'Téléphone non renseigne'}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <UserRound className="h-4 w-4" />
                          {getRequestSubmitterLabel(record)}
                        </span>
                      </div>
                      {travellerSummaries.length > 1 ? (
                        <details className="record-travellers">
                          <summary>
                            Tous les voyageurs ({travellerSummaries.length})
                          </summary>
                          <div className="mt-2 space-y-2">
                            {travellerSummaries.map((traveller) => (
                              <div key={traveller.key} className="text-xs">
                                <p className="font-medium">
                                  {traveller.label}: {traveller.name}
                                </p>
                                <p className="text-muted-foreground">
                                  {[traveller.email, traveller.phone]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </p>
                              </div>
                            ))}
                          </div>
                        </details>
                      ) : null}
                    </div>

                    <div className="text-sm">
                      <p className="font-medium text-foreground">
                        {record.centerLabel}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        {record.travellerCount} voyageur
                        {record.travellerCount > 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="text-sm">
                      <p className="inline-flex items-center gap-2 font-medium text-foreground">
                        <CalendarClock className="h-4 w-4 text-muted-foreground" />
                        {formatRequestAppointmentSummary(record)}
                      </p>
                    </div>

                    <div className="space-y-1 text-sm">
                      <p className="font-medium text-foreground">
                        {formatRequestSubmittedAt(record)}
                      </p>
                      <p className="text-muted-foreground">
                        {formatRequestAgeLabel(record)}
                      </p>
                      <p className="text-muted-foreground">
                        Créée par {getRequestSubmitterLabel(record)}
                      </p>
                    </div>

                    <div className="record-actions">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onReuseRecord(record, reuseMode)}
                      >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        {reuseMode === 'test'
                          ? 'Tester'
                          : scope === 'expired'
                            ? 'Relancer'
                            : 'Recharger'}
                      </Button>
                      {record.confirmationLocation && onOpenConfirmation ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => onOpenConfirmation(record)}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Confirmation
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setDetailsRecord(record)}
                      >
                        <Info className="mr-2 h-4 w-4" />
                        Détails
                      </Button>
                      {expired &&
                      !record.dismissedReminderAt &&
                      onDismissReminder ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onDismissReminder(record)}
                        >
                          <BellOff className="mr-2 h-4 w-4" />
                          Masquer
                        </Button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {filteredRecords.length > currentPageSize ? (
            <div className="flex flex-col gap-2 border-t border-border/60 pt-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                Page {currentPage} sur {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(Math.max(1, currentPage - 1))}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Précédent
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                >
                  Suivant
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <RequestRecordDetailsDialog
        record={detailsRecord}
        open={Boolean(detailsRecord)}
        socialTitles={socialTitles}
        visaFileVariations={visaFileVariations}
        visaTypes={visaTypes}
        onOpenChange={(open) => {
          if (!open) {
            setDetailsRecord(null)
          }
        }}
      />
    </>
  )
}
