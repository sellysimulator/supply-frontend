import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import { requireSupabaseEnv } from './requireSupabaseEnv.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Reads the .env files and the VITE_ variables already in process.env, which
  // is how the workflows pass them in; a process variable wins over a file.
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [react(), tailwindcss(), requireSupabaseEnv(env, process.env.REQUIRE_SUPABASE_ENV)],
    server: {
      port: 5173,
    },
  }
})
