import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * The single Supabase client. Everything in the app imports it from here.
 *
 * The publishable key is not a secret — it identifies the project and carries
 * no privileges of its own. What a caller may read or write is decided entirely
 * by the row level security policies in supabase/migrations/.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env and fill in your Supabase project settings.`,
    )
  }
  return value
}

export const supabase = createClient<Database>(
  required('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
  required('VITE_SUPABASE_PUBLISHABLE_KEY', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY),
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

export const CATALOG_IMAGE_BUCKET = 'catalog-images'
