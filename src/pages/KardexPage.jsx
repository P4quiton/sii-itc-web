
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import Kardex from '../features/kardex/Kardex'
import {
  getStudentKardex,
  getStudentErrorMessage,
} from '../services/studentService'

export default function KardexPage() {
  const { token, logout } = useAuth()

  const [records, setRecords] = useState([])
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    async function loadKardex() {
      setLoading(true)
      setError('')
      setRecords([])
      setProgress(null)

      try {
        const data = await getStudentKardex(
          token,
          controller.signal
        )

        if (controller.signal.aborted) return

        setRecords(data.kardex)
        setProgress(data.porcentaje_avance)
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

    loadKardex()

    return () => controller.abort()
  }, [token, logout])

  return (
    <Kardex
      records={records}
      progress={progress}
      loading={loading}
      error={error}
    />
  )
}
