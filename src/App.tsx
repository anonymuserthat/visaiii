import { useEffect, useRef, useState } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import {
  BellRing,
  ChartColumnBig,
  ClipboardList,
  ClockArrowUp,
  LifeBuoy,
  LogOut,
  Mail,
  PlusSquare,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { BookingShell } from '@/features/booking/booking-shell'
import { ContactPage } from '@/features/dashboard/pages/contact-page'
import { ExpiredPage } from '@/features/dashboard/pages/expired-page'
import { HistoryPage } from '@/features/dashboard/pages/history-page'
import { StatisticsPage } from '@/features/dashboard/pages/statistics-page'
import { bookingClient } from '@/lib/api/bookingClient'
import { useRequestRecordsQuery } from '@/lib/api/hooks'
import type { CurrentUserProfile } from '@/lib/api/types'
import { RUNTIME_CONFIG } from '@/lib/config'
import { getMessages } from '@/lib/i18n/strings'
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

type AppPage = 'new-request' | 'history' | 'expired' | 'statistics' | 'contact'

const EMPTY_CURRENT_USER: CurrentUserProfile = {
  name: '',
  email: '',
}

function App() {
  const locale = useBookingStore((state) => state.locale)
  const hydrateDraft = useBookingStore((state) => state.hydrateDraft)
  const resetDraft = useBookingStore((state) => state.resetDraft)
  const setCurrentStep = useBookingStore((state) => state.setCurrentStep)
  const markStepCompleted = useBookingStore((state) => state.markStepCompleted)
  const clearSubmission = useBookingStore((state) => state.clearSubmission)
  const setSelectedCenterId = useBookingStore((state) => state.setSelectedCenterId)
  const socialTitles = useBookingStore((state) => state.socialTitles)
  const visaFileVariations = useBookingStore((state) => state.visaFileVariations)
  const visaTypes = useBookingStore((state) => state.visaTypes)
  const copy = getMessages(locale)
  const requestRecordsQuery = useRequestRecordsQuery()
  const requestRecords = requestRecordsQuery.data ?? []
  const expiredRecords = requestRecords.filter((record) => isRequestExpired(record))
  const requestStatistics = getRequestStatistics(requestRecords)
  const pendingReminders = getPendingExpiryReminders(requestRecords)
  const reminderSignatureRef = useRef('')
  const [activePage, setActivePage] = useState<AppPage>('new-request')
  const [currentUser, setCurrentUser] = useState<CurrentUserProfile | null>(null)
  const [currentUserDraft, setCurrentUserDraft] =
    useState<CurrentUserProfile>(EMPTY_CURRENT_USER)
  const [currentUserLoaded, setCurrentUserLoaded] = useState(false)
  const [isEditingCurrentUser, setIsEditingCurrentUser] = useState(false)
  const [isClosePromptOpen, setIsClosePromptOpen] = useState(false)
  const closeCancelButtonRef = useRef<HTMLButtonElement>(null)
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

    void appWindow.onCloseRequested((event) => {
      if (confirmedCloseRef.current) return
      event.preventDefault()
      setIsClosePromptOpen(true)
    }).then((stop) => {
      if (disposed) stop()
      else unlisten = stop
    }).catch((error) => {
      console.error('Impossible de proteger la fermeture de la fenetre', error)
    })

    return () => {
      disposed = true
      unlisten?.()
    }
  }, [])

  useEffect(() => {
    if (!isClosePromptOpen) {
      return
    }

    closeCancelButtonRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsClosePromptOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isClosePromptOpen])

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
    toast.warning(`${pendingReminders.length} dossier(s) ont depasse 30 jours.`, {
      description: `${getRequestPrimaryLabel(pendingReminders[0])} peut etre recharge depuis la page Expirees.`,
    })
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
        ? 'Mode test actif. Le dossier a ete recharge comme une re-demande expiree: reprenez directement le rendez-vous et le reCAPTCHA.'
        : 'Le dossier a ete recharge. Reprenez le rendez-vous et le reCAPTCHA avant la nouvelle soumission.',
    )
  }

  async function handleDismissReminder(record: (typeof requestRecords)[number]) {
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
          : 'Utilisateur actif enregistre.',
      )
    } catch (error) {
      console.error(error)
      toast.error("Impossible d'enregistrer l'utilisateur actif.")
    }
  }

  const navigationItems = [
    {
      id: 'new-request',
      label: 'New Request',
      hint: 'Flux actuel',
      icon: PlusSquare,
    },
    {
      id: 'history',
      label: 'History',
      hint: `${requestRecords.length} dossier(s)`,
      icon: ClipboardList,
    },
    {
      id: 'expired',
      label: 'Expired',
      hint: `${expiredRecords.length} a revoir`,
      icon: ClockArrowUp,
    },
    {
      id: 'statistics',
      label: 'Statistics',
      hint: `${requestStatistics.monthCount} ce mois`,
      icon: ChartColumnBig,
    },
    {
      id: 'contact',
      label: 'Contact',
      hint: 'Developer',
      icon: LifeBuoy,
    },
  ] as const

  const pageCopy: Record<AppPage, { title: string; description: string }> = {
    'new-request': {
      title: 'Nouvelle demande',
      description:
        'Toute la logique existante reste ici, avec une interface plus claire et une navigation par pages.',
    },
    history: {
      title: 'Historique des demandes',
      description:
        'Retrouvez toutes les soumissions reussies avec les informations utiles pour suivi ou reutilisation.',
    },
    expired: {
      title: 'Demandes expirees',
      description:
        'Les dossiers vieux de 30 jours ou plus remontent ici pour etre relances rapidement.',
    },
    statistics: {
      title: 'Statistiques',
      description:
        "Vue d'ensemble sur l'activite du jour, du mois, de l'annee et la repartition des demandes.",
    },
    contact: {
      title: 'Contact developer',
      description:
        'Infos de contact directes et rappel des bons gestes quand un dossier doit etre relance.',
    },
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1440px] px-2 py-2 sm:px-3 lg:px-4">
        <div className="grid gap-2 xl:grid-cols-[216px_minmax(0,1fr)]">
          <aside className="space-y-3 xl:sticky xl:top-3 xl:self-start">
            <section className="overflow-hidden rounded-xl border border-border/60 bg-white px-3 py-3">
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge>Windows desktop</Badge>
                <Badge variant="secondary">
                  {RUNTIME_CONFIG.mockMode ? 'Mock mode' : 'Live mode'}
                </Badge>
              </div>
              <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
                {copy.appTitle}
              </h1>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                {copy.appSubtitle}
              </p>
            </section>

             <nav className="rounded-xl border border-border/60 bg-white p-2">
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activePage === item.id

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActivePage(item.id)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-transparent text-foreground hover:bg-slate-100'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>
                          <span className="block text-sm font-semibold">
                            {item.label}
                          </span>
                           <span
                             className={`block text-xs ${
                               isActive
                                 ? 'text-primary-foreground/75'
                                 : 'text-muted-foreground'
                             }`}
                           >
                             {item.hint}
                          </span>
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </nav>
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
                      <p className="font-medium text-foreground">{currentUser.name}</p>
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
                      <Button type="button" size="sm" onClick={() => void handleSaveCurrentUser()}>
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
          </aside>

          <section className="space-y-4">
            {pendingReminders.length > 0 ? (
              <Card className="border-amber-200/80 bg-amber-50/55">
                <CardContent className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <BellRing className="mt-0.5 h-5 w-5 text-amber-700" />
                    <div>
                      <p className="font-semibold text-amber-950">
                        {pendingReminders.length} dossier(s) ont depasse 30 jours
                      </p>
                      <p className="text-sm text-amber-900/80">
                        Ouvrez la page Expirees pour recharger les infos
                        candidats puis refaire le rendez-vous et le reCAPTCHA.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setActivePage('expired')}
                  >
                    Voir les demandes expirees
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            <section className="rounded-xl border border-border/60 bg-white px-3 py-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{pageCopy[activePage].title}</Badge>
                    <Badge variant="outline">
                      {requestStatistics.totalCount} demande(s) sauvegardee(s)
                    </Badge>
                  </div>
                  <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
                    {pageCopy[activePage].title}
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {pageCopy[activePage].description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <div className="rounded-full bg-slate-50 px-3 py-1 text-foreground">
                    Aujourd&apos;hui {requestStatistics.todayCount}
                  </div>
                  <div className="rounded-full bg-slate-50 px-3 py-1 text-foreground">
                    Ce mois {requestStatistics.monthCount}
                  </div>
                  <div className="rounded-full bg-slate-50 px-3 py-1 text-foreground">
                    Expirees {requestStatistics.expiredCount}
                  </div>
                </div>
              </div>
            </section>

            {activePage === 'new-request' ? (
              !currentUserLoaded ? (
                <Card>
                  <CardContent className="py-10 text-sm text-muted-foreground">
                    Chargement de l&apos;utilisateur actif...
                  </CardContent>
                </Card>
              ) : currentUser ? (
                <BookingShell
                  currentUser={currentUser}
                />
              ) : (
                <Card>
                  <CardContent className="space-y-2 py-8 text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground">
                      Configurez d&apos;abord l&apos;utilisateur actif
                    </p>
                    <p>
                      Renseignez le nom et l&apos;email dans la colonne de gauche pour
                      attribuer correctement les nouvelles demandes et pre-remplir le
                      contact principal.
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
          </section>
        </div>
      </div>
      {isClosePromptOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsClosePromptOpen(false)
            }
          }}
        >
          <section
            aria-describedby="close-prompt-description"
            aria-labelledby="close-prompt-title"
            aria-modal="true"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-border/70 bg-white shadow-2xl"
            role="dialog"
          >
            <div className="flex items-start gap-4 border-b border-border/60 bg-slate-50 px-5 py-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <LogOut className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Damander Visa
                </p>
                <h2 id="close-prompt-title" className="mt-1 font-display text-xl font-semibold tracking-tight">
                  Quitter l&apos;application ?
                </h2>
              </div>
            </div>
            <div className="space-y-5 px-5 py-5">
              <p id="close-prompt-description" className="text-sm leading-6 text-muted-foreground">
                Votre brouillon local est conserve. Voulez-vous fermer Damander Visa maintenant ?
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  ref={closeCancelButtonRef}
                  type="button"
                  variant="secondary"
                  onClick={() => setIsClosePromptOpen(false)}
                >
                  Continuer
                </Button>
                <Button type="button" onClick={() => void confirmClose()}>
                  Oui, quitter
                </Button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}

export default App
