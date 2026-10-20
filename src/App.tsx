import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { LogOut, Mail, UserRound } from 'lucide-react'
import { toast } from 'sonner'

import { WorkspaceLayout } from '@/components/workspace/workspace-layout'
import { useWorkspacePage } from '@/components/workspace/use-workspace-page'
import { useRecordReferenceData } from '@/features/dashboard/hooks/use-record-reference-data'
import { EmptyState } from '@/components/workspace/empty-state'
import { Dialog } from '@/components/ui/dialog'
import { DatabaseConnectionCard } from '@/features/dashboard/components/database-connection-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { bookingClient } from '@/lib/api/bookingClient'
import { useRequestRecordsQuery } from '@/lib/api/hooks'
import type { CurrentUserProfile } from '@/lib/api/types'
import { RUNTIME_CONFIG } from '@/lib/config'
import {
  getPendingExpiryReminders,
  getRequestStatistics,
  isRequestExpired,
  normalizeSubmitterEmail,
  normalizeSubmitterName,
  prepareRequestForResubmission,
} from '@/lib/request-records'
import { useBookingStore } from '@/lib/state/store'
import { isTauriEnvironment } from '@/lib/utils'

const BookingShell = lazy(() =>
  import('@/features/booking/booking-shell').then((module) => ({
    default: module.BookingShell,
  })),
)

const GmailPage = lazy(() =>
  import('@/features/dashboard/pages/gmail-page').then((module) => ({
    default: module.GmailPage,
  })),
)

const ContactPage = lazy(() =>
  import('@/features/dashboard/pages/contact-page').then((module) => ({
    default: module.ContactPage,
  })),
)

const ExpiredPage = lazy(() =>
  import('@/features/dashboard/pages/expired-page').then((module) => ({
    default: module.ExpiredPage,
  })),
)

const HistoryPage = lazy(() =>
  import('@/features/dashboard/pages/history-page').then((module) => ({
    default: module.HistoryPage,
  })),
)

const StatisticsPage = lazy(() =>
  import('@/features/dashboard/pages/statistics-page').then((module) => ({
    default: module.StatisticsPage,
  })),
)

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
  const [accountOpen, setAccountOpen] = useState(false)
  const [activePage, setActivePage] = useWorkspacePage()
  const referenceData = useRecordReferenceData(
    requestRecords,
    activePage === 'history' || activePage === 'expired',
  )

  const [currentUser, setCurrentUser] = useState<CurrentUserProfile | null>(
    null,
  )
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
      setAccountOpen(false)
      window.setTimeout(
        () =>
          document
            .getElementById('workspace-content')
            ?.focus({ preventScroll: true }),
        0,
      )
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

  return (
    <>
      <WorkspaceLayout
        activePage={activePage}
        onNavigate={setActivePage}
        currentUser={currentUser}
        onOpenAccount={() => setAccountOpen(true)}
        stats={requestStatistics}
        isLoading={requestRecordsQuery.isLoading}
        reminderCount={pendingReminders.length}
      >
        <Suspense
          fallback={
            <Card>
              <CardContent
                className="py-14 text-center text-sm text-muted-foreground"
                role="status"
              >
                Chargement de votre espace…
              </CardContent>
            </Card>
          }
        >
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
                <EmptyState
                  icon={<UserRound size={28} strokeWidth={1.5} />}
                  title="Bienvenue dans votre espace visa"
                  action={
                    <Button onClick={() => setAccountOpen(true)}>
                      Configurer mon profil
                    </Button>
                  }
                >
                  <p>
                    Commencez par renseigner votre nom et votre email. Votre
                    profil identifie vos demandes et préremplit le contact
                    principal.
                  </p>
                </EmptyState>
              </Card>
            )
          ) : null}
          {activePage === 'history' ? (
            <HistoryPage
              records={requestRecords}
              isLoading={requestRecordsQuery.isLoading}
              currentUser={currentUser}
              socialTitles={referenceData.socialTitles ?? socialTitles}
              visaFileVariations={
                referenceData.visaFileVariations ?? visaFileVariations
              }
              visaTypes={visaTypes}
              visaTypesByCenter={referenceData.visaTypesByCenter}
              onReuseRecord={handleReuseRecord}
            />
          ) : null}
          {activePage === 'expired' ? (
            <ExpiredPage
              records={expiredRecords}
              allRecords={requestRecords}
              socialTitles={referenceData.socialTitles ?? socialTitles}
              visaFileVariations={
                referenceData.visaFileVariations ?? visaFileVariations
              }
              visaTypes={visaTypes}
              visaTypesByCenter={referenceData.visaTypesByCenter}
              onReuseRecord={handleReuseRecord}
              onDismissReminder={handleDismissReminder}
            />
          ) : null}
          {activePage === 'statistics' ? (
            <StatisticsPage stats={requestStatistics} />
          ) : null}
          {activePage === 'gmail' ? <GmailPage /> : null}
          {activePage === 'contact' ? <ContactPage /> : null}
        </Suspense>
      </WorkspaceLayout>
      <Dialog
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        title="Mon profil & paramètres"
      >
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
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault()
                  void handleSaveCurrentUser()
                }}
              >
                <p className="text-sm text-muted-foreground">
                  {currentUser
                    ? "Mettez a jour le nom ou l'email de l'utilisateur actif."
                    : "Renseignez une premiere fois le nom et l'email de l'utilisateur qui travaille sur cette installation."}
                </p>
                <label
                  htmlFor="account-name"
                  className="block text-xs font-medium"
                >
                  Nom complet
                </label>
                <Input
                  id="account-name"
                  autoComplete="name"
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
                <label
                  htmlFor="account-email"
                  className="block text-xs font-medium"
                >
                  Adresse email
                </label>
                <Input
                  id="account-email"
                  autoComplete="email"
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
                  <Button type="submit" size="sm">
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
              </form>
            )}
          </CardContent>
        </Card>
        <div className="mt-4">
          <DatabaseConnectionCard />
        </div>
      </Dialog>

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
                <h2
                  id="close-prompt-title"
                  className="mt-1 font-display text-xl font-semibold tracking-tight"
                >
                  Quitter l&apos;application ?
                </h2>
              </div>
            </div>
            <div className="space-y-5 px-5 py-5">
              <p
                id="close-prompt-description"
                className="text-sm leading-6 text-muted-foreground"
              >
                Votre brouillon local est conserve. Voulez-vous fermer Damander
                Visa maintenant ?
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
    </>
  )
}

export default App
