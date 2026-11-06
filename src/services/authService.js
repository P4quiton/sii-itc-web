
import { apiClient } from './apiClient'

function validateSessionResponse(response) {
  const session = response.data?.data

  if (
    session?.authenticated !== true ||
    typeof session.expires_at !== 'string' ||
    typeof session.csrf_token !== 'string' ||
    !session.csrf_token
  ) {
    throw new Error(
      'El servidor devolvió una sesión inválida.'
    )
  }

  return session
}

export async function loginWithSII(email, password) {
  const response = await apiClient.post('/auth-login', {
    email: email.trim(),
    password,
  })

  return validateSessionResponse(response)
}

export async function getAuthSession() {
  const response = await apiClient.get('/auth-session')

  return validateSessionResponse(response)
}

export async function logoutFromSII(csrfToken) {
  await apiClient.post(
    '/auth-logout',
    {},
    {
      headers: {
        'X-CSRF-Token': csrfToken,
      },
    }
  )
}

export function getLoginErrorMessage(error) {
  const code = error.response?.data?.error?.code

  switch (code) {
    case 'INVALID_CREDENTIALS':
      return 'Correo o contraseña incorrectos.'

    case 'BAD_REQUEST':
      return 'Verifica los datos ingresados e inténtalo nuevamente.'

    case 'SII_UNAVAILABLE':
      return 'No fue posible comunicarse con el SII ITC.'

    case 'SII_UPSTREAM_ERROR':
      return 'El SII no pudo procesar la solicitud. Inténtalo más tarde.'

    case 'SII_INVALID_RESPONSE':
      return 'El SII devolvió una respuesta inesperada.'

    default:
      if (!error.response) {
        return 'No fue posible conectar con el servidor. Revisa tu conexión.'
      }

      return 'Ocurrió un error al iniciar sesión. Inténtalo nuevamente.'
  }
}
