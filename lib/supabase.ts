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

// Server-side only admin client — lazy initialization via Proxy
// Avoids creating a second GoTrueClient on the client side
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        if (!globalForSupabase._supabaseAdmin) {
            const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key').trim();
            globalForSupabase._supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            });
        }
        const value = (globalForSupabase._supabaseAdmin as any)[prop];
        // Bind functions to the actual client so method chains work correctly
        if (typeof value === 'function') {
            return value.bind(globalForSupabase._supabaseAdmin);
        }
        return value;
    },
});
