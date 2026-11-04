import { NavLink } from 'react-router-dom'

const menuItems = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Calificaciones', path: '/calificaciones' },
  { name: 'Kardex', path: '/kardex' },
  { name: 'Horario', path: '/horario' },
  { name: 'Organizador académico', path: '/organizador' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 bg-slate-900 p-6 text-white">
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
    </aside>
  )
}
