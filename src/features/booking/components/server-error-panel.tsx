import { AlertTriangle } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ServerErrorPanelProps {
  messages: string[]
}

export function ServerErrorPanel({ messages }: ServerErrorPanelProps) {
  if (messages.length === 0) {
    return null
  }

  return (
    <Card className="border-red-200/80 bg-red-50/55">
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-red-700">
          <AlertTriangle className="h-5 w-5" />
          Messages serveur
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {messages.map((message) => (
          <p
            key={message}
            className="rounded-lg bg-white/92 px-3 py-2 text-sm leading-6 text-red-700"
          >
            {message}
          </p>
        ))}
      </CardContent>
    </Card>
  )
}
