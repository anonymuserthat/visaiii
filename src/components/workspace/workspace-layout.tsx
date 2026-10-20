import { version as appVersion } from '../../../package.json'
import type { ReactNode } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  ChartNoAxesCombined,
  ChevronRight,
  Files,
  ClockArrowUp,
  LifeBuoy,
  Mail,
  Plus,
  Compass,
  ChevronDown,
  ArrowUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CurrentUserProfile, RequestStatistics } from '@/lib/api/types'
import { RUNTIME_CONFIG } from '@/lib/config'
import { cn } from '@/lib/utils'

export type AppPage =
  'new-request' | 'history' | 'expired' | 'statistics' | 'gmail' | 'contact'
const pages = [
  { id: 'history', label: 'Dossiers', icon: Files },
  { id: 'new-request', label: 'Nouvelle demande', icon: Plus },
  { id: 'expired', label: 'À relancer', icon: ClockArrowUp },
  { id: 'statistics', label: 'Statistiques', icon: ChartNoAxesCombined },
  { id: 'gmail', label: 'Messagerie', icon: Mail },
  { id: 'contact', label: 'Assistance', icon: LifeBuoy },
] as const
const copy: Record<
  AppPage,
  { title: string; description: string; section: string; index: string }
> = {
  history: {
    title: 'Votre espace dossiers.',
    description:
      'Du premier dépôt au prochain départ, gardez le fil de chaque demande.',
    section: 'Gestion des dossiers',
    index: '01',
  },
  'new-request': {
    title: 'Créons votre prochaine demande.',
    description:
      'Quatre étapes pour préparer un dossier complet. Vos informations sont sauvegardées au fil du parcours.',
    section: 'Studio de demande',
    index: '02',
  },
  expired: {
    title: 'La suite de vos demandes.',
    description:
      'Reprenez les dossiers de plus de 30 jours, avec les informations déjà renseignées.',
    section: 'Dossiers à relancer',
    index: '03',
  },
  statistics: {
    title: 'Prenez du recul sur votre activité.',
    description:
      'Volumes, centres et formules : retrouvez les chiffres de vos dossiers enregistrés.',
    section: 'Pilotage de l’activité',
    index: '04',
  },
  gmail: {
    title: 'Vos échanges, sans perdre le fil.',
    description:
      'Retrouvez votre correspondance Gmail dans votre espace de travail.',
    section: 'Messagerie',
    index: '05',
  },
  contact: {
    title: 'Une équipe à votre écoute.',
    description:
      'Un problème à résoudre, une question sur un dossier ? Retrouvez votre contact et les repères utiles.',
    section: 'Centre d’assistance',
    index: '06',
  },
}
interface Props {
  activePage: AppPage
  onNavigate: (page: AppPage) => void
  currentUser: CurrentUserProfile | null
  onOpenAccount: () => void
  stats: RequestStatistics
  isLoading: boolean
  reminderCount: number
  children: ReactNode
}
export function WorkspaceLayout({
  activePage,
  onNavigate,
  currentUser,
  onOpenAccount,
  stats,
  isLoading,
  reminderCount,
  children,
}: Props) {
  const page = copy[activePage]
  return (
    <div className="workspace-shell">
      <a className="skip-link" href="#workspace-content">
        Aller au contenu
      </a>
      <header className="workspace-header">
        <div className="workspace-header-inner">
          <button
            type="button"
            className="workspace-brand"
            onClick={() => onNavigate('history')}
            aria-label="Damander Visa, dossiers"
          >
            <span className="brand-mark">
              <Compass size={25} strokeWidth={1.6} />
            </span>
            <span>
              damander<span className="brand-subtitle">VISA MANAGEMENT</span>
            </span>
          </button>
          <nav
            className="workspace-navigation"
            aria-label="Navigation principale"
          >
            {pages.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  'navigation-item',
                  activePage === item.id && 'is-active',
                )}
                aria-current={activePage === item.id ? 'page' : undefined}
                onClick={() => onNavigate(item.id)}
              >
                <item.icon size={17} strokeWidth={1.7} />
                <span>{item.label}</span>
                {item.id === 'expired' && stats.expiredCount > 0 ? (
                  <span className="navigation-count">{stats.expiredCount}</span>
                ) : null}
              </button>
            ))}
          </nav>
          <button
            type="button"
            className="workspace-account"
            aria-label="Gérer mon profil"
            onClick={onOpenAccount}
          >
            <span className="account-avatar">
              {currentUser?.name.slice(0, 1).toUpperCase() || 'DV'}
            </span>
            <span>
              <strong>{currentUser?.name || 'Mon profil'}</strong>
              <small>Mon espace personnel</small>
            </span>
            <ChevronDown size={15} />
          </button>
        </div>
      </header>
      <main id="workspace-content" className="workspace-content" tabIndex={-1}>
        <div className="workspace-context">
          <div>
            <span>ESPACE DE TRAVAIL</span>
            <ChevronRight size={13} />
            <strong>{page.section}</strong>
          </div>
          <span
            className={cn(
              'mode-indicator',
              RUNTIME_CONFIG.mockMode && 'is-demo',
            )}
          >
            <i />
            {RUNTIME_CONFIG.mockMode ? 'Démonstration' : 'Mode réel'}
          </span>
        </div>
        <section className="workspace-page-heading">
          <div className="page-heading-copy">
            <p className="page-eyebrow">
              <span />
              DAMANDER / {page.index}
            </p>
            <h1>{page.title}</h1>
            <p className="page-description">{page.description}</p>
          </div>
          {activePage !== 'new-request' ? (
            <Button size="lg" onClick={() => onNavigate('new-request')}>
              <Plus size={18} />
              Créer une demande
              <ArrowUpRight size={17} />
            </Button>
          ) : (
            <div className="heading-note">
              <span />
              Brouillon sauvegardé automatiquement
            </div>
          )}
        </section>
        {activePage === 'history' || activePage === 'expired' ? (
          <section
            className="workspace-overview"
            aria-label="Résumé des demandes"
          >
            <div className="overview-total">
              <span className="overview-icon">
                <Files size={27} strokeWidth={1.4} />
              </span>
              <div>
                <span>Votre portefeuille</span>
                <strong>
                  {isLoading ? '—' : stats.totalCount.toLocaleString('fr-FR')}
                  <small>dossiers enregistrés</small>
                </strong>
              </div>
              <ArrowUpRight
                className="overview-decoration"
                aria-hidden="true"
                size={140}
                strokeWidth={0.7}
              />
            </div>
            <div className="overview-stat">
              <span>Ce mois-ci</span>
              <strong>
                {isLoading ? '—' : stats.monthCount.toLocaleString('fr-FR')}
              </strong>
              <small>
                <ArrowUp size={13} />
                Demandes soumises
              </small>
            </div>
            <button
              type="button"
              className="overview-stat overview-action"
              onClick={() => onNavigate('expired')}
            >
              <span>
                À relancer
                <ArrowUpRight size={17} />
              </span>
              <strong>
                {isLoading ? '—' : stats.expiredCount.toLocaleString('fr-FR')}
              </strong>
              <small>Dossiers de plus de 30 jours</small>
            </button>
          </section>
        ) : null}
        {reminderCount > 0 && activePage !== 'expired' ? (
          <div className="expiry-notice">
            <ClockArrowUp size={19} />
            <p>
              <strong>
                {reminderCount} dossier{reminderCount > 1 ? 's' : ''} attendent
                une nouvelle demande.
              </strong>
              <span>
                Retrouvez les informations enregistrées pour les relancer.
              </span>
            </p>
            <button type="button" onClick={() => onNavigate('expired')}>
              Consulter
              <ArrowRight size={17} />
            </button>
          </div>
        ) : null}
        <div key={activePage} className="workspace-page-content">
          {children}
        </div>
        <footer className="workspace-footer">
          <span>
            <Compass size={15} />
            Damander Visa<span>Un espace pour chaque départ.</span>
          </span>
          <span>Version {appVersion}</span>
        </footer>
      </main>
    </div>
  )
}
