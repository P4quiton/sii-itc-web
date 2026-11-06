
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import { AuthContext } from './authContextDefinition'
import {
  getAuthSession,
  logoutFromSII,
} from '../services/authService'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState('checking')

  const requestVersion = useRef(0)

  const restoreSession = useCallback(async () => {
    const version = ++requestVersion.current

    setStatus('checking')

    try {
      const restoredSession = await getAuthSession()

      if (version !== requestVersion.current) return

      setSession(restoredSession)
      setStatus('authenticated')
    } catch (error) {
      if (version !== requestVersion.current) return

      setSession(null)

      if (error.response?.status === 401) {
        setStatus('unauthenticated')
      } else {
        setStatus('error')
      }
    }
  }, [])

  useEffect(() => {
    const version = ++requestVersion.current

    getAuthSession()
      .then((restoredSession) => {
        if (version !== requestVersion.current) return

        setSession(restoredSession)
        setStatus('authenticated')
      })
      .catch((error) => {
        if (version !== requestVersion.current) return

        setSession(null)

        if (error.response?.status === 401) {
          setStatus('unauthenticated')
        } else {
          setStatus('error')
        }
      })

    return () => {
      requestVersion.current += 1
    }
  }, [])

  const login = useCallback((newSession) => {
    if (
      newSession?.authenticated !== true ||
      !newSession.csrf_token
    ) {
      throw new Error('La sesión recibida no es válida.')
    }

    requestVersion.current += 1

    setSession(newSession)
    setStatus('authenticated')
  }, [])

  const invalidateSession = useCallback(() => {
    requestVersion.current += 1

    setSession(null)
    setStatus('unauthenticated')
  }, [])

  const logout = useCallback(async () => {
    if (!session?.csrf_token) {
      invalidateSession()
      return
    }

    try {
      await logoutFromSII(session.csrf_token)
      invalidateSession()
    } catch (error) {
      if (error.response?.status === 401) {
        invalidateSession()
        return
      }

      throw error
    }
  }, [session, invalidateSession])

  return (
    <AuthContext.Provider
      value={{
        session,
        status,
        isAuthenticated: status === 'authenticated',
        isChecking: status === 'checking',
        login,
        logout,
        invalidateSession,
        restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
