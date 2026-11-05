
import { useCallback, useState } from 'react'
import { AuthContext } from './authContextDefinition'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)

  const login = useCallback((newToken) => {
    setToken(newToken)
  }, [])

  const logout = useCallback(() => {
    setToken(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
