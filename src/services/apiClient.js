
import axios from 'axios'

const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error(
    'Falta configurar VITE_SUPABASE_PUBLISHABLE_KEY'
  )
}

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 15000,
  withCredentials: true,
  headers: {
    apikey: publishableKey,
    'Content-Type': 'application/json',
  },
})
