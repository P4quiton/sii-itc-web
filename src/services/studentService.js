
import { apiClient } from './apiClient'

export async function getStudentProfile(signal) {
  const response = await apiClient.get('/student-profile', {
    signal,
  })

  const profile = response.data?.data

  if (
    !profile ||
    typeof profile !== 'object' ||
    Array.isArray(profile)
  ) {
    throw new Error(
      'El SII devolvió información del estudiante inválida.'
    )
  }

  return profile
}

export async function getStudentGrades(signal) {
  const response = await apiClient.get('/student-grades', {
    signal,
  })

  if (!Array.isArray(response.data?.data)) {
    throw new Error(
      'El SII devolvió un formato de calificaciones inesperado.'
    )
  }

  return response.data
}

export async function getStudentKardex(signal) {
  const response = await apiClient.get('/student-kardex', {
    signal,
  })

  const data = response.data?.data

  if (
    !data ||
    typeof data !== 'object' ||
    !Array.isArray(data.kardex) ||
    typeof data.porcentaje_avance !== 'number'
  ) {
    throw new Error(
      'El SII devolvió un formato de Kardex inesperado.'
    )
  }

  return data
}

export async function getStudentSchedule(signal) {
  const response = await apiClient.get('/student-schedule', {
    signal,
  })

  if (!Array.isArray(response.data?.data)) {
    throw new Error(
      'El SII devolvió un formato de horario inesperado.'
    )
  }

  return response.data
}

export function getStudentErrorMessage(error) {
  const code = error.response?.data?.error?.code

  switch (code) {
    case 'INVALID_SESSION':
    case 'INVALID_TOKEN':
      return 'Tu sesión institucional ha expirado o ya no es válida.'

    case 'SII_UNAVAILABLE':
      return 'No fue posible comunicarse con el SII ITC.'

    case 'SII_UPSTREAM_ERROR':
      return 'El SII no pudo procesar la consulta.'

    case 'SII_INVALID_RESPONSE':
      return 'El SII devolvió una respuesta inesperada.'

    default:
      if (!error.response) {
        return 'No fue posible obtener los datos. Comprueba tu conexión.'
      }

      return 'Ocurrió un error al consultar la información académica.'
  }
}
