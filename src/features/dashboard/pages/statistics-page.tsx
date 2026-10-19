import type * as React from 'react'
import { BarChart3, CalendarRange, Clock3, Database, Layers3 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RequestStatisticPoint, RequestStatistics } from '@/lib/api/types'

interface StatisticsPageProps {
  stats: RequestStatistics
}

function StatCard(props: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  hint: string
}) {
  const Icon = props.icon

  return (
    <Card>
      <CardContent className="py-6">
        <div className="mb-3 flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span className="text-xs uppercase tracking-[0.16em]">{props.label}</span>
        </div>
        <p className="font-display text-4xl text-foreground">{props.value}</p>
        <p className="mt-2 text-sm text-muted-foreground">{props.hint}</p>
      </CardContent>
    </Card>
  )
}

function BarList(props: {
  title: string
  points: RequestStatisticPoint[]
  emptyLabel: string
}) {
  const maxCount = Math.max(...props.points.map((point) => point.count), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {props.points.length === 0 ? (
          <p className="text-sm text-muted-foreground">{props.emptyLabel}</p>
        ) : (
          props.points.map((point) => (
            <div key={point.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{point.label}</span>
                <span className="text-muted-foreground">{point.count}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200/80">
                <div
                  className="h-2 rounded-full bg-primary/80 transition-all"
                  style={{ width: `${(point.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

export function StatisticsPage({ stats }: StatisticsPageProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Clock3}
          label="Aujourd'hui"
          value={stats.todayCount}
          hint="Demandes enregistrees sur la journee courante."
        />
        <StatCard
          icon={CalendarRange}
          label="Ce mois"
          value={stats.monthCount}
          hint="Soumissions conservees depuis le debut du mois."
        />
        <StatCard
          icon={BarChart3}
          label="Cette annee"
          value={stats.yearCount}
          hint="Vision rapide du volume annuel."
        />
        <StatCard
          icon={Database}
          label="Expirees"
          value={stats.expiredCount}
          hint="Demandes vieilles de 30 jours ou plus."
        />
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          <Badge>Total {stats.totalCount}</Badge>
          <Badge variant="secondary">
            Rappels a traiter {stats.pendingReminderCount}
          </Badge>
          <Badge variant="outline">Tendance sur 6 mois</Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <BarList
          title="Activite sur les 6 derniers mois"
          points={stats.monthlyTrend}
          emptyLabel="Aucune activite a afficher pour le moment."
        />
        <BarList
          title="Repartition par formule"
          points={stats.byFormula}
          emptyLabel="Les formules apparaitront ici apres les premieres soumissions."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <BarList
          title="Repartition par centre"
          points={stats.byCenter}
          emptyLabel="Les centres actifs apparaitront ici."
        />
        <Card>
          <CardHeader>
            <CardTitle>Lecture rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <Layers3 className="h-4 w-4" />
              Les compteurs resumment automatiquement l&apos;historique
              disponible pour vous donner une vue rapide de l&apos;activite.
            </div>
            <p>
              La page Expirees vous aide a relancer les dossiers anciens sans
              retaper les informations candidats.
            </p>
            <p>
              Chaque demande enregistree peut ensuite etre retrouvee depuis
              l&apos;historique pour un suivi plus simple.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
