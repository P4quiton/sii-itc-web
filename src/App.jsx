
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CalificacionesPage from './pages/CalificacionesPage'
import KardexPage from './pages/KardexPage'
import HorarioPage from './pages/HorarioPage'
import Organizador from './pages/Organizador'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />

          {/* Rutas privadas */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route
                path="/dashboard"
                element={<Dashboard />}
              />

              <Route
                path="/calificaciones"
                element={<CalificacionesPage />}
              />

              <Route
                path="/kardex"
                element={<KardexPage />}
              />

              <Route
                path="/horario"
                element={<HorarioPage />}
              />

              <Route
                path="/organizador"
                element={<Organizador />}
              />
            </Route>
          </Route>

          {/* Redirecciones */}
          <Route
            path="/"
            element={<Navigate to="/login" replace />}
          />

          <Route
            path="*"
            element={<Navigate to="/login" replace />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
