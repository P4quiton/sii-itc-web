
export function isTokenExpired(token) {
  if (!token || typeof token !== 'string') {
    return true
  }

  const parts = token.split('.')

  if (parts.length !== 3) {
    return true
  }

  try {
    const base64 = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const payload = JSON.parse(atob(base64))

    if (typeof payload.exp !== 'number') {
      return false
    }

    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}
