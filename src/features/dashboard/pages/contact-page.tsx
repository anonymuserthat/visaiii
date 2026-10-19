import { Mail, MessageSquareMore, Phone, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { openExternalUrl } from '@/lib/persistence/external'

const DEVELOPER_EMAIL = 'na_lebkara@esi.dz'
const DEVELOPER_PHONE = '0696151438'

export function ContactPage() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Contact developer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl bg-white/80 px-4 py-4 text-sm">
            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              Email
            </div>
            <p className="font-medium text-foreground">{DEVELOPER_EMAIL}</p>
          </div>
          <div className="rounded-2xl bg-white/80 px-4 py-4 text-sm">
            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              Numero
            </div>
            <p className="font-medium text-foreground">{DEVELOPER_PHONE}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void openExternalUrl(`mailto:${DEVELOPER_EMAIL}`)}
            >
              <Mail className="mr-2 h-4 w-4" />
              Envoyer un email
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void openExternalUrl(`tel:${DEVELOPER_PHONE}`)}
            >
              <Phone className="mr-2 h-4 w-4" />
              Appeler
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assistance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-4 w-4" />
            Le reCAPTCHA reste manuel et doit toujours etre valide depuis la
            surface officielle.
          </div>
          <p>
            En cas de souci sur l&apos;historique, les rappels d&apos;expiration
            ou la reouverture d&apos;un dossier, envoyez le contexte du dossier
            et la date de soumission.
          </p>
          <div className="rounded-2xl border border-border/80 bg-white/80 px-4 py-4">
            <div className="mb-2 flex items-center gap-2 text-foreground">
              <MessageSquareMore className="h-4 w-4" />
              Bon reflexe
            </div>
            <p>
              Si une demande a depasse un mois, reutilisez les donnees depuis la
              page Expirees pour repartir vite, puis refaites uniquement les
              etapes sensibles comme le reCAPTCHA et le choix du creneau.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
