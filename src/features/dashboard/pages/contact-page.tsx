import { Mail, Phone, ArrowUpRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { openExternalUrl } from '@/lib/persistence/external'

const DEVELOPER_EMAIL = 'na_lebkara@esi.dz'
const DEVELOPER_PHONE = '0696151438'
export function ContactPage() {
  return (
    <div className="support-layout">
      <section>
        <p className="eyebrow">CONTACT DIRECT</p>
        <h2>Contacter le développeur</h2>
        <p>Une question sur l’application ou un problème avec un dossier ?</p>
        <div className="contact-row">
          <Mail size={18} aria-hidden="true" />
          <div>
            <small>Adresse e-mail</small>
            <strong>{DEVELOPER_EMAIL}</strong>
          </div>
          <Button
            variant="secondary"
            onClick={() => void openExternalUrl(`mailto:${DEVELOPER_EMAIL}`)}
          >
            Écrire
            <ArrowUpRight size={14} className="ml-2" />
          </Button>
        </div>
        <div className="contact-row">
          <Phone size={18} aria-hidden="true" />
          <div>
            <small>Téléphone</small>
            <strong>{DEVELOPER_PHONE}</strong>
          </div>
          <Button
            variant="secondary"
            onClick={() => void openExternalUrl(`tel:${DEVELOPER_PHONE}`)}
          >
            Appeler
            <ArrowUpRight size={14} className="ml-2" />
          </Button>
        </div>
        <p className="mt-4">
          Indiquez la date de soumission et le message d’erreur. Ne transmettez
          pas de mot de passe ni de clé d’accès.
        </p>
      </section>
      <section>
        <p className="eyebrow">REPÈRES</p>
        <h2>Avant de demander de l’aide</h2>
        <div className="support-note">
          <h3 className="font-semibold mb-2">
            Retrouver ou reprendre un dossier
          </h3>
          <p>
            Consultez l’historique pour ouvrir les détails et recharger une
            demande. Les demandes de plus de 30 jours figurent dans « Demandes
            expirées ».
          </p>
        </div>
        <div className="support-note">
          <h3 className="font-semibold mb-2 flex gap-2 items-center">
            <ShieldCheck size={16} />
            Vérifier avant l’envoi
          </h3>
          <p>
            Les disponibilités sont fournies par le centre. La vérification
            reCAPTCHA et les conditions requises doivent être complétées avant
            chaque nouvelle soumission.
          </p>
        </div>
        <div className="support-note">
          <h3 className="font-semibold mb-2">Conserver un brouillon</h3>
          <p>
            Dans Nouvelle demande, ouvrez « Données du dossier » pour importer
            ou exporter le brouillon JSON. La réinitialisation du brouillon ne
            supprime pas l’historique.
          </p>
        </div>
      </section>
    </div>
  )
}
