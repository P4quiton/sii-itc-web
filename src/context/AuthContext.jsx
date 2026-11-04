import { useState } from 'react'
import { AuthContext } from './authContextDefinition'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)

  const login = (newToken) => {
    setToken(newToken)
  }

  const logout = () => {
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
