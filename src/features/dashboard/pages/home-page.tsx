import { useState } from 'react'
import {
  ArrowRight,
  Plus,
  FolderOpen,
  Clock3,
  FileText,
  ChevronRight,
  Search,
  LayoutGrid,
  List,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { RequestRecordDetailsDialog } from '@/features/dashboard/components/request-record-details-dialog'
import { Button } from '@/components/ui/button'
import type { CurrentUserProfile, StoredRequestRecord } from '@/lib/api/types'
import {
  getRequestPrimaryLabel,
  formatRequestSubmittedAt,
  isRequestExpired,
} from '@/lib/request-records'

interface HomePageProps {
  records: StoredRequestRecord[]
  currentUser: CurrentUserProfile | null
  isLoading: boolean
  error: boolean
  onRetry: () => void
  onCreate: () => void
  onHistory: () => void
  onExpired: () => void
  onReuse: (record: StoredRequestRecord) => void
}
export function HomePage({
  records,
  currentUser,
  isLoading,
  error,
  onRetry,
  onCreate,
  onHistory,
  onExpired,
  onReuse,
}: HomePageProps) {
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState<'all' | 'expired'>('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [detailsRecord, setDetailsRecord] =
    useState<StoredRequestRecord | null>(null)
  const query = search.trim().toLocaleLowerCase('fr')
  const filtered = records.filter(
    (record) =>
      (scope !== 'expired' || isRequestExpired(record)) &&
      [
        getRequestPrimaryLabel(record),
        record.centerLabel,
        record.primaryTravellerEmail,
      ]
        .join(' ')
        .toLocaleLowerCase('fr')
        .includes(query),
  )
  const recent = [...filtered]
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, 6)
  const expired = records.filter((record) => isRequestExpired(record))
  return (
    <div className="home-workspace">
      <section className="home-requests" aria-labelledby="my-requests-title">
        <header>
          <div>
            <h2 id="my-requests-title">Mes demandes</h2>
            <p>
              {currentUser
                ? `L’espace de travail de ${currentUser.name}`
                : 'Vos dossiers, prêts à être retrouvés.'}
            </p>
          </div>
          {records.length ? (
            <button type="button" onClick={onHistory}>
              Tout voir <ChevronRight size={16} />
            </button>
          ) : null}
        </header>
        {records.length > 0 && !error ? (
          <div className="home-library-toolbar">
            <div
              className="library-tabs"
              role="group"
              aria-label="Filtrer les demandes"
            >
              <button
                type="button"
                aria-pressed={scope === 'all'}
                onClick={() => setScope('all')}
              >
                Toutes les demandes <span>{records.length}</span>
              </button>
              <button
                type="button"
                aria-pressed={scope === 'expired'}
                onClick={() => setScope('expired')}
              >
                À renouveler <span>{expired.length}</span>
              </button>
            </div>
            <div className="library-controls">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-3 text-muted-foreground pointer-events-none"
                />
                <Input
                  aria-label="Rechercher mes demandes"
                  placeholder="Rechercher un dossier"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                />
              </div>
              <div
                className="library-view"
                role="group"
                aria-label="Présentation des demandes"
              >
                <button
                  type="button"
                  aria-label="Afficher en grille"
                  aria-pressed={view === 'grid'}
                  onClick={() => setView('grid')}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Afficher en liste"
                  aria-pressed={view === 'list'}
                  onClick={() => setView('list')}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {isLoading ? (
          <div className="home-empty" role="status">
            Chargement de vos dossiers…
          </div>
        ) : error ? (
          <div className="home-empty" role="alert">
            <h3>Vos dossiers ne sont pas disponibles</h3>
            <p>Réessayez le chargement pour retrouver vos demandes.</p>
            <Button variant="secondary" onClick={onRetry}>
              Réessayer
            </Button>
          </div>
        ) : recent.length ? (
          <div
            className={`home-request-grid ${view === 'list' ? 'is-list' : ''}`}
          >
            {recent.map((record) => (
              <article className="home-request" key={record.id}>
                <div className="home-request-top">
                  <span className="file-symbol">
                    <FileText size={20} strokeWidth={1.5} />
                  </span>
                  <span
                    className={`request-status ${isRequestExpired(record) ? 'is-expired' : ''}`}
                  >
                    {isRequestExpired(record) ? 'À renouveler' : 'Enregistrée'}
                  </span>
                </div>
                <h3>
                  <button
                    type="button"
                    className="request-title-action"
                    aria-label={`Consulter le dossier de ${getRequestPrimaryLabel(record)}`}
                    onClick={() => setDetailsRecord(record)}
                  >
                    {getRequestPrimaryLabel(record)}
                  </button>
                </h3>
                <p>
                  {record.centerLabel} · {record.travellerCount} voyageur
                  {record.travellerCount > 1 ? 's' : ''}
                </p>
                <footer>
                  <time dateTime={record.submittedAt}>
                    {formatRequestSubmittedAt(record)}
                  </time>
                  <button
                    type="button"
                    onClick={() => onReuse(record)}
                    aria-label={`Reprendre le dossier de ${getRequestPrimaryLabel(record)}`}
                  >
                    Reprendre <ArrowRight size={14} />
                  </button>
                </footer>
              </article>
            ))}
          </div>
        ) : records.length > 0 ? (
          <div className="home-empty" role="status">
            <Search size={24} className="mx-auto mb-3 text-muted-foreground" />
            <h3>Aucun dossier trouvé</h3>
            <p>Essayez un autre nom, un autre centre ou retirez le filtre.</p>
            <Button
              variant="secondary"
              onClick={() => {
                setSearch('')
                setScope('all')
              }}
            >
              Effacer la recherche
            </Button>
          </div>
        ) : (
          <div className="home-empty">
            <span className="home-empty-icon">
              <FolderOpen size={32} strokeWidth={1.3} />
            </span>
            <h3>Une place pour chaque dossier</h3>
            <p>
              Vos demandes enregistrées apparaîtront ici. Commencez par préparer
              votre premier dossier.
            </p>
            <Button variant="secondary" onClick={onCreate}>
              <Plus size={16} className="mr-2" />
              Créer ma première demande
            </Button>
          </div>
        )}
      </section>
      {expired.length > 0 ? (
        <button type="button" className="home-expired" onClick={onExpired}>
          <Clock3 size={18} />
          <span>
            <strong>
              {expired.length} dossier{expired.length > 1 ? 's' : ''} à revoir
            </strong>
            <small>
              Les informations sont conservées. Vérifiez-les avant de relancer
              une demande.
            </small>
          </span>
          <ArrowRight size={17} />
        </button>
      ) : null}
      {records.length === 0 && !isLoading && !error ? (
        <div className="home-guide">
          <h2>Votre demande, en quatre étapes</h2>
          <ol>
            {[
              'Choisissez votre centre',
              'Renseignez les voyageurs',
              'Sélectionnez vos services',
              'Vérifiez et transmettez',
            ].map((label, i) => (
              <li key={label}>
                <span>{i + 1}</span>
                {label}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      <RequestRecordDetailsDialog
        record={detailsRecord}
        open={Boolean(detailsRecord)}
        onOpenChange={(open) => {
          if (!open) setDetailsRecord(null)
        }}
      />
    </div>
  )
}
