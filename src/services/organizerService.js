
import { apiClient } from './apiClient'

const BASE_PATH = '/organizador-api'

function csrfConfig(csrfToken) {
  if (
    typeof csrfToken !== 'string' ||
    !csrfToken.trim()
  ) {
    throw new Error(
      'No se encontró el token CSRF de la sesión.'
    )
  }

  return {
    headers: {
      'X-CSRF-Token': csrfToken,
    },
  }
}

export async function getActivities(
  filters = {},
  signal
) {
  const response = await apiClient.get(
    `${BASE_PATH}/activities`,
    {
      params: filters,
      signal,
    }
  )

  if (
    !Array.isArray(response.data?.data) ||
    !response.data?.pagination
  ) {
    throw new Error(
      'El servidor devolvió un listado de actividades inválido.'
    )
  }

  return response.data
}

export async function getActivity(id) {
  const response = await apiClient.get(
    `${BASE_PATH}/activities/${encodeURIComponent(id)}`
  )

  return response.data.data
}

export async function createActivity(activity, csrfToken) {
  const response = await apiClient.post(
    `${BASE_PATH}/activities`,
    activity,
    csrfConfig(csrfToken)
  )

  return response.data.data
}

export async function updateActivity(
  id,
  changes,
  csrfToken
) {
  const response = await apiClient.patch(
    `${BASE_PATH}/activities/${encodeURIComponent(id)}`,
    changes,
    csrfConfig(csrfToken)
  )

  return response.data.data
}

export async function deleteActivity(id, csrfToken) {
  await apiClient.delete(
    `${BASE_PATH}/activities/${encodeURIComponent(id)}`,
    csrfConfig(csrfToken)
  )
}

export async function getActivitySummary(signal) {
  const response = await apiClient.get(
    `${BASE_PATH}/summary`,
    { signal }
  )

  const summary = response.data?.data

  if (
    !summary ||
    !summary.totals ||
    !summary.deadlines ||
    !summary.workload ||
    !Array.isArray(summary.priority_activities)
  ) {
    throw new Error(
      'El servidor devolvió un resumen académico inválido.'
    )
  }

  return summary
}
