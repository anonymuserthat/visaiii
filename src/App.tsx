import { useEffect, useRef, useState } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import {
  ChartColumnBig,
  House,
  ArrowRight,
  ClipboardList,
  ClockArrowUp,
  LifeBuoy,
  LoaderCircle,
  Mail,
  CloudOff,
  PlusSquare,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CurrentUserDialog } from '@/features/dashboard/components/current-user-dialog'
import { BookingShell } from '@/features/booking/booking-shell'
import { HomePage } from '@/features/dashboard/pages/home-page'
import { ContactPage } from '@/features/dashboard/pages/contact-page'
import { ExpiredPage } from '@/features/dashboard/pages/expired-page'
import { GmailPage } from '@/features/dashboard/pages/gmail-page'
import { HistoryPage } from '@/features/dashboard/pages/history-page'
import { StatisticsPage } from '@/features/dashboard/pages/statistics-page'
import { bookingClient } from '@/lib/api/bookingClient'
import { useRequestRecordsQuery } from '@/lib/api/hooks'
import type { CurrentUserProfile } from '@/lib/api/types'
import { RUNTIME_CONFIG } from '@/lib/config'
import {
  getPendingExpiryReminders,
  getRequestPrimaryLabel,
  getRequestStatistics,
  isRequestExpired,
  prepareRequestForResubmission,
} from '@/lib/request-records'
import { useBookingStore } from '@/lib/state/store'
import { isTauriEnvironment } from '@/lib/utils'

type AppPage =
  | 'home'
  | 'new-request'
  | 'history'
  | 'expired'
  | 'statistics'
  | 'contact'
  | 'gmail'

const EMPTY_CURRENT_USER: CurrentUserProfile = {
  name: '',
  email: '',
}

function App() {
  const hydrateDraft = useBookingStore((state) => state.hydrateDraft)
  const resetDraft = useBookingStore((state) => state.resetDraft)
  const setCurrentStep = useBookingStore((state) => state.setCurrentStep)
  const markStepCompleted = useBookingStore(
    (state) => state.markStepCompleted,
  )
  const clearSubmission = useBookingStore((state) => state.clearSubmission)
  const setSelectedCenterId = useBookingStore(
    (state) => state.setSelectedCenterId,
  )
  const socialTitles = useBookingStore((state) => state.socialTitles)
  const visaFileVariations = useBookingStore(
    (state) => state.visaFileVariations,
  )
  const visaTypes = useBookingStore((state) => state.visaTypes)
  const requestRecordsQuery = useRequestRecordsQuery()
  const requestRecords = requestRecordsQuery.data ?? []
  const recordsReady =
    !requestRecordsQuery.isLoading && !requestRecordsQuery.isError
  const expiredRecords = requestRecords.filter((record) =>
    isRequestExpired(record),
  )
  const requestStatistics = getRequestStatistics(requestRecords)
  const pendingReminders = getPendingExpiryReminders(requestRecords)
  const reminderSignatureRef = useRef('')
  const [activePage, setActivePage] = useState<AppPage>('home')
  const [currentUser, setCurrentUser] = useState<CurrentUserProfile | null>(
    null,
  )
  const [currentUserDraft, setCurrentUserDraft] =
    useState<CurrentUserProfile>(EMPTY_CURRENT_USER)
  const [currentUserLoaded, setCurrentUserLoaded] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isClosePromptOpen, setIsClosePromptOpen] = useState(false)
  const confirmedCloseRef = useRef(false)

  useEffect(() => {
    if (!isTauriEnvironment()) {
      // Browsers only permit their standard, non-customizable close prompt.
      const beforeUnload = (event: BeforeUnloadEvent) => {
        event.preventDefault()
        event.returnValue = ''
      }
      window.addEventListener('beforeunload', beforeUnload)
      return () => window.removeEventListener('beforeunload', beforeUnload)
    }

    const appWindow = getCurrentWindow()
    let disposed = false
    let unlisten: (() => void) | undefined

    void appWindow
      .onCloseRequested((event) => {
        if (confirmedCloseRef.current) return
        event.preventDefault()
        setIsClosePromptOpen(true)
      })
      .then((stop) => {
        if (disposed) stop()
        else unlisten = stop
      })
      .catch((error) => {
        console.error(
          'Impossible de protéger la fermeture de la fenêtre',
          error,
        )
      })

    return () => {
      disposed = true
      unlisten?.()
    }
  }, [])

  async function confirmClose() {
    confirmedCloseRef.current = true
    try {
      await getCurrentWindow().destroy()
    } catch (error) {
      confirmedCloseRef.current = false
      toast.error(`Fermeture impossible : ${String(error)}`)
    }
  }

  useEffect(() => {
    let isDisposed = false

    void bookingClient
      .loadCurrentUserProfile()
      .then((profile) => {
        if (isDisposed) {
          return
        }

        setCurrentUser(profile)
        setCurrentUserDraft(profile ?? EMPTY_CURRENT_USER)
      })
      .catch((error) => {
        console.error(error)
        if (!isDisposed) {
          toast.error("Impossible de charger l'utilisateur actif.")
        }
      })
      .finally(() => {
        if (!isDisposed) {
          setCurrentUserLoaded(true)
        }
      })

    return () => {
      isDisposed = true
    }
  }, [])

  useEffect(() => {
    if (pendingReminders.length === 0) {
      reminderSignatureRef.current = ''
      return
    }

    const signature = pendingReminders.map((record) => record.id).join('|')
    if (signature === reminderSignatureRef.current) {
      return
    }

    reminderSignatureRef.current = signature
    toast.warning(
      `${pendingReminders.length} dossier(s) ont dépassé 30 jours.`,
      {
        description: `${getRequestPrimaryLabel(pendingReminders[0])} peut être repris depuis la page Demandes expirées.`,
      },
    )
  }, [pendingReminders])

  async function handleReuseRecord(
    record: (typeof requestRecords)[number],
    mode: 'history' | 'expired' | 'test' = 'history',
  ) {
    const nextDraft = prepareRequestForResubmission(record)
    try {
      await bookingClient.saveDraft({
        version: RUNTIME_CONFIG.draftVersion,
        updatedAt: new Date().toISOString(),
        values: nextDraft,
      })
    } catch (error) {
      console.error(error)
    }
    resetDraft()
    hydrateDraft(nextDraft)
    setSelectedCenterId(nextDraft.area)
    markStepCompleted(1)
    markStepCompleted(2)
    markStepCompleted(3)
    setCurrentStep(4)
    clearSubmission()
    setActivePage('new-request')
    toast.success(
      mode === 'test'
        ? 'Mode test actif. Le dossier a été repris comme une demande expirée : reprenez directement le rendez-vous et le reCAPTCHA.'
        : 'Le dossier a été repris. Reprenez le rendez-vous et le reCAPTCHA avant la nouvelle soumission.',
    )
  }

  async function handleDismissReminder(
    record: (typeof requestRecords)[number],
  ) {
    await bookingClient.dismissRequestReminder(record.id)
    await requestRecordsQuery.refetch()
    toast.success('Le rappel a été masqué pour ce dossier.')
  }

  async function handleSaveCurrentUser(profile: CurrentUserProfile) {
    await bookingClient.saveCurrentUserProfile(profile)
    setCurrentUser(profile)
    setCurrentUserDraft(profile)
    setIsProfileOpen(false)
    toast.success('Votre profil a été enregistré.')
  }

  function navigate(page: AppPage) {
    setActivePage(page)
    setIsProfileOpen(
      page === 'new-request' && currentUserLoaded && !currentUser,
    )
  }

  const navigationItems = [
    { id: 'home', label: 'Accueil', hint: 'Espace personnel', icon: House },
    {
      id: 'new-request',
      label: 'Nouvelle demande',
      hint: 'Flux actuel',
      icon: PlusSquare,
    },
    {
      id: 'history',
      label: 'Historique',
      hint: `${requestRecords.length} dossier(s)`,
      icon: ClipboardList,
    },
    {
      id: 'expired',
      label: 'Demandes expirées',
      hint: `${expiredRecords.length} à revoir`,
      icon: ClockArrowUp,
    },
    {
      id: 'statistics',
      label: 'Statistiques',
      hint: `${requestStatistics.monthCount} ce mois`,
      icon: ChartColumnBig,
    },
    { id: 'gmail', label: 'Messagerie', hint: 'Gmail', icon: Mail },
    {
      id: 'contact',
      label: 'Assistance',
      hint: 'Contact',
      icon: LifeBuoy,
    },
  ] as const

  const pageCopy: Record<AppPage, { title: string; description: string }> = {
    home: {
      title: 'Bienvenue sur ProVisa',
      description:
        'Un espace simple pour préparer vos demandes et suivre chaque dossier.',
    },
    'new-request': {
      title: 'Nouvelle demande',
      description:
        'Préparez le dossier, vérifiez les informations et transmettez votre demande.',
    },
    history: {
      title: 'Historique des demandes',
      description: 'Recherchez, consultez ou reprenez un dossier enregistré.',
    },
    expired: {
      title: 'Demandes expirées',
      description:
        'Les dossiers de plus de 30 jours restent disponibles pour une nouvelle demande.',
    },
    statistics: {
      title: 'Statistiques',
      description:
        'Suivez votre activité et la répartition des demandes enregistrées.',
    },
    gmail: {
      title: 'Messagerie',
      description:
        'Consultez les messages de votre compte Gmail en lecture seule.',
    },
    contact: {
      title: 'Assistance',
      description:
        'Retrouvez les coordonnées du développeur et les repères utiles.',
    },
  }

  const showRecordFeedback =
    ['history', 'expired', 'statistics'].includes(activePage) && !recordsReady

  return (
    <main className="app-shell">
      <a className="skip-link" href="#workspace">
        Aller au contenu
      </a>
      <div className="app-frame">
        <div className="app-layout">
          <aside
            className="app-navigation"
            aria-label="Navigation principale"
          >
            <div className="app-brand">
              <span className="brand-symbol" aria-hidden="true">
                P
              </span>
              <div>
                <strong>ProVisa</strong>
                <small>Votre espace visa</small>
              </div>
            </div>
            <div className="nav-section-label">Votre espace</div>
            <nav aria-label="Dossiers">
              <div className="nav-items">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activePage === item.id

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`nav-item ${isActive ? 'is-active' : ''}`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>
                          <span className="nav-label">{item.label}</span>
                          {recordsReady &&
                          (item.id === 'history' || item.id === 'expired') &&
                          (item.id === 'history'
                            ? requestRecords.length
                            : expiredRecords.length) > 0 ? (
                            <span className="nav-count">
                              {item.id === 'history'
                                ? requestRecords.length
                                : expiredRecords.length}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </nav>
            <div className="sidebar-bottom">
              <button
                type="button"
                className="profile-trigger"
                onClick={() => setIsProfileOpen(true)}
                disabled={!currentUserLoaded}
                aria-haspopup="dialog"
              >
                <UserRound className="h-4 w-4" aria-hidden="true" />
                <span>{currentUser?.name ?? 'Votre profil'}</span>
                <small>Compte</small>
              </button>
              <div className="navigation-footer">
                <span className="mode-dot" />
                {RUNTIME_CONFIG.mockMode
                  ? 'Démonstration locale'
                  : 'Connexion Capago'}
                <small>ProVisa · 0.2.0</small>
              </div>
            </div>
          </aside>

          <section id="workspace" className="workspace" tabIndex={-1}>
            <div className="workspace-utility">
              <span>
                Votre espace personnel <span aria-hidden="true">/</span>{' '}
                {activePage === 'home'
                  ? 'Accueil'
                  : pageCopy[activePage].title}
              </span>
              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                disabled={!currentUserLoaded}
                aria-haspopup="dialog"
              >
                <UserRound size={16} aria-hidden="true" />
                {currentUser?.name ?? 'Mon compte'}
              </button>
            </div>
            <header className="workspace-header">
              <div>
                <h1>{pageCopy[activePage].title}</h1>
                <p>{pageCopy[activePage].description}</p>
              </div>
              {activePage === 'home' ? (
                <Button type="button" onClick={() => navigate('new-request')}>
                  <PlusSquare size={16} className="mr-2" />
                  Nouvelle demande
                </Button>
              ) : (
                <span className="workspace-context">
                  {!recordsReady ? (
                    requestRecordsQuery.isError ? (
                      'Dossiers indisponibles'
                    ) : (
                      'Chargement des dossiers…'
                    )
                  ) : (
                    <>
                      {requestStatistics.totalCount} dossier
                      {requestStatistics.totalCount > 1 ? 's' : ''} enregistré
                      {requestStatistics.totalCount > 1 ? 's' : ''}
                    </>
                  )}
                </span>
              )}
            </header>
            {showRecordFeedback ? (
              <div
                className="empty-state"
                role={requestRecordsQuery.isError ? 'alert' : 'status'}
              >
                {requestRecordsQuery.isError ? (
                  <CloudOff size={28} aria-hidden="true" />
                ) : (
                  <LoaderCircle
                    size={28}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                )}
                <h2>
                  {requestRecordsQuery.isError
                    ? 'Vos dossiers ne sont pas disponibles'
                    : 'Chargement de vos dossiers'}
                </h2>
                <p>
                  {requestRecordsQuery.isError
                    ? 'Impossible de lire les demandes pour le moment. Réessayez pour afficher leur état.'
                    : 'Vos demandes et leurs informations vont apparaître ici.'}
                </p>
                {requestRecordsQuery.isError ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={requestRecordsQuery.isFetching}
                    onClick={() => void requestRecordsQuery.refetch()}
                  >
                    {requestRecordsQuery.isFetching
                      ? 'Chargement…'
                      : 'Réessayer'}
                  </Button>
                ) : null}
              </div>
            ) : null}
            {activePage === 'home' ? (
              <HomePage
                records={requestRecords}
                isLoading={requestRecordsQuery.isLoading}
                error={requestRecordsQuery.isError}
                onRetry={() => void requestRecordsQuery.refetch()}
                currentUser={currentUser}
                onCreate={() => navigate('new-request')}
                onHistory={() => navigate('history')}
                onExpired={() => navigate('expired')}
                onReuse={handleReuseRecord}
              />
            ) : null}
            {activePage === 'new-request' ? (
              !currentUserLoaded ? (
                <Card>
                  <CardContent className="py-10 text-sm text-muted-foreground">
                    Chargement de l&apos;utilisateur actif...
                  </CardContent>
                </Card>
              ) : currentUser ? (
                <BookingShell currentUser={currentUser} />
              ) : (
                <Card>
                  <CardContent className="space-y-2 py-8 text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground">
                      Configurez d&apos;abord l&apos;utilisateur actif
                    </p>
                    <p>
                      Renseignez votre nom et votre adresse e-mail pour
                      attribuer correctement les nouvelles demandes et
                      préremplir le contact principal.
                    </p>
                    <Button
                      type="button"
                      onClick={() => setIsProfileOpen(true)}
                    >
                      Configurer mon profil{' '}
                      <ArrowRight size={16} className="ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              )
            ) : null}
            {activePage === 'history' && !showRecordFeedback ? (
              <HistoryPage
                records={requestRecords}
                isLoading={requestRecordsQuery.isLoading}
                currentUser={currentUser}
                socialTitles={socialTitles}
                visaFileVariations={visaFileVariations}
                visaTypes={visaTypes}
                onReuseRecord={handleReuseRecord}
              />
            ) : null}
            {activePage === 'expired' && !showRecordFeedback ? (
              <ExpiredPage
                records={expiredRecords}
                allRecords={requestRecords}
                socialTitles={socialTitles}
                visaFileVariations={visaFileVariations}
                visaTypes={visaTypes}
                onReuseRecord={handleReuseRecord}
                onDismissReminder={handleDismissReminder}
              />
            ) : null}
            {activePage === 'statistics' && !showRecordFeedback ? (
              <StatisticsPage stats={requestStatistics} />
            ) : null}
            {activePage === 'contact' ? <ContactPage /> : null}
            {activePage === 'gmail' ? <GmailPage /> : null}
          </section>
        </div>
      </div>
      {isProfileOpen ? (
        <CurrentUserDialog
          draft={currentUserDraft}
          onDraftChange={setCurrentUserDraft}
          onSave={handleSaveCurrentUser}
          onClose={() => setIsProfileOpen(false)}
        />
      ) : null}
      {isClosePromptOpen ? (
        <ConfirmDialog
          title="Quitter l’application ?"
          description="Votre brouillon local reste conservé sur cet appareil."
          confirmLabel="Quitter l’application"
          onCancel={() => setIsClosePromptOpen(false)}
          onConfirm={() => void confirmClose()}
        />
      ) : null}
    </main>
  )
}

export default App
