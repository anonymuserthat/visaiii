import { useEffect, useRef, useState } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import {
  ChartColumnBig,
  ClipboardList,
  ClockArrowUp,
  LifeBuoy,
  Mail,
  PlusSquare,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { BookingShell } from '@/features/booking/booking-shell'
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
  normalizeSubmitterEmail,
  normalizeSubmitterName,
  prepareRequestForResubmission,
} from '@/lib/request-records'
import { useBookingStore } from '@/lib/state/store'
import { isTauriEnvironment } from '@/lib/utils'

type AppPage =
  'new-request' | 'history' | 'expired' | 'statistics' | 'contact' | 'gmail'

const EMPTY_CURRENT_USER: CurrentUserProfile = {
  name: '',
  email: '',
}

function App() {
  const hydrateDraft = useBookingStore((state) => state.hydrateDraft)
  const resetDraft = useBookingStore((state) => state.resetDraft)
  const setCurrentStep = useBookingStore((state) => state.setCurrentStep)
  const markStepCompleted = useBookingStore((state) => state.markStepCompleted)
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
  const expiredRecords = requestRecords.filter((record) =>
    isRequestExpired(record),
  )
  const requestStatistics = getRequestStatistics(requestRecords)
  const pendingReminders = getPendingExpiryReminders(requestRecords)
  const reminderSignatureRef = useRef('')
  const [activePage, setActivePage] = useState<AppPage>('new-request')
  const [currentUser, setCurrentUser] = useState<CurrentUserProfile | null>(
    null,
  )
  const [currentUserDraft, setCurrentUserDraft] =
    useState<CurrentUserProfile>(EMPTY_CURRENT_USER)
  const [currentUserLoaded, setCurrentUserLoaded] = useState(false)
  const [isEditingCurrentUser, setIsEditingCurrentUser] = useState(false)
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
          'Impossible de proteger la fermeture de la fenetre',
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
        setIsEditingCurrentUser(!profile)
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
      `${pendingReminders.length} dossier(s) ont depasse 30 jours.`,
      {
        description: `${getRequestPrimaryLabel(pendingReminders[0])} peut etre recharge depuis la page Expirees.`,
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
        ? 'Mode test actif. Le dossier a ete recharge comme une re-demande expirée: reprenez directement le rendez-vous et le reCAPTCHA.'
        : 'Le dossier a ete recharge. Reprenez le rendez-vous et le reCAPTCHA avant la nouvelle soumission.',
    )
  }

  async function handleDismissReminder(
    record: (typeof requestRecords)[number],
  ) {
    await bookingClient.dismissRequestReminder(record.id)
    await requestRecordsQuery.refetch()
    toast.success('Le rappel a ete masque pour ce dossier.')
  }

  async function handleSaveCurrentUser() {
    const nextName = normalizeSubmitterName(currentUserDraft.name)
    const nextEmail = normalizeSubmitterEmail(currentUserDraft.email)

    if (nextName.length < 2) {
      toast.error("Saisissez le nom de l'utilisateur.")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      toast.error("Saisissez un email valide pour l'utilisateur.")
      return
    }

    const nextProfile = {
      name: nextName,
      email: nextEmail,
    } satisfies CurrentUserProfile

    try {
      await bookingClient.saveCurrentUserProfile(nextProfile)
      setCurrentUser(nextProfile)
      setCurrentUserDraft(nextProfile)
      setIsEditingCurrentUser(false)
      toast.success(
        currentUser
          ? 'Utilisateur actif mis a jour.'
          : 'Utilisateur actif enregistré.',
      )
    } catch (error) {
      console.error(error)
      toast.error("Impossible d'enregistrer l'utilisateur actif.")
    }
  }

  const navigationItems = [
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
      hint: `${expiredRecords.length} a revoir`,
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

  return (
    <main className="app-shell">
      <a className="skip-link" href="#workspace">
        Aller au contenu
      </a>
      <div className="app-frame">
        <div className="app-layout">
          <aside className="app-navigation" aria-label="Navigation principale">
            <div className="app-brand">
              <span className="brand-symbol" aria-hidden="true">
                D<span>V</span>
              </span>
              <div>
                <strong>Damander Visa</strong>
                <small>Espace de travail</small>
              </div>
            </div>
            <div className="nav-section-label">DOSSIERS</div>
            <nav aria-label="Dossiers">
              <div className="nav-items">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activePage === item.id

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActivePage(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`nav-item ${isActive ? 'is-active' : ''}`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>
                          <span className="nav-label">{item.label}</span>
                          {item.id === 'history' || item.id === 'expired' ? (
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
            <div className="navigation-footer">
              <span className="mode-dot" />
              {RUNTIME_CONFIG.mockMode
                ? 'Démonstration locale'
                : 'Connexion Capago'}
              <small>Version 0.2.0</small>
            </div>
          </aside>

          <section id="workspace" className="workspace" tabIndex={-1}>
            <header className="workspace-header">
              <div>
                <p className="eyebrow">
                  DAMANDER /{' '}
                  {activePage === 'new-request' ? 'PRÉPARATION' : 'GESTION'}
                </p>
                <h1>{pageCopy[activePage].title}</h1>
                <p>{pageCopy[activePage].description}</p>
              </div>
              <span className="workspace-context">
                {requestStatistics.totalCount} dossier
                {requestStatistics.totalCount > 1 ? 's' : ''} enregistré
                {requestStatistics.totalCount > 1 ? 's' : ''}
              </span>
            </header>
            <details
              className="profile-settings"
              open={!currentUser || isEditingCurrentUser}
            >
              <summary>
                <UserRound className="h-4 w-4" />
                {currentUser
                  ? `${currentUser.name} · ${currentUser.email}`
                  : 'Configurer votre profil opérateur'}
                <span>Profil et session</span>
              </summary>
              <Card>
                <CardContent className="space-y-3 py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <UserRound className="h-4 w-4 text-primary" />
                    Utilisateur actif
                  </div>

                  {!currentUserLoaded ? (
                    <p className="text-sm text-muted-foreground">
                      Chargement de l&apos;utilisateur...
                    </p>
                  ) : currentUser && !isEditingCurrentUser ? (
                    <>
                      <div className="rounded-lg bg-slate-50 px-3 py-3 text-sm">
                        <p className="font-medium text-foreground">
                          {currentUser.name}
                        </p>
                        <p className="mt-1 inline-flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {currentUser.email}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setCurrentUserDraft(currentUser)
                          setIsEditingCurrentUser(true)
                        }}
                      >
                        Changer l&apos;utilisateur
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {currentUser
                          ? "Mettez a jour le nom ou l'email de l'utilisateur actif."
                          : "Renseignez une premiere fois le nom et l'email de l'utilisateur qui travaille sur cette installation."}
                      </p>
                      <Input
                        aria-label="Nom de l'utilisateur actif"
                        placeholder="Nom complet"
                        value={currentUserDraft.name}
                        onChange={(event) =>
                          setCurrentUserDraft((state) => ({
                            ...state,
                            name: event.target.value,
                          }))
                        }
                      />
                      <Input
                        aria-label="Email de l'utilisateur actif"
                        type="email"
                        placeholder="email@exemple.com"
                        value={currentUserDraft.email}
                        onChange={(event) =>
                          setCurrentUserDraft((state) => ({
                            ...state,
                            email: event.target.value,
                          }))
                        }
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => void handleSaveCurrentUser()}
                        >
                          Enregistrer
                        </Button>
                        {currentUser ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setCurrentUserDraft(currentUser)
                              setIsEditingCurrentUser(false)
                            }}
                          >
                            Annuler
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </details>
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
                      Renseignez votre nom et votre adresse e-mail ci-dessus
                      pour attribuer correctement les nouvelles demandes et
                      pre-remplir le contact principal.
                    </p>
                  </CardContent>
                </Card>
              )
            ) : null}
            {activePage === 'history' ? (
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
            {activePage === 'expired' ? (
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
            {activePage === 'statistics' ? (
              <StatisticsPage stats={requestStatistics} />
            ) : null}
            {activePage === 'contact' ? <ContactPage /> : null}
            {activePage === 'gmail' ? <GmailPage /> : null}
          </section>
        </div>
      </div>
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
