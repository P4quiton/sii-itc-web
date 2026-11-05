
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

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-slate-900 p-6 text-white">
      <h2 className="mb-8 text-2xl font-bold">SII ITC</h2>

      <nav className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `rounded-lg px-4 py-3 transition-colors ${
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

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-lg border border-slate-600 px-4 py-3 text-left font-medium text-slate-200 transition hover:bg-slate-800"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
