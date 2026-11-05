
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import WorkloadPanel from '../features/organizador/WorkloadPanel'
import { getActivitySummary } from '../services/organizerService'
import { getStudentErrorMessage } from '../services/studentService'

export default function Organizador() {
  const { token, logout } = useAuth()

  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    async function loadSummary() {
      setLoading(true)
      setError('')

      try {
        const data = await getActivitySummary(
          token,
          controller.signal
        )

        if (controller.signal.aborted) return

        setSummary(data)
      } catch (err) {
        if (controller.signal.aborted) return

        if (err.response?.status === 401) {
          logout()
          return
        }

        setSummary(null)
        setError(getStudentErrorMessage(err))
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadSummary()

    return () => controller.abort()
  }, [token, logout, reloadKey])

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Organizador académico
          </h1>

          <p className="mt-2 text-slate-500">
            Administra tus actividades y analiza tu carga
            de trabajo para planificar tus entregas.
          </p>
        </header>

        {loading ? (
          <LoadingSpinner message="Analizando carga académica..." />
        ) : error ? (
          <section
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-6"
          >
            <h2 className="font-semibold text-red-800">
              No fue posible cargar el análisis académico
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="mt-4 rounded-lg bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-800"
            >
              Reintentar consulta
            </button>
          </section>
        ) : (
          <WorkloadPanel summary={summary} />
        )}
      </div>
    </main>
  )
}
