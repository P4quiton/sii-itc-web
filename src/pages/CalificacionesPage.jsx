
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import Calificaciones from '../features/calificaciones/Calificaciones'
import {
  getStudentGrades,
  getStudentErrorMessage,
} from '../services/studentService'
import { adaptGradesResponse } from '../utils/gradesAdapter'

export default function CalificacionesPage() {
  const { token, logout } = useAuth()

  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    async function loadGrades() {
      setLoading(true)
      setError('')
      setGrades([])

      try {
        const response = await getStudentGrades(
          token,
          controller.signal
        )

        if (controller.signal.aborted) return

        setGrades(adaptGradesResponse(response))
      } catch (err) {
        if (controller.signal.aborted) return

        if (err.response?.status === 401) {
          logout()
          return
        }

        setError(getStudentErrorMessage(err))
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadGrades()

    return () => controller.abort()
  }, [token, logout])

  return (
    <Calificaciones
      grades={grades}
      loading={loading}
      error={error}
    />
  )
}
