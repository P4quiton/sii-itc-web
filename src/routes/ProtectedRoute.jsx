
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { isTokenExpired } from '../utils/tokenUtils'

export default function ProtectedRoute() {
  const { token } = useAuth()

  if (!token || isTokenExpired(token)) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
