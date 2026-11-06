
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import {
  getStudentProfile,
  getStudentErrorMessage,
} from '../services/studentService'

function displayValue(value) {
  if (value === null || value === undefined || value === '') {
    return 'No disponible'
  }

  return String(value)
}

function getStudentPhoto(foto) {
  if (typeof foto !== 'string' || !foto.trim()) {
    return null
  }

  const cleanBase64 = foto.replace(/\s/g, '')

  if (!cleanBase64) {
    return null
  }

  // Verificar que la cadena tenga formato Base64.
  if (
    !/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64) ||
    cleanBase64.length % 4 !== 0
  ) {
    return null
  }

  // La fotografía devuelta por el SII es un JPEG en Base64.
  return `data:image/jpeg;base64,${cleanBase64}`
}

function StudentPhoto({ foto }) {
  const [imageError, setImageError] = useState(false)

  const photoSrc = getStudentPhoto(foto)

  if (!photoSrc || imageError) {
    return (
      <div
        role="img"
        aria-label="Fotografía del estudiante no disponible"
        className="flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-16 w-16 text-slate-400"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
        </svg>
      </div>
    )
  }

  return (
    <img
      src={photoSrc}
      alt="Fotografía institucional del estudiante"
      onError={() => setImageError(true)}
      className="h-32 w-32 shrink-0 rounded-2xl border border-slate-200 bg-slate-100 object-cover"
    />
  )
}

export default function Dashboard() {
  const { isAuthenticated, invalidateSession } = useAuth()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) return

    const controller = new AbortController()

    async function loadProfile() {
      try {
        const data = await getStudentProfile(
          controller.signal
        )

        if (controller.signal.aborted) return

        setProfile(data)
        setError('')
      } catch (err) {
        if (controller.signal.aborted) return

        if (err.response?.status === 401) {
          invalidateSession()
          return
        }

        setError(getStudentErrorMessage(err))
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      controller.abort()
    }
  }, [isAuthenticated, invalidateSession])

  if (loading) {
    return (
      <LoadingSpinner message="Consultando información del estudiante..." />
    )
  }

  const indicators = [
    {
      title: 'Materias aprobadas',
      value: displayValue(profile?.materias_aprobadas),
      description: 'Historial académico',
    },
    {
      title: 'Promedio general',
      value: displayValue(profile?.promedio_ponderado),
      description: 'Promedio ponderado',
    },
    {
      title: 'Créditos acumulados',
      value: displayValue(profile?.creditos_acumulados),
      description: 'Avance académico',
    },
  ]

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Dashboard
          </h1>

          <p className="mt-2 text-slate-500">
            Consulta tu información académica en un solo lugar.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {error}
          </div>
        )}

        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-semibold text-slate-900">
            Información del estudiante
          </h2>

          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="flex shrink-0 flex-col items-center gap-2">
              <StudentPhoto
                key={profile?.numero_control ?? 'student'}
                foto={profile?.foto}
              />

              <p className="text-center text-xs text-slate-500">
                Fotografía institucional
              </p>
            </div>

            <div className="grid w-full min-w-0 gap-5 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">
                  Nombre completo
                </p>

                <p className="font-medium text-slate-800">
                  {displayValue(profile?.persona)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Número de control
                </p>

                <p className="font-medium text-slate-800">
                  {displayValue(profile?.numero_control)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Correo electrónico
                </p>

                <p className="break-all font-medium text-slate-800">
                  {displayValue(profile?.email)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Semestre
                </p>

                <p className="font-medium text-slate-800">
                  {displayValue(profile?.semestre)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Resumen académico
          </h2>

          <div className="grid gap-5 md:grid-cols-3">
            {indicators.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500">
                  {item.title}
                </p>

                <p className="mt-3 text-3xl font-bold text-blue-700">
                  {item.value}
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <h2 className="text-lg font-semibold text-blue-900">
            Información académica
          </h2>

          <p className="mt-2 text-sm text-blue-800">
            {profile
              ? 'La información mostrada fue consultada mediante el backend institucional del SII ITC.'
              : 'No fue posible cargar la información académica. Puedes intentar nuevamente iniciando sesión.'}
          </p>

          {profile?.porcentaje_avance !== null &&
            profile?.porcentaje_avance !== undefined && (
              <p className="mt-3 text-sm font-semibold text-blue-900">
                Avance académico: {profile.porcentaje_avance}%
              </p>
            )}
        </section>
      </div>
    </main>
  )
}
