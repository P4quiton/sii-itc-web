
import { apiClient } from './apiClient'

export async function loginWithSII(email, password) {
  const response = await apiClient.post('/auth-login', {
    email: email.trim(),
    password,
  })

  const token = response.data?.message?.login?.token

  if (typeof token !== 'string' || !token.trim()) {
    throw new Error(
      'El SII no devolvió un token de sesión válido.'
    )
  }

  return token
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
        return 'No fue posible conectar con el servidor. Revisa tu conexión o la configuración de CORS.'
      }

      return 'Ocurrió un error al iniciar sesión. Inténtalo nuevamente.'
  }
}
