
import {
  apiClient,
  withInstitutionalToken,
} from './apiClient'

const BASE_PATH = '/organizador-api'

function authorizedConfig(token, config = {}) {
  return {
    ...withInstitutionalToken(token),
    ...config,
  }
}

export async function getActivities(
  token,
  filters = {},
  signal
) {
  const response = await apiClient.get(
    `${BASE_PATH}/activities`,
    authorizedConfig(token, {
      params: filters,
      signal,
    })
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

export async function getActivity(token, id) {
  const response = await apiClient.get(
    `${BASE_PATH}/activities/${encodeURIComponent(id)}`,
    authorizedConfig(token)
  )

  return response.data.data
}

export async function createActivity(token, activity) {
  const response = await apiClient.post(
    `${BASE_PATH}/activities`,
    activity,
    authorizedConfig(token)
  )

  return response.data.data
}

export async function updateActivity(token, id, changes) {
  const response = await apiClient.patch(
    `${BASE_PATH}/activities/${encodeURIComponent(id)}`,
    changes,
    authorizedConfig(token)
  )

  return response.data.data
}

export async function deleteActivity(token, id) {
  await apiClient.delete(
    `${BASE_PATH}/activities/${encodeURIComponent(id)}`,
    authorizedConfig(token)
  )
}

export async function getActivitySummary(token, signal) {
  const response = await apiClient.get(
    `${BASE_PATH}/summary`,
    authorizedConfig(token, { signal })
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
