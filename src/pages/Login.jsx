
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  loginWithSII,
  getLoginErrorMessage,
} from '../services/authService'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const cleanEmail = email.trim()

    if (!cleanEmail || !password) {
      setError('Todos los campos son obligatorios.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Ingresa un correo electrónico válido.')
      return
    }

    setLoading(true)

    try {
      const session = await loginWithSII(cleanEmail, password)

      login(session)

      setPassword('')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(getLoginErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-700 text-2xl font-bold text-white">
            ITC
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Portal Académico
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Instituto Tecnológico de Celaya
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-5">
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Correo electrónico
            </label>

            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Ingresa tu correo institucional"
              disabled={loading}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Contraseña
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Ingresa tu contraseña"
              disabled={loading}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-400">
          Sistema de consulta académica
        </p>
      </div>
    </main>
  )
}
