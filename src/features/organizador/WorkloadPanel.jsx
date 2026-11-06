
const workloadLabels = {
  normal: 'Carga normal',
  high: 'Carga alta',
  critical: 'Carga crítica',
}

const workloadStyles = {
  normal: 'bg-green-100 text-green-800',
  high: 'bg-amber-100 text-amber-800',
  critical: 'bg-red-100 text-red-800',
}

const urgencyLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
}

const urgencyStyles = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-800',
  critical: 'bg-red-100 text-red-800',
}

function formatDate(value) {
  if (!value) return 'Sin fecha'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible'
  }

  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Mexico_City',
  }).format(date)
}

function SummaryCard({ title, value, description }) {
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-3 text-3xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-sm text-slate-500">
        {description}
      </p>
    </article>
  )
}

export default function WorkloadPanel({ summary }) {
  if (!summary) {
    return (
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">
          Análisis de carga académica
        </h2>

        <p className="mt-3 text-sm text-slate-500">
          El análisis estará disponible cuando se consulte
          la información del Organizador.
        </p>
      </section>
    )
  }

  const {
    totals,
    deadlines,
    workload,
    deadline_clusters: clusters = [],
    priority_activities: priorityActivities = [],
  } = summary

  const level = workload?.level

  const workloadLabel =
    workloadLabels[level] ?? 'Carga no determinada'

  const workloadStyle =
    workloadStyles[level] ?? 'bg-slate-100 text-slate-700'

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-900">
          Resumen de actividades
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total de actividades"
            value={totals.total}
            description="Actividades registradas"
          />

          <SummaryCard
            title="Pendientes"
            value={totals.pending}
            description="Por iniciar"
          />

          <SummaryCard
            title="En progreso"
            value={totals.in_progress}
            description="En desarrollo"
          />

          <SummaryCard
            title="Completadas"
            value={totals.completed}
            description="Actividades finalizadas"
          />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Análisis de carga académica
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Trabajo estimado para los próximos siete días
            </p>
          </div>

          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold ${workloadStyle}`}
          >
            {workloadLabel}
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Carga estimada"
            value={
              workload.estimation_status === 'unavailable'
                ? 'No disponible'
                : `${workload.estimated_hours} h`
            }
            description="Tiempo conocido de trabajo"
          />

          <SummaryCard
            title="Próximas 48 horas"
            value={deadlines.due_next_48h}
            description="Actividades por entregar"
          />

          <SummaryCard
            title="Actividades vencidas"
            value={deadlines.overdue}
            description="Pendientes fuera de plazo"
          />
        </div>

        <div className="mt-5 rounded-xl bg-slate-50 p-4">
          <h3 className="font-semibold text-slate-800">
            Interpretación del análisis
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {workload.explanation}
          </p>

          {workload.estimation_status !== 'complete' && (
            <p className="mt-3 text-sm font-medium text-amber-700">
              {workload.estimation_status === 'partial'
                ? 'La carga es parcial porque algunas actividades no tienen tiempo estimado.'
                : 'No hay suficientes estimaciones para clasificar la carga.'}
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Concentración de entregas
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Días con varias actividades próximas
          </p>

          {clusters.length === 0 ? (
            <p className="mt-5 text-sm text-slate-500">
              No se detectaron concentraciones de entregas.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {clusters.map((cluster) => (
                <article
                  key={cluster.date}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex justify-between gap-3">
                    <span className="font-semibold text-slate-800">
                      {cluster.date}
                    </span>

                    <span className="text-sm font-medium text-blue-700">
                      {cluster.active_count} actividades
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-600">
                    {cluster.description}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Actividades prioritarias
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Ordenadas por urgencia calculada por el backend
          </p>

          {priorityActivities.length === 0 ? (
            <p className="mt-5 text-sm text-slate-500">
              No hay actividades que requieran atención.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {priorityActivities.map((activity) => (
                <article
                  key={activity.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">
                      {activity.title}
                    </h3>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        urgencyStyles[activity.urgency_level] ??
                        urgencyStyles.low
                      }`}
                    >
                      {urgencyLabels[activity.urgency_level] ??
                        'Sin clasificar'}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    {activity.subject || 'Sin materia'} ·
                    {' '}Vence: {formatDate(activity.due_date)}
                  </p>

                  {activity.urgency_reasons?.length > 0 && (
                    <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-600">
                      {activity.urgency_reasons.map((reason, index) => (
                        <li key={`${activity.id}-${index}`}>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
