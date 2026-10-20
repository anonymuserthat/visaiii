import {
  ArrowRight,
  Plus,
  FolderOpen,
  Clock3,
  FileText,
  ChevronRight,
} from 'lucide-react'
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
  const recent = [...records]
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, 6)
  const expired = records.filter((record) => isRequestExpired(record))
  return (
    <div className="home-workspace">
      <section className="home-intro">
        <div className="home-intro-icon">
          <FileText size={24} strokeWidth={1.5} />
        </div>
        <div>
          <h2>Votre prochain départ commence ici.</h2>
          <p>
            Préparez les informations des voyageurs, choisissez votre centre et
            retrouvez vos dossiers au même endroit.
          </p>
          <button type="button" onClick={onCreate}>
            Préparer une demande <ArrowRight size={15} />
          </button>
        </div>
      </section>
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
          <div className="home-request-grid">
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
                <h3>{getRequestPrimaryLabel(record)}</h3>
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
    </div>
  )
}
