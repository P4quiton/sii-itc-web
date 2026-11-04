import { useContext } from 'react'
import { AuthContext } from '../context/authContextDefinition'

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider')
  }

  return context
}
