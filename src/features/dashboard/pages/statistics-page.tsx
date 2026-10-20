import type { RequestStatisticPoint, RequestStatistics } from '@/lib/api/types'
function Breakdown({
  title,
  points,
}: {
  title: string
  points: RequestStatisticPoint[]
}) {
  const max = Math.max(...points.map((p) => p.count), 1)
  return (
    <section className="analytics-section">
      <h2>{title}</h2>
      {points.length ? (
        <ul className="space-y-4">
          {points.map((p) => (
            <li key={p.label}>
              <div className="flex justify-between text-xs mb-2">
                <span>{p.label}</span>
                <strong className="tabular-nums">
                  {p.count.toLocaleString('fr-FR')}
                </strong>
              </div>
              <div className="h-1.5 bg-secondary">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${(p.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">
          Aucune donnée disponible.
        </p>
      )}
    </section>
  )
}
export function StatisticsPage({ stats }: { stats: RequestStatistics }) {
  const metrics = [
    ['Aujourd’hui', stats.todayCount],
    ['Ce mois', stats.monthCount],
    ['Cette année', stats.yearCount],
    ['Demandes expirées', stats.expiredCount],
  ] as const
  return (
    <div>
      <dl className="stats-strip">
        {metrics.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value.toLocaleString('fr-FR')}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-muted-foreground mt-3">
        {stats.totalCount.toLocaleString('fr-FR')} dossier(s) dans l’historique
        · {stats.pendingReminderCount} rappel(s) à traiter
      </p>
      {stats.totalCount === 0 ? (
        <div className="empty-state">
          <h2>Votre activité commence ici</h2>
          <p>
            Les indicateurs et répartitions seront alimentés par les demandes
            enregistrées. Aucun résultat n’est simulé.
          </p>
        </div>
      ) : (
        <div className="statistics-grid">
          <Breakdown
            title="Activité des six derniers mois"
            points={stats.monthlyTrend}
          />
          <Breakdown title="Répartition par centre" points={stats.byCenter} />
          <Breakdown title="Répartition par formule" points={stats.byFormula} />
        </div>
      )}
    </div>
  )
}
