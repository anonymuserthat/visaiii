import { CheckCircle2, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SubmissionSuccessProps {
  location: string | null
  onOpenLocation: () => void
}

export function SubmissionSuccess({
  location,
  onOpenLocation,
}: SubmissionSuccessProps) {
  return (
    <Card className="border-emerald-200/80 bg-emerald-50/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-800">
          <CheckCircle2 className="h-5 w-5" />
          Demande envoyee avec succes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-emerald-800">
          Le serveur a repondu avec un statut `201 Created`. Vous pouvez ouvrir
          la page de confirmation si un lien de redirection a été fourni.
        </p>
        {location ? (
          <Button type="button" variant="secondary" onClick={onOpenLocation}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Ouvrir la confirmation
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
