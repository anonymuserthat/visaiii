import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  BellOff,
  CalendarClock,
  ExternalLink,
  Info,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
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
  visaTypesByCenter?: Record<string, VisaTypeItem[]>
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
  visaTypesByCenter = {},
  onReuseRecord,
  onOpenConfirmation,
  onDismissReminder,
}: RequestRecordListProps) {
  const normalizedDefaultSubmitterFilter = normalizeSubmitterEmail(
    defaultSubmitterFilter,
  )
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
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
      records.filter((record) => {
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
      }),
    [
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
      <Card
        className={`records-workspace records-view-${view} rounded-none border-0 bg-transparent shadow-none`}
      >
        <CardContent className="p-0">
          <div className="records-toolbar">
            <div className="records-workspace-heading">
              <div>
                <h2>
                  {scope === 'expired'
                    ? 'Dossiers à reprendre'
                    : 'Tous les dossiers'}
                </h2>
                <p>Retrouvez un voyageur et reprenez le suivi de sa demande.</p>
              </div>
              <div
                className="records-view-switch"
                aria-label="Présentation des dossiers"
              >
                <button
                  type="button"
                  aria-label="Afficher en cartes"
                  aria-pressed={view === 'grid'}
                  onClick={() => setView('grid')}
                >
                  <LayoutGrid size={17} />
                </button>
                <button
                  type="button"
                  aria-label="Afficher en liste"
                  aria-pressed={view === 'list'}
                  onClick={() => setView('list')}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
            <div className="records-toolbar-top">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  aria-label="Recherche dans les demandes"
                  className="pl-9"
                  placeholder="Rechercher un nom, un email, un centre…"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setPage(1)
                  }}
                />
              </div>
              <span className="hidden whitespace-nowrap text-xs font-medium text-muted-foreground sm:block">
                {records.length} dossiers enregistrés
              </span>
            </div>
            <div className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                  scope === 'expired' ? 'Toutes les lignes' : 'Tous les statuts'
                }
                options={[
                  { value: 'expired', label: 'Expirees' },
                  { value: 'recent', label: 'Recentes' },
                ]}
                onChange={(event) => {
                  setStatusFilter(event.target.value)
                  setPage(1)
                }}
              />
              <Button
                type="button"
                variant="secondary"
                className="h-10"
                aria-expanded={showAdvancedFilters}
                aria-controls="advanced-request-filters"
                onClick={() => setShowAdvancedFilters((value) => !value)}
              >
                <SlidersHorizontal size={14} />
                Filtres avancés
                {submitterFilter || submittedFrom || submittedTo ? (
                  <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary" />
                ) : null}
              </Button>
            </div>
            <div
              id="advanced-request-filters"
              hidden={!showAdvancedFilters}
              className="mt-4 border-t pt-4"
            >
              <div className="grid items-end gap-3 sm:grid-cols-3">
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
                <div className="space-y-1 ">
                  <p className="text-[10px] text-muted-foreground">
                    Soumis a partir du
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
                <div className="space-y-1 ">
                  <p className="text-[10px] text-muted-foreground">
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
            </div>
          </div>

          <div className="flex flex-col gap-2 px-5 py-3 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {submitterFilter ? (
                <Badge variant="secondary">
                  Utilisateur :{' '}
                  {submitterOptions.find(
                    (option) => option.value === submitterFilter,
                  )?.label || submitterFilter}
                </Badge>
              ) : null}
              <span>
                {filteredRecords.length} resultat
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
                  Reinitialiser les filtres
                </Button>
              ) : null}
            </div>
          </div>

          <div className="record-columns" aria-hidden="true">
            <span>Demandeur</span>
            <span>Centre & rendez-vous</span>
            <span>Soumission</span>
            <span className="text-right">Actions</span>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="record-empty">
              Aucune demande ne correspond a la recherche ou aux filtres actifs.
            </div>
          ) : (
            <div className="records-collection">
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
                  <article
                    key={record.id}
                    className="record-row"
                    aria-label={`Dossier ${getRequestPrimaryLabel(record)}`}
                  >
                    <div className="record-primary">
                      <span className="record-avatar" aria-hidden="true">
                        {getRequestPrimaryLabel(record)
                          .split(' ')
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join('')
                          .toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="record-name">
                          {getRequestPrimaryLabel(record)}
                        </p>
                        <div className="record-meta">
                          <p>
                            {record.primaryTravellerEmail ||
                              'Email non renseigné'}
                          </p>
                          <p>
                            {record.primaryTravellerPhone ||
                              'Téléphone non renseigné'}
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="secondary">
                            {getFormulaLabel(record)}
                          </Badge>
                          <span
                            className={`record-status ${expired ? 'is-expired' : ''}`}
                          >
                            {expired ? 'À relancer' : 'Récente'}
                          </span>
                          {scope === 'expired' && !expired ? (
                            <Badge variant="outline">Mode test</Badge>
                          ) : null}
                        </div>
                        {travellerSummaries.length > 1 ? (
                          <details
                            className="record-travellers"
                            open={
                              normalizedSearch
                                ? travellerSummaries.some((traveller) =>
                                    [
                                      traveller.name,
                                      traveller.email,
                                      traveller.phone,
                                    ].some((value) =>
                                      value
                                        ?.toLowerCase()
                                        .includes(normalizedSearch),
                                    ),
                                  )
                                : undefined
                            }
                          >
                            <summary>
                              Tous les voyageurs · {travellerSummaries.length}
                            </summary>
                            <div className="space-y-2">
                              {travellerSummaries.map((traveller) => (
                                <div
                                  key={traveller.key}
                                  className="rounded-md bg-slate-50 p-2"
                                >
                                  <p className="font-medium">
                                    {traveller.label}: {traveller.name}
                                  </p>
                                  <p className="record-meta">
                                    {traveller.email}
                                    {traveller.email && traveller.phone
                                      ? ' · '
                                      : ''}
                                    {traveller.phone}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </details>
                        ) : null}
                      </div>
                    </div>
                    <div className="record-appointment">
                      <p className="record-field-label">CENTRE & RENDEZ-VOUS</p>
                      <p className="record-cell-title">{record.centerLabel}</p>
                      <p className="record-meta">
                        {record.travellerCount} voyageur
                        {record.travellerCount > 1 ? 's' : ''}
                      </p>
                      <div className="record-meta flex items-start gap-1.5">
                        <CalendarClock size={13} className="mt-1 shrink-0" />
                        <span>{formatRequestAppointmentSummary(record)}</span>
                      </div>
                    </div>
                    <div className="record-submitted">
                      <p className="record-field-label">SOUMISSION</p>
                      <p className="record-cell-title">
                        {formatRequestSubmittedAt(record)}
                      </p>
                      <p className="record-meta">
                        {formatRequestAgeLabel(record)}
                      </p>
                      <p className="record-meta">
                        Par {getRequestSubmitterLabel(record)}
                      </p>
                    </div>
                    <div className="record-actions">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onReuseRecord(record, reuseMode)}
                      >
                        <RefreshCcw size={12} />
                        {reuseMode === 'test'
                          ? 'Tester'
                          : scope === 'expired'
                            ? 'Relancer'
                            : 'Recharger'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setDetailsRecord(record)}
                      >
                        <Info size={12} />
                        Details
                      </Button>
                      {record.confirmationLocation && onOpenConfirmation ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenConfirmation(record)}
                        >
                          <ExternalLink size={12} />
                          Confirmation
                        </Button>
                      ) : null}
                      {expired &&
                      !record.dismissedReminderAt &&
                      onDismissReminder ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onDismissReminder(record)}
                        >
                          <BellOff size={12} />
                          Masquer
                        </Button>
                      ) : null}
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {filteredRecords.length > currentPageSize ? (
            <div className="flex flex-col gap-2 border-t border-border px-5 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
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
                  Precedent
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
        visaTypes={
          detailsRecord
            ? (visaTypesByCenter[detailsRecord.centerId] ?? visaTypes)
            : visaTypes
        }
        onOpenChange={(open) => {
          if (!open) {
            setDetailsRecord(null)
          }
        }}
      />
    </>
  )
}
