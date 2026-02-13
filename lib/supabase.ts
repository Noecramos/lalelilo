import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Trim env vars to prevent CRLF contamination from deployment environments
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key').trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key').trim();

// Singleton pattern to prevent multiple GoTrueClient instances
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

export const supabase: SupabaseClient = (() => {
    if (!_supabase) {
        _supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
    return _supabase;
})();

// Server-side client with service role key (for admin operations)
export const supabaseAdmin: SupabaseClient = (() => {
    if (!_supabaseAdmin) {
        _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }
    return _supabaseAdmin;
})();
