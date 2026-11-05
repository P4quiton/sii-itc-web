
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Calificaciones from './pages/Calificaciones'
import Kardex from './pages/Kardex'
import Horario from './pages/Horario'
import Organizador from './pages/Organizador'

// Datos únicamente para previsualización durante el desarrollo
import { gradesPreview } from './dev/gradesPreview'
import { kardexPreview } from './dev/kardexPreview'
import { schedulePreview } from './dev/schedulePreview'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />

          {/* Rutas exclusivas del entorno de desarrollo */}          
          {import.meta.env.DEV && (
            <Route element={<MainLayout />}>
              <Route
                path="/preview/dashboard"
                element={<Dashboard />}
              />

              <Route
                path="/preview/calificaciones"
                element={<Calificaciones grades={gradesPreview} />}
              />

              <Route
                path="/preview/kardex"
                element={
                  <Kardex
                    records={kardexPreview.records}
                    progress={kardexPreview.progress}
                  />
                }
              />

              <Route
                path="/preview/horario"
                element={<Horario classes={schedulePreview} />}
              />
            </Route>
          )}

          {/* Rutas privadas */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route
                path="/dashboard"
                element={<Dashboard />}
              />

              <Route
                path="/calificaciones"
                element={<Calificaciones />}
              />

              <Route
                path="/kardex"
                element={<Kardex />}
              />

              <Route
                path="/horario"
                element={<Horario />}
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
