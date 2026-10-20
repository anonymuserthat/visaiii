import {
  ArrowUpRight,
  Mail,
  MessageSquareMore,
  Phone,
  FolderClock,
  CalendarCheck2,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { openExternalUrl } from '@/lib/persistence/external'

const DEVELOPER_EMAIL = 'na_lebkara@esi.dz'
const DEVELOPER_PHONE = '0696151438'

export function ContactPage() {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <Card className="overflow-hidden">
        <div className="border-b bg-primary/5 p-6">
          <span className="mb-5 inline-flex rounded-xl bg-white p-3 text-primary">
            <MessageSquareMore size={25} strokeWidth={1.5} />
          </span>
          <h2 className="text-xl font-semibold tracking-tight">
            Un contact direct pour vous aider.
          </h2>
          <p className="mt-3 text-xs leading-7 text-muted-foreground">
            Une difficulté avec votre dossier ou une question sur l’application
            ? Contactez le développeur.
          </p>
        </div>
        <CardContent className="space-y-6 pt-6">
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              Par email
            </p>
            <p className="text-sm font-medium">{DEVELOPER_EMAIL}</p>
            <Button
              className="mt-3"
              variant="secondary"
              onClick={() => void openExternalUrl(`mailto:${DEVELOPER_EMAIL}`)}
            >
              <Mail size={15} />
              Envoyer un email
              <ArrowUpRight size={14} />
            </Button>
          </div>
          <div className="border-t pt-5">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              Par téléphone
            </p>
            <p className="text-sm font-medium">{DEVELOPER_PHONE}</p>
            <Button
              className="mt-3"
              variant="secondary"
              onClick={() => void openExternalUrl(`tel:${DEVELOPER_PHONE}`)}
            >
              <Phone size={15} />
              Appeler
              <ArrowUpRight size={14} />
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Les réponses à portée de main</CardTitle>
            <p className="text-xs text-muted-foreground">
              Quelques repères pour gérer vos demandes.
            </p>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              {
                icon: FolderClock,
                title: 'Retrouver un dossier',
                text: 'Ouvrez l’historique et recherchez un voyageur, un email ou un centre. Le détail rassemble les informations de la demande.',
              },
              {
                icon: CalendarCheck2,
                title: 'Relancer une ancienne demande',
                text: 'Après 30 jours, le dossier apparaît dans « À relancer ». Rechargez les informations, puis choisissez un nouveau rendez-vous et effectuez la vérification.',
              },
              {
                icon: FileText,
                title: 'Reprendre plus tard',
                text: 'Votre brouillon est sauvegardé automatiquement. Vous pouvez aussi l’exporter pour le conserver et le réimporter.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-4 border-b py-5 last:border-0"
              >
                <item.icon size={18} className="mt-1 shrink-0 text-primary" />
                <div>
                  <h3 className="text-xs font-semibold">{item.title}</h3>
                  <p className="mt-2 text-xs leading-7 text-muted-foreground">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <p className="px-1 text-[11px] leading-6 text-muted-foreground">
          Pour faciliter l’assistance, indiquez la date de soumission et le
          problème rencontré. Évitez de transmettre des identifiants ou des
          documents personnels par email.
        </p>
      </div>
    </div>
  )
}
