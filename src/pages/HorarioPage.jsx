
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import Horario from '../features/horario/Horario'
import {
  getStudentSchedule,
  getStudentErrorMessage,
} from '../services/studentService'
import { adaptScheduleResponse } from '../utils/scheduleAdapter'

export default function HorarioPage() {
  const { isAuthenticated, invalidateSession } = useAuth()

  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) return

    const controller = new AbortController()

    async function loadSchedule() {
      setLoading(true)
      setError('')
      setClasses([])

      try {
        const response = await getStudentSchedule(
          controller.signal
        )

        if (controller.signal.aborted) return

        setClasses(adaptScheduleResponse(response))
      } catch (err) {
        if (controller.signal.aborted) return

        if (err.response?.status === 401) {
          invalidateSession()
          return
        }

        setError(getStudentErrorMessage(err))
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadSchedule()

    return () => controller.abort()
  }, [isAuthenticated, invalidateSession])

  return (
    <Horario
      classes={classes}
      loading={loading}
      error={error}
    />
  )
}
