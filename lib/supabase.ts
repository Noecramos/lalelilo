import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Trim env vars to prevent CRLF contamination from deployment environments
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key').trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key').trim();

// Use globalThis to persist singleton across module re-evaluations (HMR, bundler splits)
const globalForSupabase = globalThis as unknown as {
    _supabase?: SupabaseClient;
    _supabaseAdmin?: SupabaseClient;
};

export const supabase: SupabaseClient =
    globalForSupabase._supabase ??
    (globalForSupabase._supabase = createClient(supabaseUrl, supabaseAnonKey));

// Server-side client with service role key (for admin operations)
export const supabaseAdmin: SupabaseClient =
    globalForSupabase._supabaseAdmin ??
    (globalForSupabase._supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }));
