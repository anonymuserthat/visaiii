import { useEffect, useRef, useState } from 'react'
import { LoaderCircle, Mail, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  gmail,
  type GmailInbox,
  type GmailMessage,
  type GmailStatus,
} from '@/lib/gmail/bridge'
import {
  emailHtmlToText,
  parseGoogleDesktopCredentials,
} from '@/lib/gmail/content'
import { openExternalUrl } from '@/lib/persistence/external'
import { isTauriEnvironment } from '@/lib/utils'

const EMPTY_INBOX: GmailInbox = { messages: [], nextPageToken: null }

export function GmailPage() {
  const desktop = isTauriEnvironment()
  const [status, setStatus] = useState<GmailStatus | null>(null)
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [authorizing, setAuthorizing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [messageLoading, setMessageLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [inbox, setInbox] = useState<GmailInbox>(EMPTY_INBOX)
  const [pageTokens, setPageTokens] = useState<(string | undefined)[]>([
    undefined,
  ])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [message, setMessage] = useState<GmailMessage | null>(null)
  const alive = useRef(false)
  const authAttempt = useRef(0)
  const authPending = useRef(false)
  const listAttempt = useRef(0)
  const detailAttempt = useRef(0)
  const actionPending = useRef(false)

  useEffect(() => {
    alive.current = true
    let active = true
    const requestCounters = [listAttempt, detailAttempt, authAttempt]
    if (desktop) {
      void gmail
        .status()
        .then((saved) => {
          if (!active) return
          setStatus(saved)
          setClientId(saved.clientId)
          if (saved.connected) void loadInbox('', [undefined])
        })
        .catch((reason: unknown) => {
          if (active) setError(String(reason))
        })
    }
    return () => {
      active = false
      alive.current = false
      requestCounters.forEach((counter) => {
        counter.current++
      })
      if (authPending.current) void gmail.cancelAuthorization().catch(() => {})
    }
    // Start only once on entering this page; refresh and search are explicit actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desktop])

  function clearInbox() {
    listAttempt.current++
    detailAttempt.current++
    setInbox(EMPTY_INBOX)
    setMessage(null)
    setSelectedId(null)
    setLoading(false)
    setMessageLoading(false)
    setPageTokens([undefined])
  }

  async function updateStatusAfterError(isCurrent: () => boolean) {
    try {
      const saved = await gmail.status()
      if (!alive.current || !isCurrent()) return
      setStatus(saved)
      if (!saved.connected) clearInbox()
    } catch {
      /* Keep the original useful error. */
    }
  }

  async function loadInbox(nextQuery: string, tokens: (string | undefined)[]) {
    const attempt = ++listAttempt.current
    detailAttempt.current++
    setLoading(true)
    setError('')
    setMessage(null)
    setSelectedId(null)
    setMessageLoading(false)
    try {
      const page = await gmail.list(nextQuery, tokens[tokens.length - 1])
      if (!alive.current || attempt !== listAttempt.current) return
      setInbox(page)
      setPageTokens(tokens)
      setQuery(nextQuery)
    } catch (reason) {
      if (!alive.current || attempt !== listAttempt.current) return
      setError(String(reason))
      await updateStatusAfterError(() => attempt === listAttempt.current)
    } finally {
      if (alive.current && attempt === listAttempt.current) setLoading(false)
    }
  }

  async function openMessage(id: string) {
    const attempt = ++detailAttempt.current
    setSelectedId(id)
    setMessage(null)
    setMessageLoading(true)
    setError('')
    try {
      const detail = await gmail.message(id)
      if (alive.current && attempt === detailAttempt.current) setMessage(detail)
    } catch (reason) {
      if (!alive.current || attempt !== detailAttempt.current) return
      setError(String(reason))
      await updateStatusAfterError(() => attempt === detailAttempt.current)
    } finally {
      if (alive.current && attempt === detailAttempt.current)
        setMessageLoading(false)
    }
  }

  async function saveConfiguration() {
    if (actionPending.current) return
    actionPending.current = true
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const saved = await gmail.configure({
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim() || undefined,
      })
      if (!alive.current) return
      setStatus(saved)
      setClientId(saved.clientId)
      setClientSecret('')
      setSettingsOpen(false)
      setNotice(
        'Application Google enregistrée. Vous pouvez connecter votre compte Gmail.',
      )
      if (!saved.connected) clearInbox()
    } catch (reason) {
      if (alive.current) setError(String(reason))
    } finally {
      actionPending.current = false
      if (alive.current) setBusy(false)
    }
  }

  async function connect() {
    if (authPending.current || actionPending.current) return
    authPending.current = true
    const attempt = ++authAttempt.current
    setAuthorizing(true)
    setError('')
    setNotice('')
    try {
      const authorization = await gmail.startAuthorization()
      if (!alive.current || attempt !== authAttempt.current) {
        await gmail.cancelAuthorization()
        return
      }
      await openExternalUrl(authorization.url)
      if (!alive.current || attempt !== authAttempt.current) return
      const saved = await gmail.finishAuthorization()
      if (!alive.current || attempt !== authAttempt.current) return
      clearInbox()
      setStatus(saved)
      setNotice('Compte Gmail connecte.')
      void loadInbox('', [undefined])
      setSearch('')
    } catch (reason) {
      if (alive.current && attempt === authAttempt.current) {
        setError(String(reason))
        await gmail.cancelAuthorization().catch(() => {})
      }
    } finally {
      if (attempt === authAttempt.current) {
        authPending.current = false
        if (alive.current) setAuthorizing(false)
      }
    }
  }

  async function cancelConnection() {
    // Keep the connect button disabled until the backend has cancelled this attempt.
    authAttempt.current++
    try {
      await gmail.cancelAuthorization()
      if (alive.current) setNotice('Connexion Google annulee.')
    } catch (reason) {
      if (alive.current) setError(String(reason))
    } finally {
      authPending.current = false
      if (alive.current) setAuthorizing(false)
    }
  }

  async function disconnect(forgetApp: boolean) {
    if (actionPending.current || authPending.current) return
    actionPending.current = true
    setBusy(true)
    setError('')
    setNotice('')
    clearInbox()
    try {
      const saved = await gmail.disconnect(forgetApp)
      if (!alive.current) return
      setStatus(saved)
      setClientId(saved.clientId)
      setClientSecret('')
      setNotice(
        forgetApp
          ? 'Compte et configuration Google supprimes du logiciel.'
          : 'Compte deconnecte du logiciel.',
      )
    } catch (reason) {
      if (alive.current) setError(String(reason))
    } finally {
      actionPending.current = false
      if (alive.current) setBusy(false)
    }
  }

  async function importCredentials(file?: File) {
    if (!file) return
    try {
      if (file.size > 16 * 1024)
        throw new Error(
          'Le fichier de configuration doit faire moins de 16 Ko.',
        )
      const credentials = parseGoogleDesktopCredentials(await file.text())
      if (!alive.current) return
      setClientId(credentials.clientId)
      setClientSecret(credentials.clientSecret)
      setError('')
      setNotice(
        'Identifiants importes. Cliquez sur Enregistrer l’application Google.',
      )
    } catch (reason) {
      if (alive.current) setError(String(reason))
    }
  }

  const controlsDisabled = busy || authorizing || !status
  const messageText = message
    ? message.textBody.trim() ||
      emailHtmlToText(message.htmlBody) ||
      emailHtmlToText(message.snippet)
    : ''

  return (
    <div className="space-y-4">
      <section className="mail-section">
        <header className="mail-heading">
          <h2 className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Gmail
          </h2>
        </header>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connectez votre compte avec votre application Google OAuth. L’accès
            est en lecture seule.
          </p>
          {!desktop ? (
            <p>Ouvrez le logiciel Windows pour connecter et consulter Gmail.</p>
          ) : (
            <>
              {!status && !error ? (
                <p role="status">Chargement de la configuration...</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-auto text-sm font-medium">
                  {status?.connected ? status.email : 'Aucun compte connecté'}
                </span>
                {authorizing ? (
                  <Button
                    variant="secondary"
                    onClick={() => void cancelConnection()}
                  >
                    Annuler la connexion
                  </Button>
                ) : (
                  <Button
                    disabled={controlsDisabled || !status?.configured}
                    onClick={() => void connect()}
                  >
                    {status?.connected
                      ? 'Changer de compte'
                      : 'Se connecter avec Google'}
                  </Button>
                )}
                {status?.connected ? (
                  <Button
                    variant="secondary"
                    disabled={controlsDisabled}
                    onClick={() => void disconnect(false)}
                  >
                    Deconnecter
                  </Button>
                ) : null}
                {status?.configured ? (
                  <Button
                    variant="secondary"
                    disabled={controlsDisabled}
                    onClick={() => setSettingsOpen(!settingsOpen)}
                  >
                    Application Google
                  </Button>
                ) : null}
              </div>
              {authorizing ? (
                <p role="status" className="flex items-center gap-2 text-sm">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Terminez la connexion dans votre navigateur, puis revenez ici.
                </p>
              ) : null}
              {status && (!status.configured || settingsOpen) ? (
                <form
                  className="space-y-3 rounded-md bg-slate-50 p-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void saveConfiguration()
                  }}
                >
                  <fieldset
                    disabled={busy || authorizing}
                    className="space-y-3 disabled:opacity-60"
                  >
                    <p className="font-semibold">
                      Votre nouvelle application Google OAuth
                    </p>
                    <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                      <li>
                        Creez un projet Google Cloud et activez Gmail API.
                      </li>
                      <li>
                        Configurez Google Auth Platform, le consentement et
                        votre adresse comme utilisateur test.
                      </li>
                      <li>
                        Creez un client OAuth de type « Application de bureau »
                        (Desktop app), puis telechargez son JSON.
                      </li>
                    </ol>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        void openExternalUrl(
                          'https://console.cloud.google.com/',
                        ).catch((reason: unknown) => setError(String(reason)))
                      }
                    >
                      Ouvrir Google Cloud
                    </Button>
                    <label className="block space-y-1 text-sm">
                      <span>Importer le fichier JSON Google</span>
                      <Input
                        type="file"
                        accept=".json,application/json"
                        onChange={(event) => {
                          void importCredentials(event.target.files?.[0])
                          event.target.value = ''
                        }}
                      />
                    </label>
                    <label className="block space-y-1 text-sm">
                      <span>Identifiant client Google</span>
                      <Input
                        autoComplete="off"
                        required
                        value={clientId}
                        placeholder="…apps.googleusercontent.com"
                        onChange={(event) => setClientId(event.target.value)}
                      />
                    </label>
                    <label className="block space-y-1 text-sm">
                      <span>Secret client Google</span>
                      <Input
                        type="password"
                        autoComplete="off"
                        required={
                          !status.configured ||
                          clientId.trim() !== status.clientId
                        }
                        value={clientSecret}
                        placeholder={
                          status.configured
                            ? 'Laisser vide pour conserver le secret enregistré'
                            : 'Secret du client OAuth de bureau'
                        }
                        onChange={(event) =>
                          setClientSecret(event.target.value)
                        }
                      />
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Les identifiants sont chiffres pour votre utilisateur
                      Windows. En mode test Google, une reconnexion peut être
                      nécessaire après 7 jours.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit">
                        {busy
                          ? 'Enregistrement...'
                          : 'Enregistrer l’application Google'}
                      </Button>
                      {status.configured ? (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => void disconnect(true)}
                        >
                          Oublier l’application et le compte
                        </Button>
                      ) : null}
                    </div>
                  </fieldset>
                </form>
              ) : null}
            </>
          )}
          {error ? (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p role="status" className="text-sm text-emerald-700">
              {notice}
            </p>
          ) : null}
        </div>
      </section>

      {status?.connected ? (
        <section className="mail-section">
          <header className="mail-heading">
            <h2>Boîte de réception</h2>
            <p className="text-sm text-muted-foreground">
              20 messages par page. Le contenu est chargé à l’ouverture, sans
              images distantes ni pièces jointes.
            </p>
          </header>
          <div className="space-y-4">
            <form
              className="flex flex-wrap gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                void loadInbox(search.trim(), [undefined])
              }}
            >
              <Input
                className="min-w-48 flex-1"
                aria-label="Rechercher dans Gmail"
                maxLength={500}
                value={search}
                placeholder="Rechercher : from:, subject:, is:unread…"
                onChange={(event) => setSearch(event.target.value)}
              />
              <Button type="submit" disabled={loading || controlsDisabled}>
                Rechercher
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={loading || controlsDisabled}
                onClick={() => void loadInbox(query, pageTokens)}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Actualiser
              </Button>
            </form>
            {loading ? (
              <p role="status" className="flex items-center gap-2 text-sm">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Chargement des messages...
              </p>
            ) : null}
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(240px,0.9fr)_minmax(0,1.4fr)]">
              <div className="space-y-2">
                {!loading && inbox.messages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Aucun message dans cette boite ou pour cette recherche.
                  </p>
                ) : null}
                {inbox.messages.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    disabled={loading || controlsDisabled}
                    aria-pressed={selectedId === item.id}
                    onClick={() => void openMessage(item.id)}
                    className={`w-full rounded-md border p-3 text-left transition-colors hover:bg-slate-50 disabled:opacity-60 ${selectedId === item.id ? 'border-primary bg-primary/5' : 'border-border'}`}
                  >
                    <div className="flex items-center gap-2">
                      <p
                        className={`min-w-0 flex-1 truncate text-sm ${item.unread ? 'font-bold' : 'font-medium'}`}
                      >
                        {item.from || 'Expediteur inconnu'}
                      </p>
                      {item.unread ? (
                        <span className="text-xs text-primary">Non lu</span>
                      ) : null}
                    </div>
                    <p className="truncate text-sm font-medium">
                      {item.subject || '(Sans objet)'}
                    </p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {emailHtmlToText(item.snippet)}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {item.date}
                    </p>
                  </button>
                ))}
                <div className="flex items-center justify-between gap-2 pt-2">
                  <Button
                    variant="secondary"
                    disabled={
                      loading || controlsDisabled || pageTokens.length <= 1
                    }
                    onClick={() =>
                      void loadInbox(query, pageTokens.slice(0, -1))
                    }
                  >
                    Precedent
                  </Button>
                  <span className="text-xs">Page {pageTokens.length}</span>
                  <Button
                    variant="secondary"
                    disabled={
                      loading || controlsDisabled || !inbox.nextPageToken
                    }
                    onClick={() =>
                      void loadInbox(query, [
                        ...pageTokens,
                        inbox.nextPageToken ?? undefined,
                      ])
                    }
                  >
                    Suivant
                  </Button>
                </div>
              </div>
              <div className="min-w-0 rounded-md border border-border p-4">
                {messageLoading ? (
                  <p role="status" className="flex items-center gap-2 text-sm">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Ouverture du message...
                  </p>
                ) : message ? (
                  <article className="space-y-3">
                    <h2 className="break-words text-lg font-semibold">
                      {message.subject || '(Sans objet)'}
                    </h2>
                    <dl className="space-y-1 break-words text-xs text-muted-foreground">
                      <div>
                        <dt className="inline font-medium">De : </dt>
                        <dd className="inline">{message.from}</dd>
                      </div>
                      <div>
                        <dt className="inline font-medium">A : </dt>
                        <dd className="inline">{message.to}</dd>
                      </div>
                      <div>
                        <dt className="inline font-medium">Date : </dt>
                        <dd className="inline">{message.date}</dd>
                      </div>
                    </dl>
                    <div className="max-h-[65vh] overflow-auto whitespace-pre-wrap break-words border-t border-border pt-3 text-sm">
                      {messageText ||
                        'Ce message ne contient pas de texte affichable.'}
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        void openExternalUrl(
                          `https://mail.google.com/mail/?authuser=${encodeURIComponent(status.email ?? '')}#all/${message.id}`,
                        ).catch((reason: unknown) => setError(String(reason)))
                      }
                    >
                      Ouvrir dans Gmail
                    </Button>
                  </article>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Sélectionnez un message pour le lire.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
