
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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/calificaciones" element={<Calificaciones />} />
              <Route path="/kardex" element={<Kardex />} />
              <Route path="/horario" element={<Horario />} />
              <Route path="/organizador" element={<Organizador />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
