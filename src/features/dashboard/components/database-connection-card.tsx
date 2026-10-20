import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Database, RefreshCw, Settings2, WifiOff } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { bookingClient } from '@/lib/api/bookingClient'
import { bookingQueryKeys } from '@/lib/api/queryKeys'
import { isTauriEnvironment } from '@/lib/utils'

const DATABASE_STATUS_KEY = ['damander-visa-database-status'] as const

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function DatabaseConnectionCard() {
  const desktop = isTauriEnvironment()
  const queryClient = useQueryClient()
  const { data, isPending, isFetching, refetch } = useQuery({
    queryKey: DATABASE_STATUS_KEY,
    queryFn: () => bookingClient.getDatabaseStatus(),
    enabled: desktop,
    refetchInterval: desktop ? 30_000 : false,
    refetchOnWindowFocus: desktop,
    retry: 1,
  })
  const [isEditing, setIsEditing] = useState(false)
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const connected = Boolean(data?.connected)

  async function refresh() {
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({
        queryKey: bookingQueryKeys.requestRecords,
      }),
    ])
  }

  async function save() {
    if (!url.trim()) {
      toast.error('Saisissez une URL PostgreSQL.')
      return
    }
    setSaving(true)
    try {
      await bookingClient.configureDatabase(url.trim())
      setUrl('')
      setIsEditing(false)
      await refresh()
      toast.success(
        'Connexion a la base partagee etablie. Historique actualise.',
      )
    } catch (error) {
      toast.error('Impossible de se connecter : ' + errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function clear() {
    if (
      !window.confirm(
        'Supprimer la configuration de cette base sur ce PC ? Les dossiers locaux seront conserves.',
      )
    ) {
      return
    }
    setSaving(true)
    try {
      await bookingClient.clearDatabaseConfiguration()
      setUrl('')
      await refresh()
      toast.success(
        'Configuration locale retiree. Les dossiers restent sauvegardes.',
      )
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  if (!desktop) {
    return null
  }

  return (
    <Card className={connected ? 'border-emerald-200' : 'border-amber-300'}>
      <CardContent className="space-y-3 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {connected ? (
            <Database className="h-4 w-4 text-emerald-700" />
          ) : (
            <WifiOff className="h-4 w-4 text-amber-700" />
          )}
          Base de donnees partagee
        </div>
        <div
          role="status"
          aria-live="polite"
          className="space-y-1 text-xs text-muted-foreground"
        >
          <p
            className={
              connected
                ? 'font-medium text-emerald-800'
                : 'font-medium text-amber-800'
            }
          >
            {isPending
              ? 'Vérification en cours…'
              : connected
                ? 'Connectee'
                : 'Deconnectee / non configuree'}
          </p>
          <p className="break-words">
            {data?.message ?? 'Verifiez les paramètres de la connexion.'}
          </p>
          {data ? (
            <p>
              {data.remoteCount === null
                ? 'Serveur non disponible'
                : `${data.remoteCount} dossier(s) sur le serveur`}
              {' · '}
              {data.localCount} dossier(s) en cache local
              {data.pendingCount > 0
                ? ` · ${data.pendingCount} en attente de synchronisation`
                : ''}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            type="button"
            disabled={saving || isFetching}
            onClick={() => void refresh()}
          >
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> Actualiser
          </Button>
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() => setIsEditing((v) => !v)}
          >
            <Settings2 className="mr-1 h-3.5 w-3.5" /> Configurer
          </Button>
        </div>
        {isEditing ? (
          <div className="space-y-2 border-t pt-3">
            <label htmlFor="database-url" className="text-xs font-medium">
              URL PostgreSQL / CockroachDB
            </label>
            <Input
              id="database-url"
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder="postgresql://utilisateur:mot-de-passe@serveur:26257/base?sslmode=require"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Saisissez l'URL fournie par l'administrateur. La valeur existante
              n'est pas affichee. La nouvelle connexion est testee avant d'être
              enregistrée sur cet ordinateur.
            </p>
            <Button
              size="sm"
              type="button"
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? 'Test de connexion…' : 'Tester et enregistrer'}
            </Button>
            {data?.configured ? (
              <Button
                size="sm"
                variant="ghost"
                type="button"
                disabled={saving}
                onClick={() => void clear()}
              >
                Retirer la configuration locale
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
