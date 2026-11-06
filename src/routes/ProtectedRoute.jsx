
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function ProtectedRoute() {
  const {
    status,
    restoreSession,
  } = useAuth()

  if (status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner message="Verificando sesión..." />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <section
          role="alert"
          className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm"
        >
          <h1 className="text-xl font-bold text-slate-900">
            No pudimos verificar tu sesión
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            No fue posible comunicarse con el servidor.
            Tu sesión podría seguir vigente.
          </p>

          <button
            type="button"
            onClick={restoreSession}
            className="mt-5 rounded-lg bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800"
          >
            Reintentar
          </button>
        </section>
      </main>
    )
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
