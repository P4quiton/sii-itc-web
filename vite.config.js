
import { cwd } from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), 'VITE_')

  return {
    plugins: [react(), tailwindcss()],

    server: {
      proxy: {
        '/api': {
          target: env.VITE_SUPABASE_URL,
          changeOrigin: true,
          secure: true,
          rewrite: (path) =>
            path.replace(/^\/api(?=\/|$)/, '/functions/v1'),
        },
      },
    },
  }
})
