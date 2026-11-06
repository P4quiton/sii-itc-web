
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import WorkloadPanel from '../features/organizador/WorkloadPanel'
import ActivityList from '../features/organizador/ActivityList'
import ActivityForm from '../features/organizador/ActivityForm'
import {
  getActivities,
  getActivitySummary,
  createActivity,
  updateActivity,
  deleteActivity,
} from '../services/organizerService'
import {
  getStudentSchedule,
  getStudentErrorMessage,
} from '../services/studentService'

const PAGE_SIZE = 20

function getOrganizerErrorMessage(error) {
  const code = error.response?.data?.error?.code

  if (code === 'CSRF_REJECTED') {
    return 'La solicitud fue rechazada por seguridad. Actualiza la página e inténtalo nuevamente.'
  }

  if (error.response?.status === 422) {
    return (
      error.response?.data?.error?.message ||
      'Los datos de la actividad no son válidos.'
    )
  }

  if (error.response?.status === 404) {
    return 'La actividad ya no existe o no está disponible.'
  }

  return getStudentErrorMessage(error)
}

function extractCurrentSubjects(periods) {
  if (!Array.isArray(periods)) return []

  // El endpoint del SII proporciona el horario del periodo actual.
  // Si hubiera varios elementos, utilizamos el primer horario válido.
  const currentPeriod = periods.find(
    (item) => item &&
      Array.isArray(item.horario)
  )

  if (!currentPeriod) return []

  const subjectsByKey = new Map()

  currentPeriod.horario.forEach((item) => {
    const name =
      typeof item?.nombre_materia === 'string'
        ? item.nombre_materia.trim()
        : ''

    const code =
      typeof item?.clave_materia === 'string'
        ? item.clave_materia.trim()
        : ''

    if (!name) return

    const key = code || name.toLocaleLowerCase('es-MX')

    if (!subjectsByKey.has(key)) {
      subjectsByKey.set(key, name)
    }
  })

  return [...new Set(subjectsByKey.values())].sort(
    (a, b) => a.localeCompare(b, 'es-MX')
  )
}

export default function Organizador() {
  const {
    isAuthenticated,
    invalidateSession,
    session,
  } = useAuth()

  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [summaryError, setSummaryError] = useState('')

  const [activities, setActivities] = useState([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [activitiesError, setActivitiesError] = useState('')

  const [subjects, setSubjects] = useState([])
  const [subjectsLoading, setSubjectsLoading] = useState(true)
  const [subjectsError, setSubjectsError] = useState('')

  const [filters, setFilters] = useState({})
  const [offset, setOffset] = useState(0)

  const [pagination, setPagination] = useState({
    limit: PAGE_SIZE,
    offset: 0,
    total: 0,
    has_more: false,
  })

  const [showForm, setShowForm] = useState(false)
  const [editingActivity, setEditingActivity] = useState(null)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  const [refreshKey, setRefreshKey] = useState(0)

  // Cargar el análisis académico.
  useEffect(() => {
    if (!isAuthenticated) return

    const controller = new AbortController()

    async function loadSummary() {
      setSummaryLoading(true)
      setSummaryError('')

      try {
        const data = await getActivitySummary(
          controller.signal
        )

        if (controller.signal.aborted) return

        setSummary(data)
      } catch (error) {
        if (controller.signal.aborted) return

        if (error.response?.status === 401) {
          invalidateSession()
          return
        }

        setSummary(null)
        setSummaryError(
          getOrganizerErrorMessage(error)
        )
      } finally {
        if (!controller.signal.aborted) {
          setSummaryLoading(false)
        }
      }
    }

    loadSummary()

    return () => controller.abort()
  }, [
    isAuthenticated,
    invalidateSession,
    refreshKey,
  ])

  // Cargar el listado con filtros y paginación.
  useEffect(() => {
    if (!isAuthenticated) return

    const controller = new AbortController()

    async function loadActivities() {
      setActivitiesLoading(true)
      setActivitiesError('')

      try {
        const activeFilters = Object.fromEntries(
          Object.entries(filters).filter(
            ([, value]) =>
              value !== '' && value != null
          )
        )

        const response = await getActivities(
          {
            ...activeFilters,
            limit: PAGE_SIZE,
            offset,
          },
          controller.signal
        )

        if (controller.signal.aborted) return

        setActivities(response.data)
        setPagination(response.pagination)
      } catch (error) {
        if (controller.signal.aborted) return

        if (error.response?.status === 401) {
          invalidateSession()
          return
        }

        setActivities([])
        setActivitiesError(
          getOrganizerErrorMessage(error)
        )
      } finally {
        if (!controller.signal.aborted) {
          setActivitiesLoading(false)
        }
      }
    }

    loadActivities()

    return () => controller.abort()
  }, [
    isAuthenticated,
    invalidateSession,
    filters,
    offset,
    refreshKey,
  ])

  // Cargar las materias del horario institucional.
  useEffect(() => {
    if (!isAuthenticated) return

    const controller = new AbortController()

    async function loadSubjects() {
      setSubjectsLoading(true)
      setSubjectsError('')

      try {
        const response = await getStudentSchedule(
          controller.signal
        )

        if (controller.signal.aborted) return

        const currentSubjects =
          extractCurrentSubjects(response.data)

        setSubjects(currentSubjects)

        if (currentSubjects.length === 0) {
          setSubjectsError(
            'No se encontraron materias en el horario actual. Puedes escribir la materia manualmente.'
          )
        }
      } catch (error) {
        if (controller.signal.aborted) return

        if (error.response?.status === 401) {
          invalidateSession()
          return
        }

        setSubjects([])
        setSubjectsError(
          'No fue posible cargar las materias del SII. Puedes escribir la materia manualmente.'
        )
      } finally {
        if (!controller.signal.aborted) {
          setSubjectsLoading(false)
        }
      }
    }

    loadSubjects()

    return () => controller.abort()
  }, [
    isAuthenticated,
    invalidateSession,
  ])

  function refreshData() {
    setRefreshKey((current) => current + 1)
  }

  function handleFiltersChange(newFilters) {
    setFilters(newFilters)
    setOffset(0)
  }

  function handlePageChange(newOffset) {
    setOffset(newOffset)
  }

  function handleCreate() {
    setEditingActivity(null)
    setShowForm(true)
    setActionError('')
    setActionMessage('')
  }

  function handleEdit(activity) {
    setEditingActivity(activity)
    setShowForm(true)
    setActionError('')
    setActionMessage('')
  }

  function handleCancelForm() {
    if (saving) return

    setShowForm(false)
    setEditingActivity(null)
  }

  async function handleSaveActivity(payload) {
    if (saving) return

    setSaving(true)
    setActionError('')
    setActionMessage('')

    try {
      if (!session?.csrf_token) {
        throw new Error(
          'No existe una sesión CSRF válida.'
        )
      }

      if (editingActivity) {
        await updateActivity(
          editingActivity.id,
          payload,
          session.csrf_token
        )

        setActionMessage(
          'La actividad se actualizó correctamente.'
        )
      } else {
        await createActivity(
          payload,
          session.csrf_token
        )

        setActionMessage(
          'La actividad se creó correctamente.'
        )
      }

      setShowForm(false)
      setEditingActivity(null)
      setOffset(0)
      refreshData()
    } catch (error) {
      if (error.response?.status === 401) {
        invalidateSession()
        return
      }

      setActionError(
        getOrganizerErrorMessage(error)
      )
      throw error
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(
    activity,
    newStatus
  ) {
    if (busyId !== null) return

    setBusyId(activity.id)
    setActionError('')
    setActionMessage('')

    try {
      await updateActivity(
        activity.id,
        { status: newStatus },
        session?.csrf_token
      )

      setActionMessage(
        newStatus === 'completada'
          ? 'La actividad se marcó como completada.'
          : 'La actividad se reabrió correctamente.'
      )

      refreshData()
    } catch (error) {
      if (error.response?.status === 401) {
        invalidateSession()
        return
      }

      setActionError(
        getOrganizerErrorMessage(error)
      )
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(activity) {
    if (busyId !== null) return

    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar "${activity.title}"? Esta acción no se puede deshacer.`
    )

    if (!confirmed) return

    setBusyId(activity.id)
    setActionError('')
    setActionMessage('')

    try {
      await deleteActivity(
        activity.id,
        session?.csrf_token
      )

      setActionMessage(
        'La actividad se eliminó correctamente.'
      )

      if (
        activities.length === 1 &&
        offset > 0
      ) {
        setOffset(
          Math.max(0, offset - PAGE_SIZE)
        )
      } else {
        refreshData()
      }
    } catch (error) {
      if (error.response?.status === 401) {
        invalidateSession()
        return
      }

      setActionError(
        getOrganizerErrorMessage(error)
      )
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-slate-900">
            Organizador académico
          </h1>

          <p className="mt-2 text-slate-500">
            Administra tus actividades, organiza
            tus entregas y analiza tu carga de trabajo.
          </p>
        </header>

        {actionError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {actionError}
          </div>
        )}

        {actionMessage && (
          <div
            role="status"
            className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            {actionMessage}
          </div>
        )}

        {summaryLoading ? (
          <LoadingSpinner
            message="Analizando carga académica..."
          />
        ) : summaryError ? (
          <section
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-6"
          >
            <h2 className="font-semibold text-red-800">
              No fue posible cargar el análisis académico
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {summaryError}
            </p>

            <button
              type="button"
              onClick={refreshData}
              className="mt-4 rounded-lg bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-800"
            >
              Reintentar análisis
            </button>
          </section>
        ) : (
          <WorkloadPanel summary={summary} />
        )}

        {showForm && (
          <ActivityForm
            key={editingActivity?.id ?? 'new'}
            activity={editingActivity}
            subjects={subjects}
            subjectsLoading={subjectsLoading}
            subjectsError={subjectsError}
            onSubmit={handleSaveActivity}
            onCancel={handleCancelForm}
            saving={saving}
          />
        )}

        {activitiesError && (
          <section
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <p className="text-sm text-red-700">
              {activitiesError}
            </p>

            <button
              type="button"
              onClick={refreshData}
              className="mt-3 text-sm font-semibold text-red-800 underline"
            >
              Reintentar listado
            </button>
          </section>
        )}

        <ActivityList
          activities={activities}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          pagination={pagination}
          onPageChange={handlePageChange}
          onCreate={handleCreate}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          loading={activitiesLoading}
          busyId={busyId}
        />
      </div>
    </main>
  )
}
