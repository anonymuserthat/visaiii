import {
  ArrowUpRight,
  CalendarDays,
  ChartColumnBig,
  ClockArrowUp,
  FolderCheck,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RequestStatisticPoint, RequestStatistics } from '@/lib/api/types'

function Distribution({
  title,
  points,
}: {
  title: string
  points: RequestStatisticPoint[]
}) {
  const total = points.reduce((sum, point) => sum + point.count, 0)
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-[11px] text-muted-foreground">
          Répartition des dossiers enregistrés
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {points.length ? (
          points.map((point, index) => (
            <div key={point.label}>
              <div className="mb-2 flex items-center justify-between gap-4 text-xs">
                <span className="flex items-center gap-2">
                  <i
                    className={`h-2 w-2 rounded-sm ${index % 2 ? 'bg-slate-400' : 'bg-primary'}`}
                  />
                  {point.label}
                </span>
                <span className="font-semibold tabular-nums">
                  {point.count}{' '}
                  <span className="ml-2 font-normal text-muted-foreground">
                    {total ? Math.round((point.count / total) * 100) : 0}%
                  </span>
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${index % 2 ? 'bg-slate-400' : 'bg-primary'}`}
                  style={{
                    width: `${total ? (point.count / total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="py-8 text-center text-xs text-muted-foreground">
            Aucune donnée pour le moment.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function StatisticsPage({ stats }: { stats: RequestStatistics }) {
  const maximum = Math.max(...stats.monthlyTrend.map((point) => point.count), 1)
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Aujourd’hui',
            count: stats.todayCount,
            hint: 'Soumissions du jour',
            icon: CalendarDays,
          },
          {
            label: 'Ce mois-ci',
            count: stats.monthCount,
            hint: 'Depuis le début du mois',
            icon: ChartColumnBig,
          },
          {
            label: 'Cette année',
            count: stats.yearCount,
            hint: 'Soumissions annuelles',
            icon: FolderCheck,
          },
          {
            label: 'À relancer',
            count: stats.expiredCount,
            hint: 'Plus de 30 jours',
            icon: ClockArrowUp,
          },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{item.label}</span>
                <item.icon size={17} className="text-primary" />
              </div>
              <p className="mt-5 text-3xl font-semibold tracking-tight tabular-nums">
                {item.count}
              </p>
              <p className="mt-2 text-[10px] text-muted-foreground">
                {item.hint}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Évolution des soumissions</CardTitle>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Votre activité sur les six derniers mois
            </p>
          </div>
          <span className="rounded-md border bg-slate-50 px-3 py-1.5 text-[10px] text-muted-foreground">
            6 derniers mois
          </span>
        </CardHeader>
        <CardContent>
          <div
            className="monthly-chart"
            role="img"
            aria-label={`Soumissions mensuelles : ${stats.monthlyTrend.map((point) => `${point.label} : ${point.count}`).join(', ')}`}
          >
            {stats.monthlyTrend.map((point) => (
              <div key={point.label} className="monthly-chart-column">
                <span className="monthly-chart-value">{point.count}</span>
                <div className="monthly-chart-track">
                  <div
                    className="monthly-chart-bar"
                    style={{ height: `${(point.count / maximum) * 100}%` }}
                  />
                </div>
                <span className="monthly-chart-label">{point.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-2">
              <i className="h-2 w-2 rounded-sm bg-primary" />
              Demandes soumises
            </span>
            <span>
              {stats.totalCount} dossier{stats.totalCount > 1 ? 's' : ''} au
              total
            </span>
          </div>
        </CardContent>
      </Card>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Distribution title="Par centre de dépôt" points={stats.byCenter} />
        <Distribution title="Par formule" points={stats.byFormula} />
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/5 p-5 text-xs leading-6 text-primary">
        <ArrowUpRight size={20} className="shrink-0" />
        <p>
          <strong>
            {stats.pendingReminderCount} rappel
            {stats.pendingReminderCount > 1 ? 's' : ''} à traiter.
          </strong>{' '}
          Retrouvez les dossiers concernés dans « À relancer » pour reprendre
          leur préparation.
        </p>
      </div>
    </div>
  )
}
