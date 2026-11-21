import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
// Supabase's newer publishable key and the legacy anon key are both safe for
// browser use when database/storage access is protected by RLS.
const publicKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY)?.trim()

export const supabaseConfigured = Boolean(url && publicKey)
export const supabase = supabaseConfigured
  ? createClient<Database>(url!, publicKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null

export const NOTES_BUCKET = 'science-notes'
export const MAX_PDF_BYTES = 50 * 1024 * 1024
