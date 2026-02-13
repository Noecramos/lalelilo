import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Trim env vars to prevent CRLF contamination from deployment environments
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key').trim();

// Use globalThis to persist singleton across module re-evaluations
const globalForSupabase = globalThis as unknown as {
    _supabase?: SupabaseClient;
    _supabaseAdmin?: SupabaseClient;
};

// Client-safe Supabase instance (uses anon key, safe for browser)
export const supabase: SupabaseClient =
    globalForSupabase._supabase ??
    (globalForSupabase._supabase = createClient(supabaseUrl, supabaseAnonKey));

// Server-side only admin client — lazy getter to avoid creating a second
// GoTrueClient with the same storage key on the client side
let _adminInitialized = false;
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
    get(_target, prop, receiver) {
        if (!_adminInitialized) {
            const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key').trim();
            globalForSupabase._supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            });
            _adminInitialized = true;
        }
        return Reflect.get(globalForSupabase._supabaseAdmin!, prop, receiver);
    },
});
