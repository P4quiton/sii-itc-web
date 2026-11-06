
const statusLabels = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  completada: 'Completada',
}

const statusStyles = {
  pendiente: 'bg-amber-100 text-amber-800',
  en_progreso: 'bg-blue-100 text-blue-800',
  completada: 'bg-green-100 text-green-800',
}

const priorityLabels = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
}

const priorityStyles = {
  baja: 'bg-slate-100 text-slate-700',
  media: 'bg-blue-100 text-blue-700',
  alta: 'bg-red-100 text-red-700',
}

const typeLabels = {
  tarea: 'Tarea',
  proyecto: 'Proyecto',
  examen: 'Examen',
  otro: 'Otro',
}

function formatDate(value) {
  if (!value) return 'Sin fecha'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Fecha inválida'
  }

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Mexico_City',
  }).format(date)
}

function formatDuration(minutes) {
  if (minutes === null || minutes === undefined) {
    return 'Sin estimación'
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours === 0) {
    return `${remainingMinutes} min`
  }

  if (remainingMinutes === 0) {
    return `${hours} h`
  }

  return `${hours} h ${remainingMinutes} min`
}

function ActivityCard({
  activity,
  onEdit,
  onDelete,
  onStatusChange,
  busy,
}) {
  const isCompleted = activity.status === 'completada'

  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-lg font-bold text-slate-900">
              {activity.title}
            </h3>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                statusStyles[activity.status] ??
                'bg-slate-100 text-slate-700'
              }`}
            >
              {statusLabels[activity.status] ?? activity.status}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            {activity.subject || 'Sin materia'}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            priorityStyles[activity.priority] ??
            priorityStyles.baja
          }`}
        >
          Prioridad {priorityLabels[activity.priority] ?? 'Sin definir'}
        </span>
      </div>

      {activity.description && (
        <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">
          {activity.description}
        </p>
      )}

      <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3">
        <div>
          <p className="font-medium text-slate-500">
            Tipo
          </p>
          <p className="mt-1 text-slate-800">
            {typeLabels[activity.activity_type] ?? 'Otro'}
          </p>
        </div>

        <div>
          <p className="font-medium text-slate-500">
            Fecha de entrega
          </p>
          <p className="mt-1 text-slate-800">
            {formatDate(activity.due_date)}
          </p>
        </div>

        <div>
          <p className="font-medium text-slate-500">
            Tiempo estimado
          </p>
          <p className="mt-1 text-slate-800">
            {formatDuration(activity.estimated_minutes)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onEdit(activity)}
          disabled={busy}
          className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Editar
        </button>

        {!isCompleted && (
          <button
            type="button"
            onClick={() => onStatusChange(activity, 'completada')}
            disabled={busy}
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Completar
          </button>
        )}

        {isCompleted && (
          <button
            type="button"
            onClick={() => onStatusChange(activity, 'pendiente')}
            disabled={busy}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reabrir
          </button>
        )}

        <button
          type="button"
          onClick={() => onDelete(activity)}
          disabled={busy}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Eliminar
        </button>
      </div>
    </article>
  )
}

export default function ActivityList({
  activities = [],
  filters,
  onFiltersChange,
  pagination,
  onPageChange,
  onEdit,
  onDelete,
  onStatusChange,
  onCreate,
  loading = false,
  busyId = null,
}) {
  const currentOffset = pagination?.offset ?? 0
  const limit = pagination?.limit ?? 50
  const total = pagination?.total ?? 0
  const hasMore = pagination?.has_more ?? false

  const currentPage = Math.floor(currentOffset / limit) + 1
  const totalPages = Math.max(1, Math.ceil(total / limit))

  function changeFilter(name, value) {
    onFiltersChange({
      ...filters,
      [name]: value,
    })
  }

  return (
    <section className="min-w-0 space-y-5">
      <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Mis actividades
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Organiza tus pendientes, proyectos y exámenes.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreate}
          className="min-h-11 w-full rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 sm:w-auto"
        >
          + Nueva actividad
        </button>
      </div>

      <div className="min-w-0 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
        <h3 className="mb-4 font-semibold text-slate-800">
          Buscar y filtrar
        </h3>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="md:col-span-2 xl:col-span-4">
            <label
              htmlFor="activity-search"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Buscar actividad
            </label>

            <input
              id="activity-search"
              type="search"
              value={filters.search ?? ''}
              onChange={(event) =>
                changeFilter('search', event.target.value)
              }
              placeholder="Buscar por título, descripción o materia"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="activity-status"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Estado
            </label>

            <select
              id="activity-status"
              value={filters.status ?? ''}
              onChange={(event) =>
                changeFilter('status', event.target.value)
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-3"
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="en_progreso">En progreso</option>
              <option value="completada">Completadas</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="activity-priority"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Prioridad
            </label>

            <select
              id="activity-priority"
              value={filters.priority ?? ''}
              onChange={(event) =>
                changeFilter('priority', event.target.value)
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-3"
            >
              <option value="">Todas</option>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="activity-type"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Tipo de actividad
            </label>

            <select
              id="activity-type"
              value={filters.activity_type ?? ''}
              onChange={(event) =>
                changeFilter('activity_type', event.target.value)
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-3"
            >
              <option value="">Todos</option>
              <option value="tarea">Tarea</option>
              <option value="proyecto">Proyecto</option>
              <option value="examen">Examen</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="activity-subject"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Materia
            </label>

            <input
              id="activity-subject"
              type="text"
              value={filters.subject ?? ''}
              onChange={(event) =>
                changeFilter('subject', event.target.value)
              }
              placeholder="Filtrar por materia"
              className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-start sm:justify-end">
          <button
            type="button"
            onClick={() => onFiltersChange({})}
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {loading ? (
        <div
          role="status"
          className="rounded-2xl bg-white p-8 text-center text-slate-500"
        >
          Cargando actividades...
        </div>
      ) : activities.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm sm:p-10">
          <h3 className="text-lg font-semibold text-slate-900">
            No se encontraron actividades
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Puedes registrar una nueva actividad o cambiar
            los filtros de búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              busy={busyId === activity.id}
            />
          ))}
        </div>
      )}

      {!loading && total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">
            Página {currentPage} de {totalPages} ·
            {' '}{total} actividades
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                onPageChange(Math.max(0, currentOffset - limit))
              }
              disabled={currentOffset === 0}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>

            <button
              type="button"
              onClick={() =>
                onPageChange(currentOffset + limit)
              }
              disabled={!hasMore}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
