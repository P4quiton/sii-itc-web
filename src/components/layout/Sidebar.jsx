
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const menuItems = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Calificaciones', path: '/calificaciones' },
  { name: 'Kardex', path: '/kardex' },
  { name: 'Horario', path: '/horario' },
  { name: 'Organizador académico', path: '/organizador' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  const handleLogout = async () => {
    if (loggingOut) return

    setLoggingOut(true)
    setLogoutError('')

    try {
      await logout()
      setMenuOpen(false)
      navigate('/login', { replace: true })
    } catch {
      setLogoutError(
        'No fue posible cerrar la sesión. Inténtalo nuevamente.'
      )
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <aside className="sticky top-0 z-40 w-full shrink-0 bg-slate-900 text-white md:sticky md:top-0 md:flex md:h-screen md:min-h-0 md:w-64 md:flex-col md:overflow-hidden md:p-6">
      <div className="flex min-h-16 items-center justify-between px-4 md:block md:min-h-0 md:px-0">
        <h2 className="text-xl font-bold md:mb-8 md:text-2xl">
          SII ITC
        </h2>

        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-600 text-xl hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:hidden"
        >
          <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
        </button>
      </div>

      <nav
        id="primary-navigation"
        className={`${menuOpen ? 'flex' : 'hidden'} flex-col gap-1 border-t border-slate-700 bg-slate-900 p-3 md:mt-8 md:flex md:flex-1 md:gap-2 md:overflow-y-auto md:border-0 md:bg-transparent md:p-0`}
      >
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              `min-h-11 rounded-lg px-4 py-3 transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className={`${menuOpen ? 'block' : 'hidden'} border-t border-slate-700 bg-slate-900 px-3 pb-4 pt-2 md:mt-auto md:block md:shrink-0 md:border-0 md:px-0 md:pb-0 md:pt-8`}>
        {logoutError && (
          <p
            role="alert"
            className="mb-3 text-sm text-red-300"
          >
            {logoutError}
          </p>
        )}

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full rounded-lg border border-slate-600 px-4 py-3 text-left font-medium text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loggingOut
            ? 'Cerrando sesión...'
            : 'Cerrar sesión'}
        </button>
      </div>
    </aside>
  )
}
