
import axios from 'axios'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !publishableKey) {
  throw new Error(
    'Falta configurar VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY'
  )
}

export const apiClient = axios.create({
  baseURL: `${supabaseUrl.replace(/\/$/, '')}/functions/v1`,
  timeout: 15000,
  headers: {
    apikey: publishableKey,
    'Content-Type': 'application/json',
  },
})

export function withInstitutionalToken(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
}
