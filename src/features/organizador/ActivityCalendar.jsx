
import { useEffect, useMemo, useState } from 'react'
import { getActivities } from '../../services/organizerService'
import { getStudentErrorMessage } from '../../services/studentService'

const TIME_ZONE = 'America/Mexico_City'
const PAGE_SIZE = 100

const WEEK_DAYS = [
  'Dom',
  'Lun',
  'Mar',
  'Mié',
  'Jue',
  'Vie',
  'Sáb',
]

const STATUS_LABELS = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  completada: 'Completada',
}

const PRIORITY_LABELS = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
}

const PRIORITY_STYLES = {
  baja: 'bg-slate-100 text-slate-700',
  media: 'bg-blue-100 text-blue-700',
  alta: 'bg-red-100 text-red-700',
}

const TYPE_LABELS = {
  tarea: 'Tarea',
  proyecto: 'Proyecto',
  examen: 'Examen',
  otro: 'Otro',
}

function pad(number) {
  return String(number).padStart(2, '0')
}

function makeDateKey(year, month, day) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

function getZonedParts(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  )

  return {
    year: Number(values.year),
    month: Number(values.month) - 1,
    day: Number(values.day),
  }
}

function getToday() {
  return getZonedParts(new Date()) ?? {
    year: 2026,
    month: 0,
    day: 1,
  }
}

function getActivityDateKey(value) {
  const parts = getZonedParts(value)

  if (!parts) return null

  return makeDateKey(
    parts.year,
    parts.month,
    parts.day
  )
}

function getMonthLabel(year, month) {
  const date = new Date(Date.UTC(year, month, 15, 12))

  return new Intl.DateTimeFormat('es-MX', {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getTimeLabel(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Hora no disponible'
  }

  return new Intl.DateTimeFormat('es-MX', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

function getSelectedDateLabel(dateKey) {
  const [year, month, day] = dateKey
    .split('-')
    .map(Number)

  const date = new Date(
    Date.UTC(year, month - 1, day, 12)
  )

  return new Intl.DateTimeFormat('es-MX', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getCalendarDays(year, month) {
  const firstDay = new Date(
    Date.UTC(year, month, 1)
  ).getUTCDay()

  const daysInMonth = new Date(
    Date.UTC(year, month + 1, 0)
  ).getUTCDate()

  const cells = []

  for (let i = 0; i < firstDay; i += 1) {
    cells.push(null)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      day,
      key: makeDateKey(year, month, day),
    })
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

function getMonthQueryRange(year, month) {
  // Se amplía el intervalo UTC un día a cada lado.
  // Después se filtra según la zona horaria de México.
  const start = new Date(
    Date.UTC(year, month, 0, 0, 0, 0)
  )

  const end = new Date(
    Date.UTC(year, month + 1, 2, 0, 0, 0)
  )

  return {
    due_from: start.toISOString(),
    due_to: end.toISOString(),
  }
}

function ActivityDayItem({ activity }) {
  const isCompleted = activity.status === 'completada'

  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4
            className={`break-words font-semibold ${
              isCompleted
                ? 'text-slate-500 line-through'
                : 'text-slate-900'
            }`}
          >
            {activity.title}
          </h4>

          <p className="mt-1 text-sm text-slate-500">
            {activity.subject || 'Sin materia'}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            PRIORITY_STYLES[activity.priority] ??
            PRIORITY_STYLES.baja
          }`}
        >
          {PRIORITY_LABELS[activity.priority] ??
            'Sin prioridad'}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
        <span>
          {TYPE_LABELS[activity.activity_type] ??
            'Actividad'}
        </span>

        <span>
          {getTimeLabel(activity.due_date)}
        </span>

        <span>
          {STATUS_LABELS[activity.status] ??
            activity.status}
        </span>
      </div>
    </article>
  )
}

export default function ActivityCalendar({
  refreshKey = 0,
  onUnauthorized,
}) {
  const [initialToday] = useState(getToday)

  const [year, setYear] = useState(
    initialToday.year
  )

  const [month, setMonth] = useState(
    initialToday.month
  )

  const [selectedDate, setSelectedDate] = useState(
    makeDateKey(
      initialToday.year,
      initialToday.month,
      initialToday.day
    )
  )

  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadMonthActivities() {
      setLoading(true)
      setError('')

      try {
        const range = getMonthQueryRange(
          year,
          month
        )

        const allActivities = []
        let offset = 0
        let hasMore = true

        while (hasMore && !controller.signal.aborted) {
          const response = await getActivities(
            {
              ...range,
              limit: PAGE_SIZE,
              offset,
            },
            controller.signal
          )

          if (controller.signal.aborted) return

          allActivities.push(...response.data)

          hasMore = response.pagination.has_more
          offset += response.pagination.limit

          if (
            hasMore &&
            response.data.length === 0
          ) {
            throw new Error(
              'No se pudo completar la consulta del calendario.'
            )
          }
        }

        if (controller.signal.aborted) return

        const monthActivities = allActivities.filter(
          (activity) => {
            const parts = getZonedParts(
              activity.due_date
            )

            return (
              parts &&
              parts.year === year &&
              parts.month === month
            )
          }
        )

        setActivities(monthActivities)
      } catch (err) {
        if (controller.signal.aborted) return

        if (err.response?.status === 401) {
          onUnauthorized?.()
          return
        }

        setActivities([])
        setError(
          getStudentErrorMessage(err)
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadMonthActivities()

    return () => controller.abort()
  }, [
    year,
    month,
    refreshKey,
    retryKey,
    onUnauthorized,
  ])

  const activitiesByDate = useMemo(() => {
    const grouped = new Map()

    activities.forEach((activity) => {
      const key = getActivityDateKey(
        activity.due_date
      )

      if (!key) return

      if (!grouped.has(key)) {
        grouped.set(key, [])
      }

      grouped.get(key).push(activity)
    })

    grouped.forEach((items) => {
      items.sort(
        (a, b) =>
          new Date(a.due_date).getTime() -
          new Date(b.due_date).getTime()
      )
    })

    return grouped
  }, [activities])

  const calendarDays = useMemo(
    () => getCalendarDays(year, month),
    [year, month]
  )

  const selectedActivities =
    activitiesByDate.get(selectedDate) ?? []

  const today = getToday()
  const todayKey = makeDateKey(
    today.year,
    today.month,
    today.day
  )

  function navigateMonth(direction) {
    const target = new Date(
      Date.UTC(year, month + direction, 1)
    )

    const nextYear = target.getUTCFullYear()
    const nextMonth = target.getUTCMonth()

    setYear(nextYear)
    setMonth(nextMonth)

    setSelectedDate(
      makeDateKey(nextYear, nextMonth, 1)
    )
  }

  function goToToday() {
    const currentToday = getToday()

    setYear(currentToday.year)
    setMonth(currentToday.month)

    setSelectedDate(
      makeDateKey(
        currentToday.year,
        currentToday.month,
        currentToday.day
      )
    )
  }

  return (
    <section className="min-w-0 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          Calendario académico
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Visualiza tus actividades según su fecha
          de entrega.
        </p>
      </div>

      <div className="min-w-0 overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex flex-col items-stretch justify-between gap-3 border-b border-slate-200 p-3 sm:flex-row sm:items-center sm:p-5">
          <h3 className="text-base font-bold capitalize text-slate-900 sm:text-lg">
            {getMonthLabel(year, month)}
          </h3>

          <div className="flex justify-between gap-2 sm:justify-end">
            <button
              type="button"
              onClick={goToToday}
              className="min-h-10 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:flex-none"
            >
              Hoy
            </button>

            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              aria-label="Mes anterior"
              className="min-h-10 min-w-10 rounded-lg border border-slate-300 px-3 py-2 font-bold text-slate-700 hover:bg-slate-50 sm:px-4"
            >
              ←
            </button>

            <button
              type="button"
              onClick={() => navigateMonth(1)}
              aria-label="Mes siguiente"
              className="min-h-10 min-w-10 rounded-lg border border-slate-300 px-3 py-2 font-bold text-slate-700 hover:bg-slate-50 sm:px-4"
            >
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {WEEK_DAYS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-[10px] font-semibold text-slate-600 sm:py-3 sm:text-sm"
            >
              {day}
            </div>
          ))}
        </div>

        <div
          className="grid grid-cols-7 gap-px bg-slate-200"
          aria-label={`Calendario de ${getMonthLabel(year, month)}`}
        >
          {calendarDays.map((cell, index) => {
            if (!cell) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-14 bg-slate-50 sm:min-h-24"
                />
              )
            }

            const dayActivities =
              activitiesByDate.get(cell.key) ?? []

            const activeCount =
              dayActivities.filter(
                (activity) =>
                  activity.status !== 'completada'
              ).length

            const hasHighPriority =
              dayActivities.some(
                (activity) =>
                  activity.priority === 'alta' &&
                  activity.status !== 'completada'
              )

            const isSelected =
              selectedDate === cell.key

            const isToday =
              todayKey === cell.key

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() =>
                  setSelectedDate(cell.key)
                }
                aria-pressed={isSelected}
                aria-label={`${getSelectedDateLabel(cell.key)}, ${dayActivities.length} actividades`}
                className={`relative flex min-h-14 flex-col items-center gap-1 bg-white p-1 text-center transition hover:bg-blue-50 sm:min-h-24 sm:gap-2 sm:p-2 ${
                  isSelected
                    ? 'ring-2 ring-inset ring-blue-600'
                    : ''
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold sm:h-8 sm:w-8 sm:text-sm ${
                    isToday
                      ? 'bg-blue-700 text-white'
                      : 'text-slate-800'
                  }`}
                >
                  {cell.day}
                </span>

                {dayActivities.length > 0 && (
                  <>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold sm:px-2 sm:py-1 sm:text-xs ${
                        hasHighPriority
                          ? 'bg-red-100 text-red-700'
                          : activeCount > 0
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {dayActivities.length}
                    </span>

                    <span className="hidden text-xs text-slate-500 sm:block">
                      {activeCount} activas
                    </span>
                  </>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-4 border-t border-slate-200 px-5 py-4 text-xs text-slate-600">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            Prioridad alta
          </span>

          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-blue-400" />
            Actividades activas
          </span>

          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-green-400" />
            Actividades completadas
          </span>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <p className="text-sm text-red-700">
            No fue posible cargar las actividades
            del calendario. {error}
          </p>

          <button
            type="button"
            onClick={() =>
              setRetryKey((current) => current + 1)
            }
            className="mt-3 text-sm font-semibold text-red-700 underline"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-5">
          <h3 className="text-lg font-bold capitalize text-slate-900">
            {getSelectedDateLabel(selectedDate)}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {loading
              ? 'Consultando actividades...'
              : `${selectedActivities.length} actividades programadas`}
          </p>
        </div>

        {loading ? (
          <p
            role="status"
            className="py-6 text-center text-sm text-slate-500"
          >
            Cargando calendario...
          </p>
        ) : error ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No se pudieron consultar las actividades.
          </p>
        ) : selectedActivities.length === 0 ? (
          <div className="rounded-xl bg-slate-50 p-6 text-center">
            <p className="font-medium text-slate-700">
              No hay actividades para este día.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Selecciona otra fecha para consultar
              tus entregas.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {selectedActivities.map((activity) => (
              <ActivityDayItem
                key={activity.id}
                activity={activity}
              />
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Las fechas se muestran en la zona horaria
        de Ciudad de México. El calendario es de
        consulta; puedes administrar las actividades
        desde la sección Mis actividades.
      </p>
    </section>
  )
}
