import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Trim env vars to prevent CRLF contamination from deployment environments
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key').trim();

// Use globalThis to persist singleton across module re-evaluations
const globalForSupabase = globalThis as unknown as {
    _supabase?: SupabaseClient;
};

// Client-safe Supabase instance (uses anon key, safe for browser)
export const supabase: SupabaseClient =
    globalForSupabase._supabase ??
    (globalForSupabase._supabase = createClient(supabaseUrl, supabaseAnonKey));
